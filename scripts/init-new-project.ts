import { exec } from "child_process";
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { promisify } from "util";

const __filename = fileURLToPath(import.meta.url);
const execAsync = promisify(exec);

// Replacement patterns configuration
// CRITICAL WARNING: Do not modify this section unless you understand the implications!
// IMPORTANT RULES:
// 1. Each pattern MUST be completely unique
// 2. No pattern should contain part of another pattern as a substring
// 3. Order matters - longer/more specific patterns should come first
// 4. Modifying these patterns incorrectly can cause:
//    - Partial replacements that break functionality
//    - Cascade replacement issues where one pattern interferes with another
//    - Files becoming corrupted with mixed old/new values
const REPLACEMENT_PATTERNS = {
  projectName: "Prowd",
  orgName: "PROWD",
  domain: "altario-seed-starter-domain",
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

// Validation functions
const validateProjectName = (name: string): boolean => {
  return /^[a-zA-Z0-9-]+$/.test(name);
};

const validateOrgName = (name: string): boolean => {
  return /^[a-zA-Z0-9-.]+$/.test(name);
};

const validateDomain = (domain: string): boolean => {
  return /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})*$/.test(domain);
};

// Get user inputs with validation
const getUserInputs = async (): Promise<{ projectName: string; orgName: string; domain: string }> => {
  let projectName = "";
  let orgName = "";
  let domain = "";

  // Get project name
  while (!projectName) {
    const input = await question("📂 Enter project name (letters (a-z), numbers (0-9), and dashes (-) only): ");
    if (validateProjectName(input)) {
      projectName = input.toLowerCase();
      console.log("✅ Project name accepted!");
    } else {
      console.log("❌ Invalid project name. Only letters, numbers, and dashes (-) are allowed.");
    }
  }

  // Get organization name
  while (!orgName) {
    const input = await question(
      "🏢 Enter organization name (letters (a-z), numbers (0-9), dashes (-), and dots (.)): ",
    );
    if (validateOrgName(input)) {
      orgName = input.toLowerCase();
      console.log("✅ Organization name accepted!");
    } else {
      console.log("❌ Invalid organization name. Only letters, numbers, dashes (-), and dots (.) are allowed.");
    }
  }

  // Get domain
  while (!domain) {
    const input = await question("🌐 Enter domain (e.g., example.com or api.example.com): ");
    if (validateDomain(input)) {
      domain = input.toLowerCase();
      console.log("✅ Domain accepted!");
    } else {
      console.log("❌ Invalid domain format. Please enter a valid domain like example.com");
    }
  }

  return { projectName, orgName, domain };
};

// Check if path should be excluded
const shouldExclude = (filePath: string): boolean => {
  const excludedDirs = ["node_modules", "dist"];
  const pathParts = filePath.split(path.sep);
  return excludedDirs.some((dir) => pathParts.includes(dir));
};

// Get all files recursively
const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []): string[] => {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);

    if (shouldExclude(fullPath)) {
      return;
    }

    // Skip the script file itself
    if (fullPath === __filename) {
      return;
    }

    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
};

// Replace content in file
const replaceInFile = (filePath: string, replacements: { [key: string]: string }): boolean => {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let hasChanges = false;

    Object.entries(replacements).forEach(([searchText, replaceText]) => {
      if (content.includes(searchText)) {
        content = content.replace(new RegExp(searchText, "g"), replaceText); // nosemgrep: detect-non-literal-regexp
        hasChanges = true;
      }
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, content, "utf8");
      return true;
    }
    return false;
  } catch (error) {
    console.log(`⚠️  Could not process file: ${filePath}`);
    return false;
  }
};

// Install dependencies using pnpm
const installDependencies = async (): Promise<void> => {
  console.log("📦 Installing project dependencies...");

  try {
    const { stdout, stderr } = await execAsync("pnpm install", {
      cwd: process.cwd(),
      timeout: 300000, // 5 minutes timeout
    });

    console.log("✅ Dependencies installed successfully!");

    // Show any warnings from pnpm if present
    if (stderr && stderr.trim()) {
      console.log("⚠️  Installation warnings:");
      console.log(stderr);
    }
  } catch (error: unknown) {
    console.log("❌ Failed to install dependencies:");
    console.log((error as Error).message);
    console.log("💡 You can manually run 'pnpm install' later to install dependencies.");
  }
};

// Main function
const main = async (): Promise<void> => {
  console.log("🎯 Starting Seed Project Initialization\n");

  try {
    // Get user inputs
    const { projectName, orgName, domain } = await getUserInputs();

    console.log("\n📝 Configuration Summary:");
    console.log(`   Project Name: ${projectName}`);
    console.log(`   Organization: ${orgName}`);
    console.log(`   Domain: ${domain}\n`);

    // Define replacements based on user inputs
    const replacements = {
      [REPLACEMENT_PATTERNS.projectName]: projectName,
      [REPLACEMENT_PATTERNS.orgName]: orgName,
      [REPLACEMENT_PATTERNS.domain]: domain,
    };

    // Get all files
    console.log("🔍 Scanning for files...");
    const rootDir = process.cwd();
    const allFiles = getAllFiles(rootDir);

    console.log(`📁 Found ${allFiles.length} files to process\n`);

    // Process files
    console.log("🔄 Processing files...");
    let processedCount = 0;
    let modifiedCount = 0;

    allFiles.forEach((filePath) => {
      const relativePath = path.relative(rootDir, filePath);
      const wasModified = replaceInFile(filePath, replacements);

      if (wasModified) {
        console.log(`✏️  Modified: ${relativePath}`);
        modifiedCount++;
      }
      processedCount++;
    });

    // Final summary
    console.log("\n🎉 Project initialization completed!");
    console.log(`📊 Processed ${processedCount} files`);
    console.log(`📝 Modified ${modifiedCount} files\n`);

    // Install dependencies
    await installDependencies();

    console.log("\n🎯 Final Configuration Used:");
    console.log(`   Project Name: ${projectName}`);
    console.log(`   Organization Name: ${orgName}`);
    console.log(`   Domain: ${domain}`);
  } catch (error) {
    console.error("❌ An error occurred:", error);
  } finally {
    rl.close();
  }
};

// Run the script
main();
