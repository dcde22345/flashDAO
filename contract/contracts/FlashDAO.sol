// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FlashDAO
 * @dev Contract for flash governance of disaster relief funds
 */
contract FlashDAO is AccessControl, ReentrancyGuard {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    bytes32 public constant VOLUNTEER_ROLE = keccak256("VOLUNTEER_ROLE");
    
    struct Disaster {
        uint256 id;
        string name;
        string description;
        uint256 fundingGoal;
        uint256 totalRaised;
        uint256 fundingDeadline;
        uint256 votingDeadline;
        bool fundingComplete;
        bool votingComplete;
        bool fundsDistributed;
        address selectedVolunteer;
        mapping(address => uint256) donations;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) votesReceived;
    }
    
    struct VolunteerInfo {
        string name;
        string selfVerificationId;
        bool isActive;
    }
    
    // Disaster ID to Disaster
    mapping(uint256 => Disaster) public disasters;
    
    // Volunteer address to VolunteerInfo
    mapping(address => VolunteerInfo) public volunteers;
    
    // List of volunteer addresses
    address[] public volunteerList;
    
    // Disaster counter
    uint256 public disasterCount;
    
    // Token used for donations
    IERC20 public donationToken;
    
    // Events
    event DisasterCreated(uint256 indexed disasterId, string name, uint256 fundingGoal, uint256 fundingDeadline, uint256 votingDeadline);
    event DonationMade(uint256 indexed disasterId, address indexed donor, uint256 amount);
    event VolunteerRegistered(address indexed volunteer, string name, string selfVerificationId);
    event VoteCast(uint256 indexed disasterId, address indexed voter, address indexed volunteer);
    event FundsDistributed(uint256 indexed disasterId, address volunteer, uint256 amount);
    
    /**
     * @dev Constructor
     * @param _donationToken Address of the ERC20 token used for donations
     */
    constructor(address _donationToken) {
        donationToken = IERC20(_donationToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Creates a new disaster fundraising campaign
     * @param _name Name of the disaster
     * @param _description Description of the disaster
     * @param _fundingGoal Funding goal in donation tokens
     * @param _fundingDuration Duration of the funding period in seconds
     * @param _votingDuration Duration of the voting period in seconds
     */
    function createDisaster(
        string memory _name,
        string memory _description,
        uint256 _fundingGoal,
        uint256 _fundingDuration,
        uint256 _votingDuration
    ) external onlyRole(AGENT_ROLE) {
        uint256 disasterId = disasterCount++;
        
        Disaster storage disaster = disasters[disasterId];
        disaster.id = disasterId;
        disaster.name = _name;
        disaster.description = _description;
        disaster.fundingGoal = _fundingGoal;
        disaster.fundingDeadline = block.timestamp + _fundingDuration;
        disaster.votingDeadline = disaster.fundingDeadline + _votingDuration;
        
        emit DisasterCreated(
            disasterId,
            _name,
            _fundingGoal,
            disaster.fundingDeadline,
            disaster.votingDeadline
        );
    }
    
    /**
     * @dev Allows users to donate to a disaster
     * @param _disasterId ID of the disaster
     * @param _amount Amount to donate
     */
    function donate(uint256 _disasterId, uint256 _amount) external nonReentrant {
        Disaster storage disaster = disasters[_disasterId];
        require(block.timestamp <= disaster.fundingDeadline, "Funding period ended");
        require(!disaster.fundingComplete, "Funding already complete");
        
        // Transfer tokens from donor to this contract
        require(donationToken.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");
        
        // Update donation info
        disaster.donations[msg.sender] += _amount;
        disaster.totalRaised += _amount;
        
        if (disaster.totalRaised >= disaster.fundingGoal) {
            disaster.fundingComplete = true;
        }
        
        emit DonationMade(_disasterId, msg.sender, _amount);
    }
    
    /**
     * @dev Register as a volunteer
     * @param _name Name of the volunteer
     * @param _selfVerificationId Verification ID from self.xyz
     */
    function registerVolunteer(string memory _name, string memory _selfVerificationId) external {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_selfVerificationId).length > 0, "Verification ID cannot be empty");
        
        volunteers[msg.sender] = VolunteerInfo({
            name: _name,
            selfVerificationId: _selfVerificationId,
            isActive: true
        });
        
        volunteerList.push(msg.sender);
        _grantRole(VOLUNTEER_ROLE, msg.sender);
        
        emit VolunteerRegistered(msg.sender, _name, _selfVerificationId);
    }
    
    /**
     * @dev Vote for a volunteer to receive funds for a disaster
     * @param _disasterId ID of the disaster
     * @param _volunteer Address of the volunteer
     */
    function vote(uint256 _disasterId, address _volunteer) external {
        Disaster storage disaster = disasters[_disasterId];
        require(disaster.fundingComplete, "Funding not complete");
        require(block.timestamp <= disaster.votingDeadline, "Voting period ended");
        require(!disaster.votingComplete, "Voting already complete");
        require(disaster.donations[msg.sender] > 0, "Only donors can vote");
        require(!disaster.hasVoted[msg.sender], "Already voted");
        require(hasRole(VOLUNTEER_ROLE, _volunteer), "Not a registered volunteer");
        require(msg.sender != _volunteer, "Cannot vote for self");
        
        // Record vote
        disaster.hasVoted[msg.sender] = true;
        
        // Voting power is proportional to donation amount
        uint256 votingPower = disaster.donations[msg.sender];
        disaster.votesReceived[_volunteer] += votingPower;
        
        emit VoteCast(_disasterId, msg.sender, _volunteer);
    }
    
    /**
     * @dev Finalize voting and select the volunteer with the most votes
     * @param _disasterId ID of the disaster
     */
    function finalizeVoting(uint256 _disasterId) external {
        Disaster storage disaster = disasters[_disasterId];
        require(disaster.fundingComplete, "Funding not complete");
        require(block.timestamp > disaster.votingDeadline, "Voting period not ended");
        require(!disaster.votingComplete, "Voting already complete");
        
        address selectedVolunteer = address(0);
        uint256 maxVotes = 0;
        
        // Find volunteer with most votes
        for (uint256 i = 0; i < volunteerList.length; i++) {
            address volunteer = volunteerList[i];
            uint256 votes = disaster.votesReceived[volunteer];
            
            if (votes > maxVotes) {
                maxVotes = votes;
                selectedVolunteer = volunteer;
            }
        }
        
        require(selectedVolunteer != address(0), "No volunteer selected");
        
        disaster.selectedVolunteer = selectedVolunteer;
        disaster.votingComplete = true;
    }
    
    /**
     * @dev Distribute funds to the selected volunteer
     * @param _disasterId ID of the disaster
     */
    function distributeFunds(uint256 _disasterId) external onlyRole(AGENT_ROLE) {
        Disaster storage disaster = disasters[_disasterId];
        require(disaster.votingComplete, "Voting not complete");
        require(!disaster.fundsDistributed, "Funds already distributed");
        require(disaster.selectedVolunteer != address(0), "No volunteer selected");
        
        uint256 amount = disaster.totalRaised;
        disaster.fundsDistributed = true;
        
        require(donationToken.transfer(disaster.selectedVolunteer, amount), "Token transfer failed");
        
        emit FundsDistributed(_disasterId, disaster.selectedVolunteer, amount);
    }
    
    /**
     * @dev Get donation amount for a specific donor and disaster
     * @param _disasterId ID of the disaster
     * @param _donor Address of the donor
     * @return Donation amount
     */
    function getDonation(uint256 _disasterId, address _donor) external view returns (uint256) {
        return disasters[_disasterId].donations[_donor];
    }
    
    /**
     * @dev Get votes received by a volunteer for a specific disaster
     * @param _disasterId ID of the disaster
     * @param _volunteer Address of the volunteer
     * @return Votes received
     */
    function getVotesReceived(uint256 _disasterId, address _volunteer) external view returns (uint256) {
        return disasters[_disasterId].votesReceived[_volunteer];
    }
    
    /**
     * @dev Check if a donor has voted in a specific disaster
     * @param _disasterId ID of the disaster
     * @param _donor Address of the donor
     * @return Whether the donor has voted
     */
    function hasVoted(uint256 _disasterId, address _donor) external view returns (bool) {
        return disasters[_disasterId].hasVoted[_donor];
    }
    
    /**
     * @dev Get the total number of registered volunteers
     * @return Total number of volunteers
     */
    function getVolunteerCount() external view returns (uint256) {
        return volunteerList.length;
    }
} 