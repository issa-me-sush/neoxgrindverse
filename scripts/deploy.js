const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const neoxverse = await ethers.getContractFactory("neoxverse");
  const neoxverse = await neoxverse.deploy(deployer.address);
  await neoxverse.deployed();

  console.log("neoxverse deployed to:", neoxverse.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 