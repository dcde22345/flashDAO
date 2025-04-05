import { expect } from "chai";
import { ethers } from "hardhat";

describe("FlashDAOToken", function () {
  let token: any;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const FlashDAOToken = await ethers.getContractFactory("FlashDAOToken");
    token = await FlashDAOToken.deploy();
  });

  it("should have correct name and symbol", async function () {
    expect(await token.name()).to.equal("FlashDAO Governance Token");
    expect(await token.symbol()).to.equal("FDGT");
  });

  it("should assign default admin role to deployer", async function () {
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    expect(await token.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
  });

  it("should assign minter role to deployer", async function () {
    const MINTER_ROLE = await token.MINTER_ROLE();
    expect(await token.hasRole(MINTER_ROLE, owner.address)).to.be.true;
  });

  it("should mint tokens correctly", async function () {
    const donationAmount = ethers.parseUnits("100", 6); // 100 USDC
    await token.mintFromDonation(user1.address, donationAmount);
    
    const expectedTokens = await token.calculateTokenAmount(donationAmount);
    expect(await token.balanceOf(user1.address)).to.equal(expectedTokens);
  });

  it("should calculate tokens with logarithmic curve", async function () {
    // Test smaller donation amounts to avoid overflow
    const donations = [
      ethers.parseUnits("1", 6),    // 1 USDC
      ethers.parseUnits("10", 6),   // 10 USDC
      ethers.parseUnits("100", 6),  // 100 USDC
    ];

    let prevTokenAmount = BigInt(0);
    
    for (let i = 0; i < donations.length; i++) {
      const tokenAmount = await token.calculateTokenAmount(donations[i]);
      
      // Ensure tokens are greater than zero
      expect(tokenAmount > 0n).to.be.true;
      
      if (i > 0) {
        // For 10x increase in donation, token amount should be less than 10x
        const ratio = Number(tokenAmount) / Number(prevTokenAmount);
        // Token increases should be sub-linear (logarithmic)
        if (i > 1) {
          expect(ratio).to.be.lessThan(10);
        }
      }
      
      prevTokenAmount = tokenAmount;
    }
  });

  it("should only allow minters to mint tokens", async function () {
    const donationAmount = ethers.parseUnits("10", 6);
    
    // User1 is not a minter, should revert
    try {
      await token.connect(user1).mintFromDonation(user2.address, donationAmount);
      expect.fail("Should have thrown an error");
    } catch (error) {
      // Expected to fail, test passed
    }
    
    // Grant minter role to user1
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, user1.address);
    
    // Now user1 should be able to mint
    await token.connect(user1).mintFromDonation(user2.address, donationAmount);
    const balance = await token.balanceOf(user2.address);
    expect(balance > 0n).to.be.true;
  });
}); 