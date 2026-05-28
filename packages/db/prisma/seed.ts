import { execSync } from "node:child_process";

const scenario = process.env.SEED_SCENARIO || "dashboard";

console.log(`\n🌱 Running seed scenario: ${scenario}`);

try {
    // We run the scenario script with tsx. 
    // Since we are already executing within the tsx environment from the original seed command,
    // we just use the local npx tsx to ensure the script runs correctly with the environment variables.
    execSync(`npx tsx --env-file=../../apps/server/.env prisma/seed-${scenario}.ts`, { stdio: "inherit" });
} catch (e) {
    console.error(`\n❌ Failed to run seed scenario: ${scenario}`);
    console.error(`Make sure the file prisma/seed-${scenario}.ts exists!`);
    process.exit(1);
}
