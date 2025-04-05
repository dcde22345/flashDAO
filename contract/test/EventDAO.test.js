const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EventDAO System", function () {
  // 主要測試 EventDAO 合約
  let eventDAOFactory;
  let selfProtocolMock;
  let mockUSDC;
  let eventDAO;
  let owner, user1, user2, user3, volunteer1, volunteer2;
  let eventId;
  const EVENT_NAME = "Test Disaster Relief";
  const EVENT_DESCRIPTION = "Relief efforts for test disaster";
  const USDC_DECIMALS = 6;
  
  // Helper to create USDC amount with proper decimals
  const usdcAmount = (amount) => ethers.parseUnits(amount.toString(), USDC_DECIMALS);

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, user3, volunteer1, volunteer2] = await ethers.getSigners();

    // Deploy mock USDC token
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    mockUSDC = await ERC20Mock.deploy("Mock USDC", "mUSDC", 6);
    await mockUSDC.waitForDeployment();

    // Mint USDC to users
    await mockUSDC.mint(user1.address, usdcAmount(1000));
    await mockUSDC.mint(user2.address, usdcAmount(500));
    await mockUSDC.mint(user3.address, usdcAmount(200));

    // Deploy SelfProtocolMock
    const SelfProtocolMock = await ethers.getContractFactory("SelfProtocolMock");
    selfProtocolMock = await SelfProtocolMock.deploy();
    await selfProtocolMock.waitForDeployment();

    // Verify volunteers
    await selfProtocolMock.verifyUser(volunteer1.address);
    await selfProtocolMock.verifyUser(volunteer2.address);

    // Deploy EventDAOFactory
    const EventDAOFactory = await ethers.getContractFactory("EventDAOFactory");
    eventDAOFactory = await EventDAOFactory.deploy(
      await mockUSDC.getAddress(),
      await selfProtocolMock.getAddress()
    );
    await eventDAOFactory.waitForDeployment();

    // Create an EventDAO
    const tx = await eventDAOFactory.createEventDAO(
      EVENT_NAME,
      EVENT_DESCRIPTION,
      60 * 60 * 24 * 7 // 7 days in seconds
    );
    const receipt = await tx.wait();
    
    // Extract eventId from event
    const event = receipt.logs
      .filter(log => log.fragment && log.fragment.name === 'EventDAOCreated')
      .map(log => eventDAOFactory.interface.parseLog(log))[0];
    
    eventId = event.args.eventId;
    
    // Get EventDAO address
    const eventDAOInfo = await eventDAOFactory.eventDAOs(eventId);
    const eventDAOAddress = eventDAOInfo.daoAddress;
    
    // Connect to EventDAO
    const EventDAO = await ethers.getContractFactory("EventDAO");
    eventDAO = EventDAO.attach(eventDAOAddress);
  });

  describe("DAO Factory", function () {
    it("should create an event DAO correctly", async function () {
      const eventDAOInfo = await eventDAOFactory.eventDAOs(eventId);
      
      expect(eventDAOInfo.eventName).to.equal(EVENT_NAME);
      expect(eventDAOInfo.exists).to.be.true;
      expect(Number(await eventDAOFactory.getEventDAOCount())).to.equal(1);
    });

    it("should track active DAOs", async function () {
      const activeEvents = await eventDAOFactory.getActiveEventDAOs();
      expect(activeEvents.length).to.equal(1);
      expect(activeEvents[0]).to.equal(eventId);
    });
  });

  describe("Volunteer Registration", function () {
    it("should allow verified users to register as volunteers", async function () {
      await eventDAO.connect(volunteer1).registerAsVolunteer(
        "Volunteer 1",
        "I want to help",
        "0x" // empty credentials as we're using mock
      );
      
      expect(await eventDAO.isVolunteer(volunteer1.address)).to.be.true;
      expect(Number(await eventDAO.getVolunteerCount())).to.equal(1);
      
      const volunteerInfo = await eventDAO.getVolunteer(0);
      expect(volunteerInfo[0]).to.equal(volunteer1.address);
      expect(volunteerInfo[1]).to.equal("Volunteer 1");
    });

    it("should require volunteer approval by admin", async function () {
      await eventDAO.connect(volunteer1).registerAsVolunteer("V1", "Help", "0x");
      
      const volunteerInfo1 = await eventDAO.getVolunteer(0);
      expect(volunteerInfo1[3]).to.be.false; // not approved yet
      
      await eventDAO.connect(owner).approveVolunteer(0);
      
      const volunteerInfo2 = await eventDAO.getVolunteer(0);
      expect(volunteerInfo2[3]).to.be.true; // now approved
    });

    it("should not allow voters to be volunteers", async function () {
      // Register two volunteers first
      await eventDAO.connect(volunteer1).registerAsVolunteer("V1", "Help", "0x");
      await eventDAO.connect(volunteer2).registerAsVolunteer("V2", "Help too", "0x");
      
      // Approve both volunteers
      await eventDAO.connect(owner).approveVolunteer(0);
      await eventDAO.connect(owner).approveVolunteer(1);
      
      // User makes a donation
      await mockUSDC.connect(user1).approve(eventDAO.getAddress(), usdcAmount(100));
      await eventDAO.connect(user1).donate(usdcAmount(100));
      
      // User votes for a volunteer
      await eventDAO.connect(user1).vote(1);
      
      // Try to register as volunteer (should fail)
      await expect(
        eventDAO.connect(user1).registerAsVolunteer("User1", "Want to help", "0x")
      ).to.be.rejectedWith("Voters cannot be volunteers");
    });
    
    it("should allow donors to be volunteers", async function () {
      // Verify user2 in Self Protocol
      await selfProtocolMock.verifyUser(user2.address);
      
      // First make a donation
      await mockUSDC.connect(user2).approve(eventDAO.getAddress(), usdcAmount(50));
      await eventDAO.connect(user2).donate(usdcAmount(50));
      
      // Register as volunteer (should succeed)
      await eventDAO.connect(user2).registerAsVolunteer("User2", "Want to help", "0x");
      
      expect(await eventDAO.isVolunteer(user2.address)).to.be.true;
    });
  });

  describe("Donations and Governance Tokens", function () {
    it("should accept donations and mint tokens", async function () {
      await mockUSDC.connect(user1).approve(eventDAO.getAddress(), usdcAmount(100));
      await eventDAO.connect(user1).donate(usdcAmount(100));
      
      const donation = await eventDAO.donations(user1.address);
      expect(donation.toString()).to.equal(usdcAmount(100).toString());
      
      const balance = await eventDAO.balanceOf(user1.address);
      expect(Number(balance)).to.be.greaterThan(0);
      
      const donors = await eventDAO.getDonors();
      expect(donors.length).to.equal(1);
      expect(donors[0]).to.equal(user1.address);
    });

    it("should calculate tokens using logarithmic curve", async function () {
      // Approve and donate
      await mockUSDC.connect(user1).approve(eventDAO.getAddress(), usdcAmount(10));
      await eventDAO.connect(user1).donate(usdcAmount(10));
      const tokenAmount1 = await eventDAO.balanceOf(user1.address);
      
      await mockUSDC.connect(user2).approve(eventDAO.getAddress(), usdcAmount(100));
      await eventDAO.connect(user2).donate(usdcAmount(100));
      const tokenAmount2 = await eventDAO.balanceOf(user2.address);
      
      // 10x donation should result in less than 10x tokens (logarithmic)
      expect(Number(tokenAmount2)).to.be.lessThan(Number(tokenAmount1) * 10);
    });

    it("should not allow volunteers to donate", async function () {
      await eventDAO.connect(volunteer1).registerAsVolunteer("V1", "Help", "0x");
      
      await mockUSDC.connect(volunteer1).approve(eventDAO.getAddress(), usdcAmount(50));
      await expect(
        eventDAO.connect(volunteer1).donate(usdcAmount(50))
      ).to.be.rejectedWith("Volunteers cannot donate");
    });
  });

  describe("Voting Process", function () {
    beforeEach(async function () {
      // Register volunteers
      await eventDAO.connect(volunteer1).registerAsVolunteer("V1", "Help", "0x");
      await eventDAO.connect(volunteer2).registerAsVolunteer("V2", "Also help", "0x");
      
      // Approve volunteers
      await eventDAO.connect(owner).approveVolunteer(0);
      await eventDAO.connect(owner).approveVolunteer(1);
      
      // Users donate
      await mockUSDC.connect(user1).approve(eventDAO.getAddress(), usdcAmount(100));
      await eventDAO.connect(user1).donate(usdcAmount(100));
      
      await mockUSDC.connect(user2).approve(eventDAO.getAddress(), usdcAmount(50));
      await eventDAO.connect(user2).donate(usdcAmount(50));
    });

    it("should allow token holders to vote", async function () {
      await eventDAO.connect(user1).vote(0); // vote for volunteer1
      
      expect(await eventDAO.hasVoted(user1.address)).to.be.true;
      
      const volunteerInfo = await eventDAO.getVolunteer(0);
      expect(volunteerInfo[4]).to.equal(await eventDAO.balanceOf(user1.address));
    });

    it("should not allow double voting", async function () {
      await eventDAO.connect(user1).vote(0);
      
      await expect(
        eventDAO.connect(user1).vote(1)
      ).to.be.rejectedWith("Already voted");
    });

    it("should not allow volunteers to vote", async function () {
      // Try to donate first (should fail)
      await mockUSDC.connect(volunteer1).approve(eventDAO.getAddress(), usdcAmount(10));
      await expect(
        eventDAO.connect(volunteer1).donate(usdcAmount(10))
      ).to.be.rejectedWith("Volunteers cannot donate");
      
      // Try to vote (should fail due to no voting power)
      await expect(
        eventDAO.connect(volunteer1).vote(1)
      ).to.be.rejectedWith("No voting power");
    });
  });

  describe("Fund Distribution", function () {
    beforeEach(async function () {
      // Use ethers.provider.send to manipulate time
      const ONE_DAY = 24 * 60 * 60;
      
      // Register and approve volunteers
      await eventDAO.connect(volunteer1).registerAsVolunteer("V1", "Help", "0x");
      await eventDAO.connect(volunteer2).registerAsVolunteer("V2", "Also help", "0x");
      await eventDAO.connect(owner).approveVolunteer(0);
      await eventDAO.connect(owner).approveVolunteer(1);
      
      // Users donate
      await mockUSDC.connect(user1).approve(eventDAO.getAddress(), usdcAmount(100));
      await eventDAO.connect(user1).donate(usdcAmount(100));
      await mockUSDC.connect(user2).approve(eventDAO.getAddress(), usdcAmount(50));
      await eventDAO.connect(user2).donate(usdcAmount(50));
      
      // Vote
      await eventDAO.connect(user1).vote(0); // vote for volunteer1
      await eventDAO.connect(user2).vote(0); // also vote for volunteer1
      
      // Fast forward time to expiration
      await ethers.provider.send("evm_increaseTime", [7 * ONE_DAY + 1]);
      await ethers.provider.send("evm_mine");
    });

    it("should distribute funds to winning volunteer", async function () {
      // Verify DAO is expired
      expect(await eventDAO.isExpired()).to.be.true;
      
      // Conclude election
      await eventDAO.connect(user1).concludeElection();
      expect(await eventDAO.electionConcluded()).to.be.true;
      
      // Check USDC balances before distribution
      const initialBalance = await mockUSDC.balanceOf(volunteer1.address);
      
      // Distribute funds
      await eventDAO.connect(user2).distributeFunds();
      
      // Verify funds were distributed
      expect(await eventDAO.fundsDistributed()).to.be.true;
      
      // Check volunteer received funds
      const finalBalance = await mockUSDC.balanceOf(volunteer1.address);
      const expectedFinalBalance = BigInt(initialBalance) + BigInt(usdcAmount(150)); // 100 + 50
      expect(finalBalance.toString()).to.equal(expectedFinalBalance.toString());
    });

    it("should allow donors to claim refunds if no winner", async function () {
      // Use a new DAO without votes
      const tx = await eventDAOFactory.createEventDAO(
        "No Winner DAO",
        "DAO with no votes",
        60 * 60 // 1 hour
      );
      const receipt = await tx.wait();
      
      // Extract eventId from event
      const event = receipt.logs
        .filter(log => log.fragment && log.fragment.name === 'EventDAOCreated')
        .map(log => eventDAOFactory.interface.parseLog(log))[0];
      
      const newEventId = event.args.eventId;
      
      // Get EventDAO address
      const eventDAOInfo = await eventDAOFactory.eventDAOs(newEventId);
      const eventDAOAddress = eventDAOInfo.daoAddress;
      
      // Connect to new EventDAO
      const EventDAO = await ethers.getContractFactory("EventDAO");
      const newEventDAO = EventDAO.attach(eventDAOAddress);
      
      // Users donate to new DAO
      await mockUSDC.connect(user3).approve(newEventDAO.getAddress(), usdcAmount(200));
      await newEventDAO.connect(user3).donate(usdcAmount(200));
      
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [60 * 60 + 1]); // 1 hour + 1 second
      await ethers.provider.send("evm_mine");
      
      // Conclude election (with no votes)
      await newEventDAO.connect(user3).concludeElection();
      
      // Check USDC balance before refund
      const initialBalance = await mockUSDC.balanceOf(user3.address);
      
      // Claim refund
      await newEventDAO.connect(user3).claimRefund();
      
      // Check user received refund
      const finalBalance = await mockUSDC.balanceOf(user3.address);
      const expectedFinalBalance = BigInt(initialBalance) + BigInt(usdcAmount(200));
      expect(finalBalance.toString()).to.equal(expectedFinalBalance.toString());
    });
  });
}); 