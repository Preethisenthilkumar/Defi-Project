import { expect } from "chai";
import { ethers } from "hardhat";
import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

//Test token contract
describe("Token contract", function () {
  // fixture to reuse the same setup in every test.
  // use loadFixture to run this setup once, snapshot that state, and reset Hardhat
  // Network to that snapshot in every test.
  async function deployTokenFixture() {
    // Get the Signers here.
    const [owner, addr1, addr2] = await ethers.getSigners();

    // deploy contract and wait for deployment.
    const hardhatToken = await ethers.deployContract("MyToken");

    await hardhatToken.waitForDeployment();

    // Fixtures returns the deployed contract and signers
    return { hardhatToken, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { hardhatToken, owner } = await loadFixture(deployTokenFixture);

      // This test expects the owner variable stored in the contract to be
      // equal to our Signer's owner.
      expect(await hardhatToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const { hardhatToken, owner } = await loadFixture(deployTokenFixture);
      const ownerBalance = await hardhatToken.balanceOf(owner.address);
      expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
    });
  });
  // This test expects only the owner to mint new tokens.
  describe("Mint", function () {
    it("owner can mint and balance is updated", async function () {
      const { hardhatToken, owner, addr1 } = await loadFixture(deployTokenFixture);

      const amount = 10;
      expect(await hardhatToken.mint(addr1.address,amount));
      expect(await hardhatToken.balanceOf(addr1.address)).to.equal(amount);
      
      await expect(hardhatToken.mint(addr1.address,amount))
        .to.emit(hardhatToken, "Transfer");
    });
    it("emit event after successful minting", async function () {

      const { hardhatToken, owner, addr1 } = await loadFixture(deployTokenFixture);
    
      const amount = 10;
      expect(await hardhatToken.mint(addr1.address,amount));
      await expect(hardhatToken.mint(addr1.address,amount))
        .to.emit(hardhatToken, "Transfer");
    });

    it("Should fail if non-owner account tries to mint", async function () {
      const { hardhatToken, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);

      await expect(
        hardhatToken.connect(addr1).mint(addr2.address, 1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail for invalid address", async function () {
      const { hardhatToken } = await loadFixture(deployTokenFixture);
     
      await expect(hardhatToken.mint(ZERO_ADDRESS,10))
        .to.be.revertedWithCustomError(hardhatToken, "ERC20InvalidReceiver")
        .withArgs(ZERO_ADDRESS);
    }); 
  });
  // This test expects only the owner to burn his tokens and not other accounts.
  describe("Burn", function () {
    it("owner can burn and balance is updated", async function () {
      const { hardhatToken, owner } = await loadFixture(deployTokenFixture);

      //Owner's account balance after deployment = 1000
      const burnAmount = 500;
      const expectedBalance = 500;
      expect(await hardhatToken.burn(owner.address,burnAmount));
      expect(await hardhatToken.balanceOf(owner)).to.equal(expectedBalance);
    });
    it("emit event after successful burn", async function () {
      const { hardhatToken, owner } = await loadFixture(deployTokenFixture);
      const burnAmount = 500;
      expect(await hardhatToken.burn(owner.address,burnAmount))
      .to.emit(hardhatToken, "Transfer");
    });

    it("Should fail if owner tries to burn other account tokens", async function () {
      const { hardhatToken,owner, addr1 } = await loadFixture(deployTokenFixture);
 
      await expect(
        hardhatToken.burn(addr1.address,1)
      ).to.be.revertedWith("Not owner balance");

      await expect(hardhatToken.burn(ZERO_ADDRESS,10))
        .to.be.revertedWith("Not owner balance");
    });

    it("Should fail if non-owner account tries to burn", async function () {
      const { hardhatToken,owner, addr1 } = await loadFixture(deployTokenFixture);
 
      await expect(
        hardhatToken.connect(addr1).burn(owner.address,1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail if insufficient balance", async function () {
      const { hardhatToken, owner } = await loadFixture(deployTokenFixture);
      //owner will have 1000 after deployment
      
      const mintAmount = 1000;
      const burnAmount = 1001;
      await expect(hardhatToken.burn(owner.address,burnAmount))
        .to.be.revertedWithCustomError(hardhatToken, "ERC20InsufficientBalance")
        .withArgs(owner.address, mintAmount, burnAmount);
    });

  });

  describe("Transfer", function(){
    it("accounts can transfer and balance is updated", async function (){
      const { hardhatToken, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);
      const amount = 10;
      expect(await hardhatToken.transfer(addr1.address,amount))
      .to.emit(hardhatToken, "Transfer");
      expect(await hardhatToken.balanceOf(addr1.address)).to.equal(amount);
      expect(await hardhatToken.connect(addr1).transfer(addr2.address,amount));
      expect(await hardhatToken.balanceOf(addr2.address)).to.equal(amount);
      expect(await hardhatToken.balanceOf(addr1.address)).to.equal(0);
    });
    it("Should fail for invalid address", async function () {
      const { hardhatToken } = await loadFixture(deployTokenFixture);
     
      await expect(hardhatToken.transfer(ZERO_ADDRESS,10))
        .to.be.revertedWithCustomError(hardhatToken, "ERC20InvalidReceiver")
        .withArgs(ZERO_ADDRESS);
    });
    it("Should fail if insufficient balance", async function () {
      const { hardhatToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      //owner will have 1000 after deployment
      const accBalance = 1000;
      const transferAmount = 1001;
      await expect(hardhatToken.transfer(addr1.address,transferAmount))
        .to.be.revertedWithCustomError(hardhatToken, "ERC20InsufficientBalance")
        .withArgs(owner.address, accBalance, transferAmount);
    });
  });
  describe("Approve", function(){
    it("can approve other accounts to spend", async function (){
      const { hardhatToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      const amount = 10;
      expect(await hardhatToken.approve(addr1.address,amount));
    });
    it("should return allowance amount", async function (){
      const { hardhatToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      const amount = 10;
      expect(await hardhatToken.approve(addr1.address,amount));
      expect(await hardhatToken.allowance(owner.address,addr1.address)).to.equal(amount);
    });
    it("emit approval emit", async function (){
      const { hardhatToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      const amount = 10;
      expect(await hardhatToken.approve(addr1.address,amount))
      .to.emit(hardhatToken, "Approval");
    });
    it("Should fail for invalid address", async function () {
      const { hardhatToken } = await loadFixture(deployTokenFixture);
     
      await expect(hardhatToken.approve(ZERO_ADDRESS,10))
        .to.be.revertedWithCustomError(hardhatToken, "ERC20InvalidSpender")
        .withArgs(ZERO_ADDRESS);
    });
  });
  describe("TransferFrom", function(){
    it("approve and transferFrom", async function (){
      const { hardhatToken, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);
      const amount = 10;
      expect(await hardhatToken.transfer(addr1.address,amount));
      expect(await hardhatToken.approve(addr1.address,amount));
      expect(await hardhatToken.connect(addr1).transferFrom(owner.address,addr2.address,amount));
    });
    it("Should fail for invalid from address", async function () {
      const { hardhatToken, addr1, addr2 } = await loadFixture(deployTokenFixture);
      const amount = 10;
      expect(await hardhatToken.transfer(addr1.address,amount));
      expect(await hardhatToken.approve(addr1.address,amount));
      await expect(hardhatToken.connect(addr1).transferFrom(ZERO_ADDRESS,addr2.address,10))
        .to.be.revertedWithCustomError(hardhatToken, "ERC20InsufficientAllowance")
        .withArgs(addr1.address, 0, 10);
    });
    it("Should fail for invalid to address", async function () {
      const { hardhatToken, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);
      const amount = 10;
      expect(await hardhatToken.transfer(addr1.address,amount));
      expect(await hardhatToken.approve(addr1.address,amount));
      await expect(hardhatToken.connect(addr1).transferFrom(owner.address,ZERO_ADDRESS,10))
        .to.be.revertedWithCustomError(hardhatToken, "ERC20InvalidReceiver")
        .withArgs(ZERO_ADDRESS);
    });
    it("Should fail for insufficient allowance", async function () {
      const { hardhatToken, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);
      const amount = 10;
      expect(await hardhatToken.transfer(addr1.address,amount));
      expect(await hardhatToken.approve(addr1.address,amount));
      await expect(hardhatToken.connect(addr1).transferFrom(owner.address,addr2.address,20))
        .to.be.revertedWithCustomError(hardhatToken, "ERC20InsufficientAllowance")
        .withArgs(addr1.address, 10, 20);
    });
  });
  describe("Allowance", function(){
    it("increase allowance amount", async function (){
      const { hardhatToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      const amount = 10;
      const finalAllowance = 20;
      expect(await hardhatToken.approve(addr1.address,amount));
      expect(await hardhatToken.increaseAllowance(addr1.address,amount));
      expect(await hardhatToken.allowance(owner.address,addr1.address)).to.equal(finalAllowance);
    });
    it("decrease allowance amount", async function (){
      const { hardhatToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      const amount = 20;
      const finalAllowance = 10;
      expect(await hardhatToken.approve(addr1.address,amount));
      expect(await hardhatToken.decreaseAllowance(addr1.address,10));
      expect(await hardhatToken.allowance(owner.address,addr1.address)).to.equal(finalAllowance);
    });
  });
  // This test expects only the owner to pause contract and 
  //functions cannot be called when paused.
  describe("Pause", function () {
    it("owner can pause the contract", async function () {
      const { hardhatToken } = await loadFixture(deployTokenFixture);

      expect(await hardhatToken.pause())
        .to.emit(hardhatToken, "Paused");
    });
    it("owner can un-pause the contract", async function () {
      const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);

      expect(await hardhatToken.pause());
      expect(await hardhatToken.unpause())
        .to.emit(hardhatToken, "Unpaused");
      expect(await hardhatToken.mint(addr1.address,10));
    });

    it("Should fail if non-owner account tries to pause", async function () {
      const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);

      await expect(
        hardhatToken.connect(addr1).pause()
          ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail if non-owner account tries to unpause", async function () {
      const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);

      await expect(
        hardhatToken.connect(addr1).unpause()
          ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("mint - Should fail if contract is paused", async function () {
      const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);
      
      expect(await hardhatToken.pause());

      await expect(
        hardhatToken.mint(addr1.address,10)
          ).to.be.revertedWith("Pausable: paused");
    });
    it("burn - Should fail if contract is paused", async function () {
      const { hardhatToken, owner } = await loadFixture(deployTokenFixture);
      
      expect(await hardhatToken.pause());

      await expect(
        hardhatToken.burn(owner.address,10)
          ).to.be.revertedWith("Pausable: paused");
    });

    it("transfer - Should fail if contract is paused", async function () {
      const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);
      
      expect(await hardhatToken.pause());

      await expect(
        hardhatToken.transfer(addr1.address,10)
          ).to.be.revertedWith("Pausable: paused");
    });

    it("approve - Should fail if contract is paused", async function () {
      const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);
      
      expect(await hardhatToken.pause());

      await expect(
        hardhatToken.approve(addr1.address,10)
          ).to.be.revertedWith("Pausable: paused");
    });
    it("transferFrom - Should fail if contract is paused", async function () {
      const { hardhatToken, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);
      
      expect(await hardhatToken.transfer(addr1.address,10));
      expect(await hardhatToken.approve(addr1.address,10));

      expect(await hardhatToken.pause());

      await expect(
        hardhatToken.transferFrom(owner.address,addr2.address,10)
          ).to.be.revertedWith("Pausable: paused");
    });
    it("increaseAllowance - Should fail if contract is paused", async function () {
      const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);
      
      expect(await hardhatToken.approve(addr1.address,10));
      expect(await hardhatToken.pause());

      await expect(
        hardhatToken.increaseAllowance(addr1.address,10)
          ).to.be.revertedWith("Pausable: paused");
    });

    it("decreaseAllowance - Should fail if contract is paused", async function () {
      const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);
      
      expect(await hardhatToken.approve(addr1.address,10));
      expect(await hardhatToken.pause());

      await expect(
        hardhatToken.decreaseAllowance(addr1.address,10)
          ).to.be.revertedWith("Pausable: paused");
    });
  });

});

describe("Staking Contract", function(){
  async function deployStakingFixture() {
    // Get the Signers here.
    const [owner, addr1, addr2] = await ethers.getSigners();

    // To deploy our contract, we just have to call ethers.deployContract and await
    // its waitForDeployment() method, which happens once its transaction has been
    // mined.
    const stakingV1 = await ethers.deployContract("Staking");
    await stakingV1.waitForDeployment();
    const stakingV2 = await ethers.deployContract("StakingV2");
    await stakingV2.waitForDeployment();
    

    // Fixtures can return anything you consider useful for your tests
    return { stakingV1, stakingV2, owner, addr1, addr2 };
  }
  async function deployTokenFixture() {
    // Get the Signers here.
    const [owner, addr3, addr4] = await ethers.getSigners();

    // To deploy our contract, we just have to call ethers.deployContract and await
    // its waitForDeployment() method, which happens once its transaction has been
    // mined.
    const hardhatToken = await ethers.deployContract("MyToken");

    await hardhatToken.waitForDeployment();

    // Fixtures can return anything you consider useful for your tests
    return { hardhatToken, owner, addr3, addr4};
  }

  async function deployUpgradeFixture() {
    // Get the Signers here.
    // Get the Signers here.
    const [owner, addr1, addr2] = await ethers.getSigners();

    const { stakingV1} = await loadFixture(deployStakingFixture);
    const { hardhatToken } = await loadFixture(deployTokenFixture);
      
      const addressV1 = await stakingV1.getAddress();

      const stakingProxy = await ethers.deployContract("StakingProxy", ["0x9ce110d7", addressV1]);
      await stakingProxy.waitForDeployment();
    
      const upgradedV1 = await ethers.getContractAt(
        "Staking",
        await stakingProxy.getAddress()
      );
    

    // Fixtures can return anything you consider useful for your tests
    return { hardhatToken, upgradedV1, owner, addr1, addr2 };
  }

  async function deployUpgradeV2Fixture() {
    // Get the Signers here.
    // Get the Signers here.
    const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    const { stakingV2} = await loadFixture(deployStakingFixture);
    const { hardhatToken } = await loadFixture(deployTokenFixture);
      
      const addressV2 = await stakingV2.getAddress();

      const stakingProxy = await ethers.deployContract("StakingProxy", ["0x9ce110d7", addressV2]);
      await stakingProxy.waitForDeployment();
    
      const upgradedV2 = await ethers.getContractAt(
        "StakingV2",
        await stakingProxy.getAddress()
      );
    

    // Fixtures can return anything you consider useful for your tests
    return { hardhatToken, upgradedV2, owner, addr1, addr2, addr3, addr4 };
  }
  // This test expects the contract to be upgradeable
  describe("Deployment and Upgradeable", function () {
    it("staking v1 deployment works - owner is set once", async function () {
      const { stakingV1, stakingV2,  owner } = await loadFixture(deployStakingFixture);
      
      const addressV1 = await stakingV1.getAddress();
      //console.log("sta",stakingV1);

      const stakingProxy = await ethers.deployContract("StakingProxy", ["0x9ce110d7", addressV1]);
      await stakingProxy.waitForDeployment();
     // const proxyContract = await stakingProxy.getAddress();
     
      const upgradedV1 = await ethers.getContractAt(
        "Staking",
        await stakingProxy.getAddress()
      );
      await expect(upgradedV1.initializer()).to.be.revertedWith("Already initialized");
      
      expect(await upgradedV1.owner()).to.equal(owner.address);
    });
    it("only owner can set token contract", async function () {
      const { stakingV1, addr1 } = await loadFixture(deployStakingFixture);
      
      const addressV1 = await stakingV1.getAddress();
      //console.log("sta",stakingV1);

      const stakingProxy = await ethers.deployContract("StakingProxy", ["0x9ce110d7", addressV1]);
      await stakingProxy.waitForDeployment();
     // const proxyContract = await stakingProxy.getAddress();
     
      const upgradedV1 = await ethers.getContractAt(
        "Staking",
        await stakingProxy.getAddress()
      );
      const token = "0x26a77595Aa80350af52A14116E197E53b8B92601";
      await upgradedV1.setStakingToken(token);
      expect(await upgradedV1.stakingToken()).to.equal(token);
    })

    it("owner can update proxy implementation - upgrade to v2", async function() {
      const { stakingV1, stakingV2,  owner, addr1 } = await loadFixture(deployStakingFixture);
      
      const addressV1 = await stakingV1.getAddress();
      //console.log("sta",stakingV1);

      const stakingProxy = await ethers.deployContract("StakingProxy", ["0x9ce110d7", addressV1]);
      await stakingProxy.waitForDeployment();
     // const proxyContract = await stakingProxy.getAddress();
     
      let upgraded = await ethers.getContractAt(
        "Staking",
        await stakingProxy.getAddress()
      );
      const token = "0x26a77595Aa80350af52A14116E197E53b8B92601";
      await upgraded.setStakingToken(token);
      expect(await upgraded.stakingToken()).to.equal(token);

      const addressV2 = await stakingV2.getAddress();
      await upgraded.updateCode(addressV2);
      let upgraded2 = await ethers.getContractAt(
        "StakingV2",
        await stakingProxy.getAddress()
      );
      await upgraded2.setStakingToken(token);
    })
  });
  
  describe("Staking V1 - Static", function () {
    it("only owner can change reward rate", async function () {
      const { stakingV1, owner } = await loadFixture(deployStakingFixture);
      
      const addressV1 = await stakingV1.getAddress();
      //console.log("sta",stakingV1);

      const stakingProxy = await ethers.deployContract("StakingProxy", ["0x9ce110d7", addressV1]);
      await stakingProxy.waitForDeployment();
     // const proxyContract = await stakingProxy.getAddress();
     
      const upgradedV1 = await ethers.getContractAt(
        "Staking",
        await stakingProxy.getAddress()
      );
      
      await upgradedV1.changeRewardRate(2);
      expect(await upgradedV1.rewardRate()).to.equal(2);

    });

    it("owner can pause and unpause contract", async function () {
      const { hardhatToken, upgradedV1 } = await loadFixture(deployUpgradeFixture);
      
      const rewardContractAddr = await upgradedV1.getAddress();
      
      await upgradedV1.pause();
      await expect(upgradedV1.stake(10)).to.be.revertedWith("Pausable: paused");
      await upgradedV1.unpause();
    });

    it("stake,withdraw,withdrawReward - not possible when paused", async function () {
      const { hardhatToken, upgradedV1 } = await loadFixture(deployUpgradeFixture);
      
      const rewardContractAddr = await upgradedV1.getAddress();
      
      await upgradedV1.pause();
      await expect(upgradedV1.stake(10)).to.be.revertedWith("Pausable: paused");
      await expect(upgradedV1.withdraw(10)).to.be.revertedWith("Pausable: paused");
      await expect(upgradedV1.withdrawReward(10)).to.be.revertedWith("Pausable: paused");
    });

    // This test expects the balance to be updated after stake
    it("users can stake and balance is updated", async function () {
      const { hardhatToken, upgradedV1, addr1 } = await loadFixture(deployUpgradeFixture);
      
      const rewardContractAddr = await upgradedV1.getAddress();
      
      await upgradedV1.setStakingToken(await hardhatToken.getAddress());
      await hardhatToken.mint(rewardContractAddr, 100);
      await hardhatToken.transfer(addr1.address, 20);
      //approve staking contract to spend
      await hardhatToken.connect(addr1).approve(rewardContractAddr, 20);
      await upgradedV1.connect(addr1).stake(10);
      expect(await upgradedV1.connect(addr1)._totalSupply()).to.equal(10);
    });
    // This test expects reward to be accrued for each block after stake.
    it("users earn reward per token", async function () {
      const { hardhatToken, upgradedV1, owner, addr1, addr2 } = await loadFixture(deployUpgradeFixture);
      
      const rewardContractAddr = await upgradedV1.getAddress();
      
      await upgradedV1.setStakingToken(await hardhatToken.getAddress());
      await hardhatToken.mint(rewardContractAddr, 100);
      await hardhatToken.transfer(addr1.address, 20);
      //approve staking contract to spend
      await hardhatToken.connect(addr1).approve(rewardContractAddr, 20);
      await upgradedV1.connect(addr1).stake(10);
      await upgradedV1.connect(addr1).withdraw(5);
      const rewardAccrued = await upgradedV1.connect(addr1)._balances(addr1.address);
      expect(rewardAccrued[1]).to.equal(10);
    });
    
    // This test verifies that rewards are claimable
    it("users can claim earned reward", async function () {
      const { hardhatToken, upgradedV1, owner, addr1, addr2 } = await loadFixture(deployUpgradeFixture);
      
      const rewardContractAddr = await upgradedV1.getAddress();
      
      await upgradedV1.setStakingToken(await hardhatToken.getAddress());
      await hardhatToken.mint(rewardContractAddr, 100);
      await hardhatToken.transfer(addr1.address, 20);
      //approve staking contract to spend
      await hardhatToken.connect(addr1).approve(rewardContractAddr, 20);
      await upgradedV1.connect(addr1).stake(10);
      await upgradedV1.connect(addr1).withdraw(10);
      let rewardAccrued = await upgradedV1.connect(addr1)._balances(addr1.address);
      expect(rewardAccrued[1]).to.equal(10);
      await upgradedV1.connect(addr1).withdrawReward(5);
      rewardAccrued = await upgradedV1.connect(addr1)._balances(addr1.address);
      expect(rewardAccrued[1]).to.equal(5);
      await upgradedV1.connect(addr1).withdrawReward(5);
      rewardAccrued = await upgradedV1.connect(addr1)._balances(addr1.address);
      expect(rewardAccrued[1]).to.equal(0);
    });

    it("users can withdraw staked", async function () {
      const { hardhatToken, upgradedV1, owner, addr1, addr2 } = await loadFixture(deployUpgradeFixture);
      
      const rewardContractAddr = await upgradedV1.getAddress();
      
      await upgradedV1.setStakingToken(await hardhatToken.getAddress());
      await hardhatToken.mint(rewardContractAddr, 100);
      await hardhatToken.transfer(addr1.address, 20);
      //approve staking contract to spend
      await hardhatToken.connect(addr1).approve(rewardContractAddr, 20);
      await upgradedV1.connect(addr1).stake(10);
      await upgradedV1.connect(addr1).withdraw(5);
      let rewardAccrued = await upgradedV1.connect(addr1)._balances(addr1.address);
      expect(rewardAccrued[0]).to.equal(5);
    });

    it("claim - should fail for insufficient balance", async function () {
      const { hardhatToken, upgradedV1, addr1} = await loadFixture(deployUpgradeFixture);
      
      const rewardContractAddr = await upgradedV1.getAddress();
      
      await upgradedV1.setStakingToken(await hardhatToken.getAddress());
      await hardhatToken.mint(rewardContractAddr, 100);
      await hardhatToken.transfer(addr1.address, 20);
      //approve staking contract to spend
      await hardhatToken.connect(addr1).approve(rewardContractAddr, 20);
      await upgradedV1.connect(addr1).stake(10);
      await upgradedV1.connect(addr1).withdraw(10);
      let rewardAccrued = await upgradedV1.connect(addr1)._balances(addr1.address);
      expect(rewardAccrued[1]).to.equal(10);
      await upgradedV1.connect(addr1).withdrawReward(5);
      rewardAccrued = await upgradedV1.connect(addr1)._balances(addr1.address);
      expect(rewardAccrued[1]).to.equal(5);
      await expect(upgradedV1.withdrawReward(15)).to.be.revertedWith("Insufficient Balance");
    });
    it("unstake/withdraw - should fail for insufficient balance", async function () {
      const { hardhatToken, upgradedV1, owner, addr1, addr2 } = await loadFixture(deployUpgradeFixture);
      
      const rewardContractAddr = await upgradedV1.getAddress();
      
      await upgradedV1.setStakingToken(await hardhatToken.getAddress());
      await hardhatToken.mint(rewardContractAddr, 100);
      await hardhatToken.transfer(addr1.address, 20);
      //approve staking contract to spend
      await hardhatToken.connect(addr1).approve(rewardContractAddr, 20);
      await upgradedV1.connect(addr1).stake(10);
      await expect(upgradedV1.withdraw(15)).to.be.revertedWith("Insufficient Balance");
    });
    it("stake/withdraw/withdraw reward - should fail for invalid amount", async function () {
      const { hardhatToken, upgradedV1, owner, addr1, addr2 } = await loadFixture(deployUpgradeFixture);
      
      const rewardContractAddr = await upgradedV1.getAddress();
      
      await upgradedV1.setStakingToken(await hardhatToken.getAddress());
      await hardhatToken.mint(rewardContractAddr, 100);
      await hardhatToken.transfer(addr1.address, 20);
      //approve staking contract to spend
      await hardhatToken.connect(addr1).approve(rewardContractAddr, 20);
      await expect(upgradedV1.connect(addr1).stake(0)).to.be.revertedWith("Invalid amount");
      await expect(upgradedV1.connect(addr1).withdraw(0)).to.be.revertedWith("Invalid amount");
      await expect(upgradedV1.connect(addr1).withdrawReward(0)).to.be.revertedWith("Invalid amount");
    });
  });
  
  describe("Staking V2 - Dynamic", function () {
    it("only owner can change allocated reward", async function () {
      const {upgradedV2 } = await loadFixture(deployUpgradeV2Fixture);
    
      await upgradedV2.setAllocatedReward(2000);
      expect(await upgradedV2._totalAllocatedReward()).to.equal(2000);
    });
    it("owner can pause and unpause contract", async function () {
      const { hardhatToken, upgradedV2 } = await loadFixture(deployUpgradeV2Fixture);
      
      const rewardContractAddr = await upgradedV2.getAddress();
      
      await upgradedV2.pause();
      await expect(upgradedV2.stake(10)).to.be.revertedWith("Pausable: paused");
      await upgradedV2.unpause();
    });

    it("stake,withdraw,withdrawReward - not possible when paused", async function () {
      const { upgradedV2 } = await loadFixture(deployUpgradeV2Fixture);
      
      await upgradedV2.pause();
      await expect(upgradedV2.stake(10)).to.be.revertedWith("Pausable: paused");
      await expect(upgradedV2.withdraw(10)).to.be.revertedWith("Pausable: paused");
      await expect(upgradedV2.withdrawReward(10)).to.be.revertedWith("Pausable: paused");
    });
    // This test expects the balance to be updated after staking
    it("users can stake and balance is updated", async function () {
      const { hardhatToken, upgradedV2, addr1 } = await loadFixture(deployUpgradeV2Fixture);
      
      const rewardContractAddr = await upgradedV2.getAddress();
      
      await upgradedV2.setStakingToken(await hardhatToken.getAddress());
      await hardhatToken.mint(rewardContractAddr, 100);
      await hardhatToken.transfer(addr1.address, 20);
      //approve staking contract to spend
      await hardhatToken.connect(addr1).approve(rewardContractAddr, 20);
      await upgradedV2.connect(addr1).stake(10);
      expect(await upgradedV2.connect(addr1)._totalSupply()).to.equal(10);
    });
    // This test verifies that reward rate is dynamic (updates accordingly for stake and withdraw)
    it("reward rate increases on withdrawal and decreases on stake", async function () {
      const { hardhatToken, upgradedV2, addr1, addr2, addr3} = await loadFixture(deployUpgradeV2Fixture);
      
      const rewardContractAddr = await upgradedV2.getAddress();
      
      await upgradedV2.setStakingToken(await hardhatToken.getAddress());
      await hardhatToken.mint(rewardContractAddr, 1000);
      await hardhatToken.transfer(addr1.address, 50);
      await hardhatToken.transfer(addr2.address, 50);
      await hardhatToken.transfer(addr3.address, 50);
      //approve staking contract to spend
      await hardhatToken.connect(addr1).approve(rewardContractAddr, 50);
      await hardhatToken.connect(addr2).approve(rewardContractAddr, 50);
      await hardhatToken.connect(addr3).approve(rewardContractAddr, 50);

      await upgradedV2.connect(addr1).stake(5);
      await upgradedV2.connect(addr1).stake(10);
      await upgradedV2.connect(addr3).stake(10);
      let rate = await upgradedV2.rewardRate();
      await upgradedV2.connect(addr2).stake(10);
      await upgradedV2.connect(addr2).stake(5);
      //reward rate decreases after stakes
      expect(await upgradedV2.connect(addr1).rewardRate()).to.lessThan(rate);
      await upgradedV2.connect(addr2).withdraw(10);
      rate = await upgradedV2.rewardRate();
      await upgradedV2.connect(addr1).withdraw(5);
      await upgradedV2.connect(addr3).withdraw(10);
      await upgradedV2.connect(addr1).withdraw(5);
      //reward rate increases after withdrawals
      expect(await upgradedV2.connect(addr1).rewardRate()).to.greaterThan(rate); 
    });
    // This test expects the reward to be accrued for each block 
    //mul by number of blocks, amount and reward rate
    it("users accrue reward for staking", async function () {
      const { hardhatToken, upgradedV2, addr1 } = await loadFixture(deployUpgradeV2Fixture);
      
      const rewardContractAddr = await upgradedV2.getAddress();
      
      await upgradedV2.setStakingToken(await hardhatToken.getAddress());
      await hardhatToken.mint(rewardContractAddr, 100);
      await hardhatToken.transfer(addr1.address, 20);
      //approve staking contract to spend
      await hardhatToken.connect(addr1).approve(rewardContractAddr, 20);
      let reward = await upgradedV2.connect(addr1)._balances(addr1.address);
      let rewardAcc = reward[1];
      await upgradedV2.connect(addr1).stake(10);
      await upgradedV2.connect(addr1).stake(5);
      reward = await upgradedV2.connect(addr1)._balances(addr1.address);
      expect(reward[1]).to.greaterThan(rewardAcc); 
    });
    // This test expects that reward are claimable
    it("users can claim earned reward", async function () {
      const { hardhatToken, upgradedV2,addr1 } = await loadFixture(deployUpgradeV2Fixture);
      
      const rewardContractAddr = await upgradedV2.getAddress();
      
      await upgradedV2.setStakingToken(await hardhatToken.getAddress());
      await hardhatToken.mint(rewardContractAddr, 700);
      await hardhatToken.transfer(addr1.address, 20);
      //approve staking contract to spend
      await hardhatToken.connect(addr1).approve(rewardContractAddr, 20);
      let reward = await upgradedV2.connect(addr1).getReward(addr1.address);
      await upgradedV2.connect(addr1).stake(10);
      await upgradedV2.connect(addr1).stake(5);
      let rewardAcc = await upgradedV2.connect(addr1).getReward(addr1.address);
      expect(rewardAcc).to.greaterThan(reward); 
      await upgradedV2.connect(addr1).withdrawReward(5);
      });
      it("users can withdraw staked", async function () {
        const { hardhatToken, upgradedV2,addr1 } = await loadFixture(deployUpgradeV2Fixture);
        
        const rewardContractAddr = await upgradedV2.getAddress();
        
        await upgradedV2.setStakingToken(await hardhatToken.getAddress());
        await hardhatToken.mint(rewardContractAddr, 700);
        await hardhatToken.transfer(addr1.address, 20);
        //approve staking contract to spend
        await hardhatToken.connect(addr1).approve(rewardContractAddr, 20);
        await upgradedV2.connect(addr1).stake(10);
        await upgradedV2.connect(addr1).stake(5);
        await upgradedV2.connect(addr1).withdraw(5);
      });
      it("claim - should fail for insufficient balance", async function () {
        const { hardhatToken, upgradedV2,addr1 } = await loadFixture(deployUpgradeV2Fixture);
        
        const rewardContractAddr = await upgradedV2.getAddress();
        
        await upgradedV2.setStakingToken(await hardhatToken.getAddress());
        await hardhatToken.mint(rewardContractAddr, 700);
        await hardhatToken.transfer(addr1.address, 20);
        
        await hardhatToken.connect(addr1).approve(rewardContractAddr, 20);
        let reward = await upgradedV2.connect(addr1).getReward(addr1.address);
        await upgradedV2.connect(addr1).stake(10);
        await upgradedV2.connect(addr1).stake(5);
        let rewardAcc = await upgradedV2.connect(addr1).getReward(addr1.address);
        expect(rewardAcc).to.greaterThan(reward); 
        await expect(upgradedV2.connect(addr1).withdrawReward(25)).to.be.revertedWith("Insufficient Balance");
      });
      it("unstake/withdraw - should fail for insufficient balance", async function () {
        const { hardhatToken, upgradedV2,addr1 } = await loadFixture(deployUpgradeV2Fixture);
        
        const rewardContractAddr = await upgradedV2.getAddress();
        
        await upgradedV2.setStakingToken(await hardhatToken.getAddress());
        await hardhatToken.mint(rewardContractAddr, 700);
        await hardhatToken.transfer(addr1.address, 20);
        
        await hardhatToken.connect(addr1).approve(rewardContractAddr, 20);
        await upgradedV2.connect(addr1).stake(10);
        await upgradedV2.connect(addr1).stake(5);
        await expect(upgradedV2.connect(addr1).withdraw(25)).to.be.revertedWith("Insufficient Balance");
      });
      it("stake/withdraw/withdraw reward - should fail for invalid amount", async function () {
        const { hardhatToken, upgradedV2,addr1 } = await loadFixture(deployUpgradeV2Fixture);
        
        const rewardContractAddr = await upgradedV2.getAddress();
        
        await upgradedV2.setStakingToken(await hardhatToken.getAddress());
        await hardhatToken.mint(rewardContractAddr, 700);
        await hardhatToken.transfer(addr1.address, 20);
        
        await hardhatToken.connect(addr1).approve(rewardContractAddr, 20);
        await expect(upgradedV2.connect(addr1).stake(0)).to.be.revertedWith("Invalid amount");
        await expect(upgradedV2.connect(addr1).withdraw(0)).to.be.revertedWith("Invalid amount");
        await expect(upgradedV2.connect(addr1).withdrawReward(0)).to.be.revertedWith("Invalid amount");
      });
      it("should fail if stake limit reached", async function () {
        const { hardhatToken, upgradedV2, owner } = await loadFixture(deployUpgradeV2Fixture);
        
        const rewardContractAddr = await upgradedV2.getAddress();
        
        await upgradedV2.setStakingToken(await hardhatToken.getAddress());
        await hardhatToken.mint(rewardContractAddr, 70000);
        await hardhatToken.mint(owner.address, 30000);
        
        await hardhatToken.approve(rewardContractAddr, 30000);
        await upgradedV2.stake(10000);
        await upgradedV2.stake(10000);
        await upgradedV2.stake(5000);
        let accrued = await upgradedV2.getReward(owner.address);
        expect(await upgradedV2._totalAllocatedReward()).to.greaterThan(accrued);
        await upgradedV2.stake(2000);
        await upgradedV2.withdraw(2);
       
        await expect(upgradedV2.stake(1)).to.be.revertedWith("Cannot stake - limit reached");
    });
  });
});



     



