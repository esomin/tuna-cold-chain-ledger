import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ColdChainTracker contract...");

  const ColdChainTracker = await ethers.getContractFactory("ColdChainTracker");
  const tracker = await ColdChainTracker.deploy();

  await tracker.waitForDeployment();

  console.log(`ColdChainTracker contract deployed to: ${await tracker.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
