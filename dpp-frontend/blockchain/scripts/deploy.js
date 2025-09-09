const hre = require("hardhat");

async function main() {
  console.log("Deploying DPPRegistry contract...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the DPPRegistry contract
  const DPPRegistry = await hre.ethers.getContractFactory("DPPRegistry");
  const dppRegistry = await DPPRegistry.deploy();

  await dppRegistry.deployed();

  console.log("DPPRegistry deployed to:", dppRegistry.address);
  console.log("Transaction hash:", dppRegistry.deployTransaction.hash);

  // Verify the contract on Polygonscan (if on mainnet/testnet)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await dppRegistry.deployTransaction.wait(6);
    
    try {
      await hre.run("verify:verify", {
        address: dppRegistry.address,
        constructorArguments: [],
      });
      console.log("Contract verified on Polygonscan");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: dppRegistry.address,
    deployerAddress: deployer.address,
    transactionHash: dppRegistry.deployTransaction.hash,
    blockNumber: dppRegistry.deployTransaction.blockNumber,
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync(
    './deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to deployment-info.json");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

