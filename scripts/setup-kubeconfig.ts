import { exec } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

const PROFILE = process.env.AWS_PROFILE || 'altar'
const scriptDir = import.meta.dirname ?? new URL('.', import.meta.url).pathname

interface ProjectConfig {
  project_name: string
  github_repo: string
  region: string
  deployment_mode: string
  eks_cluster_name: string
  namespace_prefix: string
  env_cluster_overrides: Record<string, string>
}

interface ClusterConfig {
  name: string
  alias: string
  namespace: string
  region: string
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

  return {
    project_name: projectName,
    github_repo: match('github_repo') || projectName,
    region: match('region') || 'eu-west-1',
    deployment_mode: match('deployment_mode') || 'shared',
    eks_cluster_name: match('eks_cluster_name') || '',
    namespace_prefix: match('namespace_prefix') || match('secret_prefix') || projectName,
    env_cluster_overrides: parseEnvClusterOverrides(content),
  }
}

/** Parse per-environment eks_cluster_name overrides from the environments block */
function parseEnvClusterOverrides(content: string): Record<string, string> {
  const overrides: Record<string, string> = {}
  const envsStart = content.indexOf('environments')
  if (envsStart === -1) return overrides

  // Find the outer braces of the environments block
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
        if (depth === 0) { envBlockEnd = i; break }
      }
    }
    const envBlock = block.slice(envBlockStart, envBlockEnd)
    const clusterMatch = envBlock.match(/eks_cluster_name\s*=\s*"([^"]*)"/)
    if (clusterMatch) overrides[envName] = clusterMatch[1]
  }

  return overrides
}

function resolveCluster(env: string): ClusterConfig {
  const config = readTfvars()

  let clusterName: string

  switch (config.deployment_mode) {
    case 'shared':
      clusterName = config.env_cluster_overrides[env] || config.eks_cluster_name
      if (!clusterName) {
        console.error('❌ eks_cluster_name required for shared deployment mode')
        process.exit(1)
      }
      clusterName = clusterName
      break
    case 'lean':
      clusterName = `${config.project_name}-core-cluster`
      break
    case 'full':
      clusterName = `${config.project_name}-${env === 'prod' ? 'prod' : 'nonprod'}-cluster`
      break
    default:
      console.error(`❌ Unknown deployment_mode: ${config.deployment_mode}`)
      process.exit(1)
  }

  return {
    name: clusterName,
    alias: clusterName,
    namespace: `${config.namespace_prefix}-${env}`,
    region: config.region,
  }
}

async function run() {
  const env = process.argv[2] || 'dev'
  const validEnvs = ['dev', 'staging', 'prod']

  if (!validEnvs.includes(env)) {
    console.error(`❌ Invalid environment: ${env}. Must be one of: ${validEnvs.join(', ')}`)
    process.exit(1)
  }

  const cluster = resolveCluster(env)

  console.log(`\n🔧 Setting up kubeconfig for ${env} (cluster: ${cluster.name})...\n`)

  // Check AWS SSO session
  try {
    await execAsync(`aws sts get-caller-identity --profile ${PROFILE}`)
  } catch {
    console.log(`⚠️  AWS SSO session expired. Running: aws sso login --profile ${PROFILE}\n`)
    const { execSync } = await import('child_process')
    execSync(`aws sso login --profile ${PROFILE}`, { stdio: 'inherit' })
  }

  // Update kubeconfig
  console.log(`📡 Fetching kubeconfig from EKS...`)
  await execAsync(
    `aws eks update-kubeconfig --name ${cluster.name} --region ${cluster.region} --profile ${PROFILE} --alias ${cluster.alias}`,
  )
  console.log(`   ✅ Context "${cluster.alias}" added to ~/.kube/config`)

  // Set default namespace
  console.log(`📁 Setting default namespace to ${cluster.namespace}...`)
  await execAsync(`kubectl config set-context ${cluster.alias} --namespace ${cluster.namespace}`)
  console.log(`   ✅ Default namespace: ${cluster.namespace}`)

  // Switch to the context
  await execAsync(`kubectl config use-context ${cluster.alias}`)
  console.log(`   ✅ Active context: ${cluster.alias}`)

  // Verify connectivity
  console.log(`\n🔍 Verifying cluster connectivity...`)
  try {
    await execAsync(`kubectl get namespace ${cluster.namespace} --no-headers`)
    console.log(`   ✅ Connected — namespace "${cluster.namespace}" exists`)
  } catch {
    console.log(`   ⚠️  Could not verify namespace "${cluster.namespace}" — check RBAC permissions`)
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Quick reference (${env}):

  kubectl get pods                  # List pods in ${cluster.namespace}
  kubectl logs -f deploy/api        # Tail API logs
  kubectl exec -it deploy/api -- sh # Shell into API pod
  kubectl get httproute             # Check HTTP routes
  kubectl get externalsecret        # Check secrets sync

  Switch environment:
  bun setup:kubeconfig dev
  bun setup:kubeconfig staging
  bun setup:kubeconfig prod
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
}

run().catch((err) => {
  console.error('❌ Setup failed:', err.message)
  process.exit(1)
})
