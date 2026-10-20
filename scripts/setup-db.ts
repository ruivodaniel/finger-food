import { exec, spawn } from 'child_process'
import { readFileSync } from 'fs'
import { access, chmod, readFile, writeFile } from 'fs/promises'
import { createServer, Socket } from 'net'
import { homedir } from 'os'
import { dirname, join } from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

const PROFILE = process.env.AWS_PROFILE || 'altar'
const scriptDir = import.meta.dirname ?? new URL('.', import.meta.url).pathname

interface ProjectConfig {
  project_name: string
  github_repo: string
  region: string
  secret_prefix: string
  namespace_prefix: string
  deployment_mode: string
  eks_cluster_name: string
  environments: string[]
}

function readTfvars(): ProjectConfig {
  const tfvarsPath = join(scriptDir, '..', 'terraform', 'deployment', 'terraform.tfvars')
  let content: string

  try {
    content = readFileSync(tfvarsPath, 'utf-8')
  } catch {
    console.error(`❌ Cannot read ${tfvarsPath}`)
    console.error('   Ensure terraform/deployment/terraform.tfvars exists.')
    process.exit(1)
  }

  const match = (key: string) => {
    const m = content.match(new RegExp(`^${key}\\s*=\\s*"([^"]*)"`, 'm')) // nosemgrep: detect-non-literal-regexp
    return m?.[1]
  }

  const projectName = match('project_name')
  if (!projectName) {
    console.error('❌ project_name not found in terraform.tfvars')
    process.exit(1)
  }

  // Parse environments block — extract keys where enabled != false
  const envs: string[] = []
  const envsStart = content.indexOf('environments')
  if (envsStart !== -1) {
    let braceDepth = 0
    let blockStart = -1
    let blockEnd = -1
    for (let i = content.indexOf('{', envsStart); i < content.length; i++) {
      if (content[i] === '{') {
        if (braceDepth === 0) blockStart = i + 1
        braceDepth++
      } else if (content[i] === '}') {
        braceDepth--
        if (braceDepth === 0) {
          blockEnd = i
          break
        }
      }
    }
    if (blockStart > 0 && blockEnd > blockStart) {
      const block = content.slice(blockStart, blockEnd)
      let depth = 0
      for (const line of block.split('\n')) {
        const prevDepth = depth
        for (const ch of line) {
          if (ch === '{') depth++
          if (ch === '}') depth--
        }
        if (prevDepth === 0) {
          const envMatch = line.match(/^\s*(\w+)\s*=/)
          if (envMatch && !line.includes('enabled = false')) {
            envs.push(envMatch[1])
          }
        }
      }
    }
  }

  return {
    project_name: projectName,
    github_repo: match('github_repo') || projectName,
    region: match('region') || 'eu-west-1',
    secret_prefix: match('secret_prefix') || match('namespace_prefix') || projectName,
    namespace_prefix: match('namespace_prefix') || match('secret_prefix') || projectName,
    deployment_mode: match('deployment_mode') || 'shared',
    eks_cluster_name: match('eks_cluster_name') || '',
    environments: envs.length > 0 ? envs : ['dev', 'staging'],
  }
}

const config = readTfvars()

const TUNNEL_BASE_PORT = 54330
const TUNNEL_RUN_ID = sanitizeNameSegment(`${process.env.USER || 'user'}-${process.pid}`)

function resolveEnvironments(): string[] {
  const arg = process.argv.find((a) => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1])
  if (arg) {
    if (!config.environments.includes(arg)) {
      console.error(`❌ Invalid environment: ${arg}. Must be one of: ${config.environments.join(', ')}`)
      process.exit(1)
    }
    return [arg]
  }
  return [...config.environments]
}

const isSsmTunnelMode = process.argv.includes('--tunnel') || process.argv.includes('--ssm')
const isKubernetesTunnelMode = process.argv.includes('--k8s-tunnel')

if (isSsmTunnelMode && isKubernetesTunnelMode) {
  console.error('❌ Use only one tunnel mode: --tunnel/--ssm or --k8s-tunnel')
  process.exit(1)
}

function sanitizeNameSegment(value: string): string {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+|-+$/g, '')
  return sanitized || 'session'
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => server.close(() => resolve(true)))
    server.listen(port, '127.0.0.1')
  })
}

async function findAvailablePort(start: number): Promise<number> {
  for (let port = start; port < start + 1000; port++) {
    if (await isPortAvailable(port)) return port
  }
  throw new Error(`No available local port found from ${start} to ${start + 999}`)
}

async function waitForLocalPort(port: number, timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const connected = await new Promise<boolean>((resolve) => {
      const socket = new Socket()
      socket.setTimeout(500)
      socket.once('connect', () => {
        socket.destroy()
        resolve(true)
      })
      socket.once('timeout', () => {
        socket.destroy()
        resolve(false)
      })
      socket.once('error', () => resolve(false))
      socket.connect(port, '127.0.0.1')
    })

    if (connected) return
    await delay(500)
  }

  throw new Error(`Local port ${port} did not become available within ${timeoutMs / 1000}s`)
}

function parseEnvClusterOverrides(content: string): Record<string, string> {
  const overrides: Record<string, string> = {}
  const envsStart = content.indexOf('environments')
  if (envsStart === -1) return overrides

  let braceDepth = 0
  let blockStart = -1
  let blockEnd = -1
  const firstBrace = content.indexOf('{', envsStart)
  if (firstBrace === -1) return overrides

  for (let i = firstBrace; i < content.length; i++) {
    if (content[i] === '{') {
      if (braceDepth === 0) blockStart = i + 1
      braceDepth++
    } else if (content[i] === '}') {
      braceDepth--
      if (braceDepth === 0) {
        blockEnd = i
        break
      }
    }
  }
  if (blockStart < 0 || blockEnd <= blockStart) return overrides

  const block = content.slice(blockStart, blockEnd)
  const envRegex = /^\s*(\w+)\s*=\s*\{/gm
  let envMatch: RegExpExecArray | null
  while ((envMatch = envRegex.exec(block)) !== null) {
    const envName = envMatch[1]
    const envBlockStart = envMatch.index + envMatch[0].length
    let depth = 1
    let envBlockEnd = envBlockStart
    for (let i = envBlockStart; i < block.length; i++) {
      if (block[i] === '{') depth++
      if (block[i] === '}') {
        depth--
        if (depth === 0) {
          envBlockEnd = i
          break
        }
      }
    }
    const envBlock = block.slice(envBlockStart, envBlockEnd)
    const clusterMatch = envBlock.match(/eks_cluster_name\s*=\s*"([^"]*)"/)
    if (clusterMatch) overrides[envName] = clusterMatch[1]
  }

  return overrides
}

function resolveCluster(env: string): { name: string; namespace: string; region: string } {
  const tfvarsPath = join(scriptDir, '..', 'terraform', 'deployment', 'terraform.tfvars')
  const content = readFileSync(tfvarsPath, 'utf-8')
  const overrides = parseEnvClusterOverrides(content)

  const deploymentMode = config.deployment_mode || 'shared'
  let clusterName: string

  switch (deploymentMode) {
    case 'shared':
      clusterName = overrides[env] || config.eks_cluster_name
      break
    case 'lean':
      clusterName = `${config.project_name}-core-cluster`
      break
    case 'full':
      clusterName = `${config.project_name}-${env === 'prod' ? 'prod' : 'nonprod'}-cluster`
      break
    default:
      clusterName = config.eks_cluster_name
  }

  return {
    name: clusterName,
    namespace: `${config.namespace_prefix}-${env}`,
    region: config.region,
  }
}

interface TunnelProcess {
  env: string
  localPort: number
  proc: ReturnType<typeof spawn>
}

async function findOnlineSsmRelayInstanceId(environment: string): Promise<string> {
  const relayFilters = [
    `Name=tag:Project,Values=${config.project_name}`,
    `Name=tag:Name,Values=${config.project_name}-${environment}-db-access-ssm`,
    `Name=tag:Environment,Values=${environment}`,
    'Name=tag:DatabaseAccess,Values=ssm-relay',
    'Name=instance-state-name,Values=running',
  ]
    .map((filter) => `"${filter}"`)
    .join(' ')

  const { stdout } = await execAsync(
    `AWS_PAGER="" aws ec2 describe-instances --region ${config.region} --profile ${PROFILE} --filters ${relayFilters} --query "Reservations[].Instances[].InstanceId" --output text`,
  )
  const instanceIds = stdout.trim().split(/\s+/).filter(Boolean)

  if (instanceIds.length === 0) {
    throw new Error(`No running SSM DB relay instance found for ${environment}`)
  }

  for (let attempt = 0; attempt < 15; attempt++) {
    const { stdout: ssmStdout } = await execAsync(
      `AWS_PAGER="" aws ssm describe-instance-information --region ${config.region} --profile ${PROFILE} --filters "Key=InstanceIds,Values=${instanceIds.join(',')}" --query "InstanceInformationList[?PingStatus=='Online'].InstanceId | [0]" --output text`,
    )
    const onlineInstanceId = ssmStdout.trim()
    if (onlineInstanceId && onlineInstanceId !== 'None') return onlineInstanceId
    await delay(2000)
  }

  throw new Error(`SSM DB relay for ${environment} is running but not online in Systems Manager yet`)
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function resolveSessionManagerPluginPath(): Promise<string> {
  try {
    const { stdout } = await execAsync('command -v session-manager-plugin')
    const pluginPath = stdout.trim().split('\n')[0]
    if (pluginPath) return pluginPath
  } catch {
    // Fall through to common install paths.
  }

  const candidates = [
    join(homedir(), '.local', 'bin', 'session-manager-plugin'),
    '/opt/homebrew/bin/session-manager-plugin',
    '/usr/local/bin/session-manager-plugin',
    '/usr/local/sessionmanagerplugin/bin/session-manager-plugin',
  ]

  for (const candidate of candidates) {
    if (await pathExists(candidate)) return candidate
  }

  throw new Error(
    'AWS Session Manager plugin is not installed. On macOS, install it with: brew install --cask session-manager-plugin',
  )
}

async function startSsmTunnels(creds: DbCredentials[]): Promise<Map<string, number>> {
  const portMap = new Map<string, number>()
  const tunnels: TunnelProcess[] = []

  const sessionManagerPluginPath = await resolveSessionManagerPluginPath()
  const sessionEnv = {
    ...process.env,
    AWS_PAGER: '',
    PATH: `${dirname(sessionManagerPluginPath)}:${process.env.PATH || ''}`,
  }

  console.log(`\n${'━'.repeat(70)}`)
  console.log(`  STARTING SSM SESSION MANAGER TUNNELS`)
  console.log(`${'━'.repeat(70)}\n`)

  let nextPort = TUNNEL_BASE_PORT

  for (const db of creds) {
    const localPort = await findAvailablePort(nextPort)
    nextPort = localPort + 1
    const instanceId = await findOnlineSsmRelayInstanceId(db.environment)

    console.log(`  🔗 ${db.environment.toUpperCase()}: 127.0.0.1:${localPort} → ${db.host}:${db.port}`)
    console.log(`     via SSM relay ${instanceId}`)

    const proc = spawn(
      'aws',
      [
        'ssm',
        'start-session',
        '--target',
        instanceId,
        '--document-name',
        'AWS-StartPortForwardingSessionToRemoteHost',
        '--parameters',
        JSON.stringify({ host: [db.host], portNumber: [db.port], localPortNumber: [String(localPort)] }),
        '--region',
        config.region,
        '--profile',
        PROFILE,
      ],
      { stdio: ['ignore', 'ignore', 'inherit'], env: sessionEnv },
    )

    tunnels.push({ env: db.environment, localPort, proc })
    portMap.set(db.environment, localPort)

    try {
      await waitForLocalPort(localPort)
      console.log(`     ✅ SSM tunnel active`)
    } catch (err) {
      proc.kill()
      throw new Error(`Could not establish SSM tunnel for ${db.environment}: ${getErrorMessage(err)}`)
    }
  }

  const cleanup = async () => {
    console.log(`\n\n🧹 Closing SSM sessions...`)
    for (const t of tunnels) t.proc.kill()
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  return portMap
}

async function ensureKubeContext(env: string): Promise<void> {
  const cluster = resolveCluster(env)
  try {
    const { stdout } = await execAsync(`kubectl config current-context`)
    if (stdout.trim() === cluster.name) return
  } catch {
    // no context set
  }

  console.log(`  📡 Switching kubectl context → ${cluster.name} (${cluster.namespace})...`)
  try {
    await execAsync(`kubectl config use-context ${cluster.name}`)
    await execAsync(`kubectl config set-context ${cluster.name} --namespace ${cluster.namespace}`)
  } catch {
    console.log(`  📡 Context not found locally, fetching from EKS...`)
    await execAsync(
      `aws eks update-kubeconfig --name ${cluster.name} --region ${cluster.region} --profile ${PROFILE} --alias ${cluster.name}`,
    )
    await execAsync(`kubectl config set-context ${cluster.name} --namespace ${cluster.namespace}`)
    await execAsync(`kubectl config use-context ${cluster.name}`)
  }
}

async function startKubernetesTunnels(creds: DbCredentials[]): Promise<Map<string, number>> {
  const portMap = new Map<string, number>()
  const tunnels: TunnelProcess[] = []

  console.log(`\n${'━'.repeat(70)}`)
  console.log(`  STARTING LEGACY KUBERNETES PORT-FORWARD TUNNELS`)
  console.log(`${'━'.repeat(70)}\n`)

  // Group envs by cluster to minimize context switches
  const envsByCluster = new Map<string, DbCredentials[]>()
  for (const db of creds) {
    const cluster = resolveCluster(db.environment)
    const existing = envsByCluster.get(cluster.name) || []
    existing.push(db)
    envsByCluster.set(cluster.name, existing)
  }

  let portOffset = 0

  for (const [clusterName, clusterCreds] of envsByCluster) {
    const firstEnv = clusterCreds[0].environment
    await ensureKubeContext(firstEnv)

    for (const db of clusterCreds) {
      const localPort = await findAvailablePort(TUNNEL_BASE_PORT + portOffset++)
      const cluster = resolveCluster(db.environment)
      const namespace = cluster.namespace

      const svcHost = db.host
      const svcPort = db.port

      console.log(`  🔗 ${db.environment.toUpperCase()}: 127.0.0.1:${localPort} → ${svcHost}:${svcPort}`)
      console.log(`     via ${clusterName}/${namespace}`)

      const podName = `db-tunnel-${db.environment}-${TUNNEL_RUN_ID}`.slice(0, 63).replace(/-+$/g, '')
      const tunnelImage = 'alpine/socat:latest'

      // Create tunnel pod with PodSecurity-compliant security context
      const relayPort = 15432
      const podOverrides = JSON.stringify({
        apiVersion: 'v1',
        spec: {
          containers: [
            {
              name: podName,
              image: tunnelImage,
              command: ['socat', `TCP-LISTEN:${relayPort},fork,reuseaddr`, `TCP:${svcHost}:${svcPort}`],
              ports: [{ containerPort: relayPort }],
              securityContext: {
                allowPrivilegeEscalation: false,
                runAsNonRoot: true,
                runAsUser: 65534,
                capabilities: { drop: ['ALL'] },
                seccompProfile: { type: 'RuntimeDefault' },
              },
            },
          ],
        },
      })

      await execAsync(
        `kubectl run ${podName} -n ${namespace} --context ${clusterName} ` +
          `--image=${tunnelImage} --restart=Never ` +
          `--overrides='${podOverrides}'`,
      )

      // Wait for pod to be ready
      console.log(`     ⏳ Waiting for tunnel pod...`)
      try {
        await execAsync(
          `kubectl wait --for=condition=Ready pod/${podName} -n ${namespace} --context ${clusterName} --timeout=30s`,
        )
      } catch {
        console.error(`     ❌ Tunnel pod ${podName} failed to start. Skipping ${db.environment}.`)
        continue
      }

      // Start port-forward as a background process
      const pf = spawn(
        'kubectl',
        ['port-forward', `pod/${podName}`, `${localPort}:${relayPort}`, '-n', namespace, '--context', clusterName],
        { stdio: 'ignore', detached: true },
      )
      pf.unref()

      tunnels.push({ env: db.environment, localPort, proc: pf })
      portMap.set(db.environment, localPort)

      await waitForLocalPort(localPort)

      console.log(`     ✅ Tunnel active`)
    }
  }

  // Register cleanup handler
  const cleanup = async () => {
    console.log(`\n\n🧹 Cleaning up tunnel pods...`)
    for (const t of tunnels) {
      t.proc.kill()
      const cluster = resolveCluster(t.env)
      const podName = `db-tunnel-${t.env}-${TUNNEL_RUN_ID}`.slice(0, 63).replace(/-+$/g, '')
      try {
        await execAsync(
          `kubectl delete pod ${podName} -n ${cluster.namespace} --context ${cluster.name} --ignore-not-found`,
        )
        console.log(`   ✅ Removed ${podName}`)
      } catch {
        console.error(`   ⚠️  Could not remove ${podName}`)
      }
    }
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  return portMap
}

interface DbCredentials {
  environment: string
  host: string
  port: string
  database: string
  username: string
  password: string
}

async function fetchSecretValue(secretId: string): Promise<Record<string, string>> {
  const { stdout } = await execAsync(
    `AWS_PAGER="" aws secretsmanager get-secret-value --secret-id "${secretId}" --region ${config.region} --profile ${PROFILE} --query SecretString --output text`,
  )
  return JSON.parse(stdout.trim())
}

async function getDbCredentials(): Promise<DbCredentials[]> {
  const results: DbCredentials[] = []
  const envs = resolveEnvironments()

  for (const env of envs) {
    const secretId = `${config.secret_prefix}/${env}/terraform`
    try {
      const secret = await fetchSecretValue(secretId)
      const databaseUrl = secret.DATABASE_URL || ''

      if (!databaseUrl) {
        console.error(`⚠️  ${env}: DATABASE_URL is empty in ${secretId}`)
        continue
      }

      const url = new URL(databaseUrl)

      results.push({
        environment: env,
        host: url.hostname,
        port: url.port || '5432',
        database: url.pathname.replace(/^\//, ''),
        username: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
      })
    } catch (err) {
      console.error(`⚠️  Could not fetch ${secretId}: ${getErrorMessage(err)}`)
    }
  }

  return results
}

function printConnectionInfo(creds: DbCredentials[]) {
  console.log(`\n${'━'.repeat(70)}`)
  console.log(`  DATABASE CONNECTION INFO`)
  console.log(`${'━'.repeat(70)}`)

  for (const db of creds) {
    console.log(`
  ┌─ ${db.environment.toUpperCase()} ─────────────────────────────────────────
  │ Host:     ${db.host}
  │ Port:     ${db.port}
  │ Database: ${db.database}
  │ Username: ${db.username}
  │ Password: stored in ~/.pgpass (not printed)
  └──────────────────────────────────────────────────`)
  }
}

function printPsqlCommands(creds: DbCredentials[], portMap?: Map<string, number>) {
  console.log(`\n${'━'.repeat(70)}`)
  console.log(`  PSQL COMMANDS (copy-paste)`)
  console.log(`${'━'.repeat(70)}\n`)

  for (const db of creds) {
    const localPort = portMap?.get(db.environment)
    const host = localPort ? '127.0.0.1' : db.host
    const port = localPort ?? parseInt(db.port)
    const connStr = `postgresql://${db.username}@${host}:${port}/${db.database}?sslmode=require`
    console.log(`  # ${db.environment.toUpperCase()}`)
    console.log(`  psql "${connStr}"\n`)
  }
}

interface PgAdminServer {
  Name: string
  Group: string
  Host: string
  Port: number
  MaintenanceDB: string
  Username: string
  SSLMode: string
  PassFile?: string
}

function generatePgAdminServers(
  creds: DbCredentials[],
  portMap?: Map<string, number>,
): { Servers: Record<string, PgAdminServer> } {
  const servers: Record<string, PgAdminServer> = {}

  creds.forEach((db, i) => {
    const localPort = portMap?.get(db.environment)
    servers[String(i + 1)] = {
      Name: `${config.github_repo} ${db.environment}${localPort ? ' (tunnel)' : ''}`,
      Group: config.github_repo,
      Host: localPort ? '127.0.0.1' : db.host,
      Port: localPort ?? parseInt(db.port),
      MaintenanceDB: db.database,
      Username: db.username,
      SSLMode: 'require',
    }
  })

  return { Servers: servers }
}

function generatePgpassEntries(creds: DbCredentials[], portMap?: Map<string, number>): string {
  return (
    creds
      .map((db) => {
        const localPort = portMap?.get(db.environment)
        const host = localPort ? '127.0.0.1' : db.host
        const port = localPort ?? parseInt(db.port)
        return `${host}:${port}:${db.database}:${db.username}:${db.password}`
      })
      .join('\n') + '\n'
  )
}

function getPgpassEntryKey(line: string): string | undefined {
  const parts = line.split(':')
  if (parts.length < 5) return undefined
  return parts.slice(0, 4).join(':')
}

function mergePgpassEntries(existing: string, entries: string): { content: string; count: number; changed: boolean } {
  const newEntries = entries.split('\n').filter((line) => line.trim())
  const newKeys = new Set(newEntries.map(getPgpassEntryKey).filter((key): key is string => Boolean(key)))
  const retainedEntries = existing.split('\n').filter((line) => {
    if (!line.trim()) return false
    const key = getPgpassEntryKey(line)
    return !key || !newKeys.has(key)
  })
  const content = [...retainedEntries, ...newEntries].join('\n') + '\n'

  return {
    content,
    count: newEntries.length,
    changed: content !== existing,
  }
}

async function run() {
  console.log(`\n🔧 Setting up database access for ${config.github_repo}...`)
  if (isSsmTunnelMode) {
    console.log(`   Mode: SSM Session Manager tunnel`)
  }
  if (isKubernetesTunnelMode) {
    console.log(`   Mode: legacy kubectl port-forward tunnel`)
  }
  console.log()

  // Check AWS SSO session
  try {
    await execAsync(`aws sts get-caller-identity --profile ${PROFILE}`)
  } catch {
    console.log(`⚠️  AWS SSO session expired. Running: aws sso login --profile ${PROFILE}\n`)
    const { execSync } = await import('child_process')
    execSync(`aws sso login --profile ${PROFILE}`, { stdio: 'inherit' })
  }

  const creds = await getDbCredentials()
  if (creds.length === 0) {
    console.error('❌ No credentials found.')
    process.exit(1)
  }

  // Start tunnels if requested
  let portMap: Map<string, number> | undefined
  if (isSsmTunnelMode) {
    portMap = await startSsmTunnels(creds)
  } else if (isKubernetesTunnelMode) {
    portMap = await startKubernetesTunnels(creds)
  }

  // 1. Print connection info (with tunneled addresses if applicable)
  printConnectionInfo(creds)
  if (portMap) {
    console.log(`\n${'━'.repeat(70)}`)
    console.log(`  LOCAL TUNNEL ADDRESSES`)
    console.log(`${'━'.repeat(70)}`)
    for (const db of creds) {
      const localPort = portMap.get(db.environment)
      if (localPort) {
        console.log(`
  ┌─ ${db.environment.toUpperCase()} (tunnel) ──────────────────────────────────
  │ Host:     127.0.0.1
  │ Port:     ${localPort}
  │ Database: ${db.database}
  │ Username: ${db.username}
  │ Password: stored in ~/.pgpass (not printed)
  └──────────────────────────────────────────────────`)
      }
    }
  }

  // 2. Write .pgpass entries (idempotent — skips duplicates)
  const pgpassPath = join(homedir(), '.pgpass')
  const entries = generatePgpassEntries(creds, portMap)

  let existing = ''
  try {
    existing = await readFile(pgpassPath, 'utf-8')
  } catch {
    // File doesn't exist yet
  }

  const mergedPgpass = mergePgpassEntries(existing, entries)

  if (mergedPgpass.changed) {
    await writeFile(pgpassPath, mergedPgpass.content)
    await chmod(pgpassPath, 0o600)
    console.log(`\n📄 Updated ${mergedPgpass.count} entries in ${pgpassPath}`)
  } else {
    console.log(`\n📄 ~/.pgpass already up to date`)
  }

  // 3. Export pgAdmin servers.json
  const pgAdminConfig = generatePgAdminServers(creds, portMap)
  const outPath = join(process.cwd(), 'pgadmin-servers.json')
  await writeFile(outPath, JSON.stringify(pgAdminConfig, null, 2) + '\n')
  console.log(`📄 Exported pgAdmin config: ${outPath}`)

  // 4. Print psql commands + summary
  printPsqlCommands(creds, portMap)

  console.log(`${'━'.repeat(70)}`)
  console.log(`  DONE`)
  console.log(`${'━'.repeat(70)}`)

  if (isSsmTunnelMode || isKubernetesTunnelMode) {
    console.log(`
  ✅ ~/.pgpass updated (psql auto-authenticates)
  ✅ pgadmin-servers.json exported (pointing to local tunnels)
  ✅ Database tunnels active

  ⚠️  Keep this process running — tunnels close when it exits.
  Press Ctrl+C to stop tunnels and clean up.
`)
    // Keep alive until SIGINT/SIGTERM
    await new Promise(() => {})
  } else {
    console.log(`
  ✅ ~/.pgpass updated (psql auto-authenticates)
  ✅ pgadmin-servers.json exported
     → pgAdmin: Tools → Import/Export Servers → Import → select the file
     → Passwords are NOT in the file (pgAdmin will prompt on first connect)

  💡 RDS is in private subnets. To connect from your machine:
     pnpm setup:db --tunnel             # All environments via SSM
     pnpm setup:db ${config.environments[0] || 'develop'} --tunnel     # Single environment via SSM
     pnpm setup:db ${config.environments[0] || 'develop'} --k8s-tunnel # Legacy Kubernetes fallback
`)
  }
}

run().catch((err) => {
  console.error('❌ Failed:', getErrorMessage(err))
  process.exit(1)
})
