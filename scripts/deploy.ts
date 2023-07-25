import { ethers } from "hardhat";

async function main() {
  const ContractFactory = await ethers.getContractFactory("MyToken");

  const instance = await ContractFactory.deploy();
  await instance.waitForDeployment();

  console.log(`Token Contract deployed to ${await instance.getAddress()}`);

  const StakingFactoryV1 = await ethers.getContractFactory("Staking");

  const staking_instance1 = await StakingFactoryV1.deploy();
  await staking_instance1.waitForDeployment();

  const stakingProxy = await ethers.deployContract("StakingProxy", ["0x9ce110d7", await staking_instance1.getAddress()]);
  await stakingProxy.waitForDeployment();

  const upgradedV1 = await ethers.getContractAt(
    "Staking",
    await stakingProxy.getAddress()
  );

  console.log(`Staking V1 Contract deployed to ${await upgradedV1.getAddress()}`);

  const StakingFactoryV2 = await ethers.getContractFactory("StakingV2");

  const staking_instance2 = await StakingFactoryV2.deploy();
  await staking_instance2.waitForDeployment();

  await upgradedV1.updateCode(await staking_instance2.getAddress());

  let upgradedV2 = await ethers.getContractAt(
    "StakingV2",
    await stakingProxy.getAddress()
  );
  console.log(`Staking V2 Contract deployed to ${await upgradedV2.getAddress()}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

