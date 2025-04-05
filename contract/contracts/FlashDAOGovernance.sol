// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./FlashDAOToken.sol";
import "./FlashDAOTreasury.sol";
import "./VolunteerRegistry.sol";

/**
 * @title FlashDAOGovernance
 * @dev Governance contract for FlashDAO with volunteer election mechanism
 */
contract FlashDAOGovernance is AccessControl, ReentrancyGuard {
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // External contracts
    FlashDAOToken public governanceToken;
    FlashDAOTreasury public treasury;
    VolunteerRegistry public volunteerRegistry;
    
    // Election counter
    uint256 public electionCount;
    
    // Default voting period (7 days)
    uint256 public constant DEFAULT_VOTING_PERIOD = 7 days;
    
    enum ElectionState { Active, Completed }
    
    struct Election {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool completed;
        uint256 winningVolunteerId;
        uint256[] volunteerIds; // Array of volunteer IDs from registry
        mapping(uint256 => uint256) volunteerVotes; // volunteerId => voteCount
        mapping(address => bool) hasVoted; // Tracks if an address has voted
    }
    
    // Election ID => Election
    mapping(uint256 => Election) public elections;
    
    // Events
    event ElectionCreated(uint256 indexed electionId, string title, uint256 startTime, uint256 endTime);
    event VolunteersAdded(uint256 indexed electionId, uint256[] volunteerIds);
    event VoteCast(address indexed voter, uint256 indexed electionId, uint256 indexed volunteerId, uint256 votes);
    event ElectionCompleted(uint256 indexed electionId, uint256 winningVolunteerId, address winner);
    
    /**
     * @dev Constructor
     * @param _governanceToken Address of the governance token
     * @param _treasury Address of the treasury
     * @param _volunteerRegistry Address of the volunteer registry
     */
    constructor(
        address _governanceToken,
        address _treasury,
        address _volunteerRegistry
    ) {
        require(_governanceToken != address(0), "Invalid governance token address");
        require(_treasury != address(0), "Invalid treasury address");
        require(_volunteerRegistry != address(0), "Invalid volunteer registry address");
        
        governanceToken = FlashDAOToken(_governanceToken);
        treasury = FlashDAOTreasury(_treasury);
        volunteerRegistry = VolunteerRegistry(_volunteerRegistry);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        // Grant GOVERNANCE_ROLE to this contract in treasury
        FlashDAOTreasury(_treasury).grantRole(keccak256("GOVERNANCE_ROLE"), address(this));
    }
    
    /**
     * @dev Create a new election
     * @param title Title of the election
     * @param description Description of the election
     * @param duration Duration of the election in seconds (0 for default)
     */
    function createElection(
        string calldata title,
        string calldata description,
        uint256 duration
    ) external onlyRole(ADMIN_ROLE) returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        
        uint256 electionId = electionCount++;
        
        Election storage election = elections[electionId];
        election.id = electionId;
        election.title = title;
        election.description = description;
        election.startTime = block.timestamp;
        election.endTime = block.timestamp + (duration > 0 ? duration : DEFAULT_VOTING_PERIOD);
        election.completed = false;
        
        emit ElectionCreated(electionId, title, election.startTime, election.endTime);
        return electionId;
    }
    
    /**
     * @dev Add volunteers to an election
     * @param electionId ID of the election
     * @param volunteerIndices Array of volunteer indices from registry
     */
    function addVolunteersToElection(uint256 electionId, uint256[] calldata volunteerIndices) 
        external onlyRole(ADMIN_ROLE) 
    {
        require(getElectionState(electionId) == ElectionState.Active, "Election not active");
        
        Election storage election = elections[electionId];
        
        for (uint256 i = 0; i < volunteerIndices.length; i++) {
            uint256 volunteerIdx = volunteerIndices[i];
            require(volunteerIdx < volunteerRegistry.getVolunteerCount(), "Invalid volunteer index");
            
            // Add volunteer to election
            election.volunteerIds.push(volunteerIdx);
        }
        
        emit VolunteersAdded(electionId, volunteerIndices);
    }
    
    /**
     * @dev Cast vote in an election
     * @param electionId ID of the election
     * @param volunteerIdx Index of the volunteer in election's volunteer list
     */
    function vote(uint256 electionId, uint256 volunteerIdx) external nonReentrant {
        require(getElectionState(electionId) == ElectionState.Active, "Election not active");
        
        // Check if voter is a volunteer - volunteers cannot vote
        require(!volunteerRegistry.isVolunteer(msg.sender), "Volunteers cannot vote");
        
        Election storage election = elections[electionId];
        require(volunteerIdx < election.volunteerIds.length, "Invalid volunteer index");
        require(!election.hasVoted[msg.sender], "Already voted in this election");
        
        // Get voting power based on governance token balance
        uint256 votes = governanceToken.balanceOf(msg.sender);
        require(votes > 0, "No voting power");
        
        // Record vote
        uint256 volunteerId = election.volunteerIds[volunteerIdx];
        election.hasVoted[msg.sender] = true;
        election.volunteerVotes[volunteerId] += votes;
        
        emit VoteCast(msg.sender, electionId, volunteerId, votes);
    }
    
    /**
     * @dev Complete an election and determine the winner
     * @param electionId ID of the election
     */
    function completeElection(uint256 electionId) external onlyRole(ADMIN_ROLE) {
        Election storage election = elections[electionId];
        require(!election.completed, "Election already completed");
        require(block.timestamp >= election.endTime, "Voting period not ended");
        
        election.completed = true;
        
        // Find volunteer with most votes
        uint256 winningVotes = 0;
        uint256 winningVolunteerId = 0;
        bool hasWinner = false;
        
        for (uint256 i = 0; i < election.volunteerIds.length; i++) {
            uint256 volunteerId = election.volunteerIds[i];
            uint256 voteCount = election.volunteerVotes[volunteerId];
            
            if (voteCount > winningVotes) {
                winningVotes = voteCount;
                winningVolunteerId = volunteerId;
                hasWinner = true;
            }
        }
        
        if (hasWinner) {
            election.winningVolunteerId = winningVolunteerId;
            
            (address winnerAddress, , , ) = volunteerRegistry.getVolunteerByIndex(winningVolunteerId);
            
            emit ElectionCompleted(electionId, winningVolunteerId, winnerAddress);
        } else {
            emit ElectionCompleted(electionId, 0, address(0));
        }
    }
    
    /**
     * @dev Distribute funds to the winning volunteer
     * @param electionId ID of the election
     * @param amount Amount to distribute
     */
    function distributeToWinner(uint256 electionId, uint256 amount) external onlyRole(ADMIN_ROLE) nonReentrant {
        Election storage election = elections[electionId];
        require(election.completed, "Election not completed");
        
        (address winnerAddress, , , ) = volunteerRegistry.getVolunteerByIndex(election.winningVolunteerId);
        require(winnerAddress != address(0), "No winner found");
        
        // Execute transfer through treasury
        treasury.executeTransfer(winnerAddress, amount);
    }
    
    /**
     * @dev Get election state
     * @param electionId ID of the election
     */
    function getElectionState(uint256 electionId) public view returns (ElectionState) {
        Election storage election = elections[electionId];
        
        if (election.completed || block.timestamp > election.endTime) {
            return ElectionState.Completed;
        } else {
            return ElectionState.Active;
        }
    }
    
    /**
     * @dev Get election details
     * @param electionId ID of the election
     */
    function getElectionDetails(uint256 electionId) external view returns (
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        bool completed,
        uint256 volunteerCount,
        ElectionState state
    ) {
        Election storage election = elections[electionId];
        return (
            election.title,
            election.description,
            election.startTime,
            election.endTime,
            election.completed,
            election.volunteerIds.length,
            getElectionState(electionId)
        );
    }
    
    /**
     * @dev Get volunteer vote count
     * @param electionId ID of the election
     * @param volunteerIdx Index of the volunteer in the election
     */
    function getVolunteerVotes(uint256 electionId, uint256 volunteerIdx) external view returns (uint256) {
        Election storage election = elections[electionId];
        require(volunteerIdx < election.volunteerIds.length, "Invalid volunteer index");
        
        uint256 volunteerId = election.volunteerIds[volunteerIdx];
        return election.volunteerVotes[volunteerId];
    }
    
    /**
     * @dev Check if an address has voted in an election
     * @param electionId ID of the election
     * @param voter Address of the voter
     */
    function hasVoted(uint256 electionId, address voter) external view returns (bool) {
        return elections[electionId].hasVoted[voter];
    }
} 