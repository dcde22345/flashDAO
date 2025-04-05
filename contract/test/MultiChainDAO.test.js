const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiChain DAO System", function () {
  let eventDAOFactory;
  let multiChainDAOFactory;
  let usdcToken;
  let selfProtocol;
  let owner;
  let user1;
  let user2;
  let user3;
  let volunteer1;
  let volunteer2;
  let eventId;
  let deploymentInfo;

  const EVENT_NAME = "Ukraine Earthquake Relief";
  const EVENT_DESCRIPTION = "Emergency relief for Ukraine earthquake victims";
  const ONE_WEEK = 7 * 24 * 60 * 60; // 1 week in seconds
  const TIMESTAMP = Math.floor(Date.now() / 1000); // 使用固定的時間戳
  
  // Simulate different chain IDs
  const ETHEREUM_CHAIN_ID = 1;
  const OPTIMISM_CHAIN_ID = 10;
  const BASE_CHAIN_ID = 8453;

  beforeEach(async function () {
    [owner, user1, user2, user3, volunteer1, volunteer2] = await ethers.getSigners();
    
    // Deploy mock contracts
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    usdcToken = await ERC20Mock.deploy("USDC", "USDC", 6); // USDC has 6 decimals
    
    const SelfProtocolMock = await ethers.getContractFactory("SelfProtocolMock");
    selfProtocol = await SelfProtocolMock.deploy();
    
    // Deploy DAO Factories
    const EventDAOFactory = await ethers.getContractFactory("EventDAOFactory");
    eventDAOFactory = await EventDAOFactory.deploy(
      await usdcToken.getAddress(),
      await selfProtocol.getAddress()
    );
    
    const MultiChainDAOFactory = await ethers.getContractFactory("MultiChainDAOFactory");
    multiChainDAOFactory = await MultiChainDAOFactory.deploy();
    
    // Verify volunteers using the verifyUser method
    await selfProtocol.verifyUser(volunteer1.address);
    await selfProtocol.verifyUser(volunteer2.address);
    
    // Mint USDC for testing
    await usdcToken.mint(user1.address, ethers.parseUnits("1000", 6));
    await usdcToken.mint(user2.address, ethers.parseUnits("1000", 6));
    await usdcToken.mint(user3.address, ethers.parseUnits("1000", 6));
    
    // Generate eventId for our tests using fixed parameters
    eventId = await multiChainDAOFactory.generateEventIdWithParams(
      EVENT_NAME, 
      EVENT_DESCRIPTION,
      TIMESTAMP,
      owner.address
    );
  });

  describe("Cross-Chain DAO Deployment", function () {
    it("should generate consistent event IDs across different chains", async function () {
      // Generate first ID with fixed parameters
      const id1 = await multiChainDAOFactory.generateEventIdWithParams(
        EVENT_NAME,
        EVENT_DESCRIPTION,
        TIMESTAMP,
        owner.address
      );
      
      // Generate second ID with the same parameters
      const id2 = await multiChainDAOFactory.generateEventIdWithParams(
        EVENT_NAME,
        EVENT_DESCRIPTION,
        TIMESTAMP,
        owner.address
      );
      
      // These should be equal as they use the same input parameters
      expect(id1).to.equal(id2);
      
      // Generate ID with different timestamp - should be different
      const id3 = await multiChainDAOFactory.generateEventIdWithParams(
        EVENT_NAME,
        EVENT_DESCRIPTION,
        TIMESTAMP + 100,
        owner.address
      );
      
      // These should be different due to different timestamp
      expect(id1).to.not.equal(id3);
    });
    
    it("should generate consistent event IDs", async function () {
      // Verify that the eventId is a valid bytes32
      expect(eventId).to.not.equal(ethers.ZeroHash);
    });
    
    it("should deploy a DAO on the current chain (simulating Ethereum)", async function () {
      // Create an event DAO using EventDAOFactory
      const tx = await eventDAOFactory.createEventDAO(
        EVENT_NAME, 
        EVENT_DESCRIPTION,
        ONE_WEEK
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "EventDAOCreated"
      );
      
      // Extract eventDAO address
      const eventDAOAddress = event.args.daoAddress;
      
      // Deploy a token for this DAO
      const FlashDAOToken = await ethers.getContractFactory("FlashDAOToken");
      const token = await FlashDAOToken.deploy();
      
      // Deploy a volunteer registry
      const VolunteerRegistry = await ethers.getContractFactory("VolunteerRegistry");
      const volunteerRegistry = await VolunteerRegistry.deploy(await selfProtocol.getAddress());
      
      // Record deployment on MultiChainDAOFactory (simulating Ethereum deployment)
      await multiChainDAOFactory.deployDAO(
        eventId,
        eventDAOAddress,
        await token.getAddress(),
        await volunteerRegistry.getAddress()
      );
      
      // Verify the deployment was recorded
      deploymentInfo = await multiChainDAOFactory.getCurrentChainDeployment(eventId);
      
      expect(deploymentInfo.eventDAOAddress).to.equal(eventDAOAddress);
      expect(deploymentInfo.active).to.be.true;
    });
    
    it("should track event counts correctly", async function () {
      // In a first test, we create a deployment
      const tx = await eventDAOFactory.createEventDAO(
        EVENT_NAME, 
        EVENT_DESCRIPTION,
        ONE_WEEK
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "EventDAOCreated"
      );
      
      const eventDAOAddress = event.args.daoAddress;
      
      // Deploy a token for this DAO
      const FlashDAOToken = await ethers.getContractFactory("FlashDAOToken");
      const token = await FlashDAOToken.deploy();
      
      // Deploy a volunteer registry
      const VolunteerRegistry = await ethers.getContractFactory("VolunteerRegistry");
      const volunteerRegistry = await VolunteerRegistry.deploy(await selfProtocol.getAddress());
      
      // Record deployment on MultiChainDAOFactory
      await multiChainDAOFactory.deployDAO(
        eventId,
        eventDAOAddress,
        await token.getAddress(),
        await volunteerRegistry.getAddress()
      );
      
      // Now check the event count is 1
      expect(await multiChainDAOFactory.getEventCount()).to.equal(1n);
    });
  });
  
  describe("Cross-Chain Event Coordination", function () {
    it("should allow deactivating a DAO on current chain", async function () {
      // First we need to create and deploy a DAO
      const tx = await eventDAOFactory.createEventDAO(
        EVENT_NAME, 
        EVENT_DESCRIPTION,
        ONE_WEEK
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "EventDAOCreated"
      );
      
      const eventDAOAddress = event.args.daoAddress;
      
      // Deploy a token for this DAO
      const FlashDAOToken = await ethers.getContractFactory("FlashDAOToken");
      const token = await FlashDAOToken.deploy();
      
      // Deploy a volunteer registry
      const VolunteerRegistry = await ethers.getContractFactory("VolunteerRegistry");
      const volunteerRegistry = await VolunteerRegistry.deploy(await selfProtocol.getAddress());
      
      // Record deployment on MultiChainDAOFactory
      await multiChainDAOFactory.deployDAO(
        eventId,
        eventDAOAddress,
        await token.getAddress(),
        await volunteerRegistry.getAddress()
      );
      
      // Now deactivate the DAO
      await multiChainDAOFactory.deactivateDAO(eventId);
      
      // Verify it's deactivated
      const updatedDeployment = await multiChainDAOFactory.getCurrentChainDeployment(eventId);
      expect(updatedDeployment.active).to.be.false;
    });
    
    it("should correctly track active deployments", async function () {
      // Get active deployments - should be empty at the beginning
      const activeDeployments = await multiChainDAOFactory.getActiveDeploymentsOnCurrentChain();
      expect(activeDeployments.length).to.equal(0);
    });
  });
  
  describe("MultiChain DAO Complete Workflow", function () {
    it("should simulate a full cross-chain voting scenario", async function () {
      // This test simulates what would happen in a real-world scenario
      // with votes on multiple chains
      
      // Step 1: Create a new event
      const newEventId = await multiChainDAOFactory.generateEventIdWithParams(
        "Global Warming Initiative", 
        "Fund projects that help reduce carbon emissions",
        TIMESTAMP,
        owner.address
      );
      
      // Step 2: Create DAOs on Ethereum chain
      const newDAOTx = await eventDAOFactory.createEventDAO(
        "Global Warming Initiative",
        "Fund projects that help reduce carbon emissions",
        ONE_WEEK
      );
      
      const newDAOReceipt = await newDAOTx.wait();
      const newDAOEvent = newDAOReceipt.logs.find(
        log => log.fragment && log.fragment.name === "EventDAOCreated"
      );
      
      const newDAOAddress = newDAOEvent.args.daoAddress;
      
      // Deploy token and registry
      const FlashDAOToken = await ethers.getContractFactory("FlashDAOToken");
      const newToken = await FlashDAOToken.deploy();
      
      const VolunteerRegistry = await ethers.getContractFactory("VolunteerRegistry");
      const newRegistry = await VolunteerRegistry.deploy(await selfProtocol.getAddress());
      
      // Record on MultiChainDAOFactory
      await multiChainDAOFactory.deployDAO(
        newEventId,
        newDAOAddress,
        await newToken.getAddress(),
        await newRegistry.getAddress()
      );
      
      // Step 3: Get the EventDAO instance
      const EventDAO = await ethers.getContractFactory("EventDAO");
      const eventDAO = EventDAO.attach(newDAOAddress);
      
      // Step 4: Register volunteers
      // Volunteers register themselves
      const emptyCreds = ethers.hexlify(new Uint8Array(0)); // Empty credentials for testing
      await eventDAO.connect(volunteer1).registerAsVolunteer(
        "Volunteer Team 1",
        "Planting trees in Amazon",
        emptyCreds
      );
      
      await eventDAO.connect(volunteer2).registerAsVolunteer(
        "Volunteer Team 2",
        "Ocean cleanup initiative",
        emptyCreds
      );
      
      // Admin approves volunteers
      await eventDAO.connect(owner).approveVolunteer(0); // Approve volunteer1
      await eventDAO.connect(owner).approveVolunteer(1); // Approve volunteer2
      
      // Step 5: Users donate and get governance tokens
      // Approve USDC spending
      await usdcToken.connect(user1).approve(newDAOAddress, ethers.parseUnits("100", 6));
      await usdcToken.connect(user2).approve(newDAOAddress, ethers.parseUnits("200", 6));
      
      // Make donations
      await eventDAO.connect(user1).donate(ethers.parseUnits("100", 6));
      await eventDAO.connect(user2).donate(ethers.parseUnits("200", 6));
      
      // Step 6: Users vote for volunteers
      await eventDAO.connect(user1).vote(0); // Vote for volunteer1
      await eventDAO.connect(user2).vote(1); // Vote for volunteer2
      
      // Step 7: In a real cross-chain scenario, we would now aggregate votes from all chains
      // For this test, we'll just check that the votes were recorded correctly
      
      const volunteer1Votes = await eventDAO.volunteerVotes(0);
      const volunteer2Votes = await eventDAO.volunteerVotes(1);
      
      // Compare BigInts properly
      expect(volunteer1Votes > 0n).to.equal(true);
      expect(volunteer2Votes > 0n).to.equal(true);
      
      // Step 8: Advance time so the DAO expires
      await ethers.provider.send("evm_increaseTime", [ONE_WEEK + 1]);
      await ethers.provider.send("evm_mine");
      
      // Step 9: In a real scenario, a relayer would aggregate votes across chains
      // and then call concludeElection and distributeFunds on each chain
      
      // Conclude the election
      await eventDAO.connect(owner).concludeElection();
      
      // Check if we have a winner
      const winnerIndex = await eventDAO.winningVolunteerIndex();
      
      // Verify election was concluded
      expect(await eventDAO.electionConcluded()).to.equal(true);
      
      // Verify that a winner was selected (should be volunteer with most votes)
      // The actual winner index depends on who got more votes
      expect(winnerIndex === 0n || winnerIndex === 1n).to.equal(true);
    });
  });
}); 