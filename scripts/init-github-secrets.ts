import { exec } from "child_process";
import readline from "readline";
import { fileURLToPath } from "url";
import { promisify } from "util";

const __filename = fileURLToPath(import.meta.url);
const execAsync = promisify(exec);

// GitHub secrets configuration
// CRITICAL WARNING: Modify this only for initial setup, then make sure to discard the file changes so it doesn't get committed!
const GITHUB_SECRETS = {
  AWS_ACCESS_KEY_ID: "",
  AWS_DEFAULT_REGION: "",
  AWS_SECRET_ACCESS_KEY: "",
  GH_REGISTRY_PAT: "",
  GH_REGISTRY_USERNAME: "",
  TF_ORGANIZATION: "",
  TF_PROJECT_NAME: "",
  TF_TOKEN: "",
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisify readline question
const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

// Mask secret value for display
const maskSecret = (value: string): string => {
  if (value.length === 0) return "***EMPTY***";
  if (value.length === 1) return "*";
  if (value.length === 2) return value[0] + "*";

  const firstChar = value[0];
  const lastChar = value[value.length - 1];
  const middleLength = value.length - 2;
  const maskedMiddle = "*".repeat(middleLength);

  return firstChar + maskedMiddle + lastChar;
};

// Extract org and repo from GitHub URL
const extractGitHubInfo = (url: string): { org: string; repo: string } | null => {
  const patterns = [
    /https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/)?$/,
    /git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        org: match[1],
        repo: match[2],
      };
    }
  }

  return null;
};

// Validation functions
const validateGitHubUrl = (url: string): boolean => {
  return extractGitHubInfo(url) !== null;
};

// Get GitHub repository information from current directory
const getGitHubInfo = async (): Promise<{ org: string; repo: string }> => {
  try {
    console.log("🔍 Detecting current GitHub repository...");

    // Get the remote origin URL
    const { stdout } = await execAsync("git remote get-url origin");
    const remoteUrl = stdout.trim();

    if (!remoteUrl) {
      throw new Error("No remote URL found for the origin.");
    }

    // Validate if it's a GitHub URL
    if (!validateGitHubUrl(remoteUrl)) {
      console.log("❌ Current repository is not a GitHub repository.");
      console.log(`   Remote URL: ${remoteUrl}`);
      console.log("💡 This script only works with GitHub repositories.");
      process.exit(1);
    }

    const info = extractGitHubInfo(remoteUrl)!;
    console.log("✅ GitHub repository detected!");
    console.log(`   Repository: ${info.org}/${info.repo}`);

    return info;
  } catch (error) {
    console.log("❌ Not in a Git repository.");
    console.log("💡 Please run this script from within a GitHub repository directory.");
    process.exit(1);
  }
};

// Confirm repository information
const confirmRepository = async (org: string, repo: string): Promise<boolean> => {
  console.log("\n📋 Repository Information:");
  console.log(`   Organization: ${org}`);
  console.log(`   Repository: ${repo}`);
  console.log(`   Full Path: ${org}/${repo}\n`);

  while (true) {
    const input = await question("❓ Is this correct? (y/n): ");
    const answer = input.toLowerCase().trim();

    if (answer === "y" || answer === "yes") {
      console.log("✅ Repository confirmed!");
      return true;
    } else if (answer === "n" || answer === "no") {
      console.log("❌ Repository not confirmed. Please start over.");
      return false;
    } else {
      console.log("❌ Please answer 'y' or 'n'");
    }
  }
};

// Confirm secrets before injection
const confirmSecrets = async (): Promise<boolean> => {
  console.log("\n🔐 Secrets to be injected:");
  Object.entries(GITHUB_SECRETS).forEach(([name, value]) => {
    console.log(`   🔑 ${name}: ${maskSecret(value)}`);
  });

  console.log("");
  while (true) {
    const input = await question("❓ Are these secrets correct? (y/n): ");
    const answer = input.toLowerCase().trim();

    if (answer === "y" || answer === "yes") {
      console.log("✅ Secrets confirmed!");
      return true;
    } else if (answer === "n" || answer === "no") {
      console.log("❌ Secrets not confirmed. Please update the GITHUB_SECRETS constant and restart.");
      return false;
    } else {
      console.log("❌ Please answer 'y' or 'n'");
    }
  }
};

// Check if GitHub CLI is installed
const checkGitHubCLI = async (): Promise<boolean> => {
  try {
    await execAsync("gh --version");
    return true;
  } catch (error) {
    return false;
  }
};

// Check if user is authenticated with GitHub CLI
const checkGitHubAuth = async (): Promise<boolean> => {
  try {
    await execAsync("gh auth status");
    return true;
  } catch (error) {
    return false;
  }
};

// Set GitHub repository secret
const setRepositorySecret = async (
  org: string,
  repo: string,
  secretName: string,
  secretValue: string,
): Promise<boolean> => {
  try {
    if (secretValue.trim() === "") {
      console.log(`⏭️  Skipping empty secret: ${secretName}`);
      return true;
    }

    const command = `gh secret set ${secretName} --body "${secretValue}" --repo ${org}/${repo}`;
    await execAsync(command);
    console.log(`✅ Set secret: ${secretName}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to set secret ${secretName}: ${(error as Error).message}`);
    return false;
  }
};

// Set all repository secrets
const setAllSecrets = async (org: string, repo: string): Promise<void> => {
  console.log("🔐 Setting repository secrets...\n");

  let successCount = 0;
  let failureCount = 0;

  for (const [secretName, secretValue] of Object.entries(GITHUB_SECRETS)) {
    const success = await setRepositorySecret(org, repo, secretName, secretValue);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }

  console.log(`\n📊 Secrets Summary:`);
  console.log(`   ✅ Successfully set: ${successCount}`);
  console.log(`   ❌ Failed to set: ${failureCount}`);
  console.log(`   📝 Total secrets: ${Object.keys(GITHUB_SECRETS).length}`);
};

// Main function
const main = async (): Promise<void> => {
  console.log("🔐 Starting GitHub Repository Secrets Injection\n");

  try {
    // Check GitHub CLI installation
    console.log("🔍 Checking GitHub CLI installation...");
    const hasGitHubCLI = await checkGitHubCLI();
    if (!hasGitHubCLI) {
      console.log("❌ GitHub CLI is not installed or not in PATH.");
      console.log("💡 Please install GitHub CLI: https://cli.github.com/");
      return;
    }
    console.log("✅ GitHub CLI is installed!");

    // Check GitHub authentication
    console.log("🔍 Checking GitHub authentication...");
    const isAuthenticated = await checkGitHubAuth();
    if (!isAuthenticated) {
      console.log("❌ You are not authenticated with GitHub CLI.");
      console.log("💡 Please run 'gh auth login' to authenticate.");
      return;
    }
    console.log("✅ GitHub authentication verified!");

    // Get repository information
    const { org, repo } = await getGitHubInfo();

    // Confirm repository
    const repositoryConfirmed = await confirmRepository(org, repo);
    if (!repositoryConfirmed) {
      console.log("🔄 Please restart the script with the correct repository information.");
      return;
    }

    // Confirm secrets
    const secretsConfirmed = await confirmSecrets();
    if (!secretsConfirmed) {
      console.log("🔄 Please update the GITHUB_SECRETS constant and restart the script.");
      return;
    }

    // Final confirmation
    console.log(`\n🎯 Ready to inject secrets into: ${org}/${repo}`);
    const finalConfirm = await question("❓ Proceed with secret injection? (y/n): ");

    if (finalConfirm.toLowerCase().trim() !== "y" && finalConfirm.toLowerCase().trim() !== "yes") {
      console.log("❌ Operation cancelled by user.");
      return;
    }

    // Set all secrets
    await setAllSecrets(org, repo);

    console.log("\n🎉 GitHub repository secrets injection completed!");
    console.log(`🔗 Repository: https://github.com/${org}/${repo}/settings/secrets/actions`);
    console.log("\n\x1b[31m⚠️  CRITICAL WARNING:\x1b[0m");
    console.log(
      `\x1b[31m🔥 REMEMBER TO DISCARD ALL FILE CHANGES IN '${__filename}:11'. DO NOT COMMIT THE SECRETS!\x1b[0m`,
    );
  } catch (error) {
    console.error("❌ An error occurred:", error);
  } finally {
    rl.close();
  }
};

// Run the script
main();
