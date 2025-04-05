// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title ImprovedFlashDAO
 * @dev Improved contract for flash governance of disaster relief funds with pre-authorization mechanism
 */
contract ImprovedFlashDAO is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    bytes32 public constant VOLUNTEER_ROLE = keccak256("VOLUNTEER_ROLE");
    
    struct Disaster {
        uint256 id;
        string name;
        string description;
        uint256 fundingGoal;
        uint256 totalPledged;        // 圈存的總金額
        uint256 totalCollected;      // 實際收取的總金額
        uint256 creationTime;        // 創建時間
        uint256 expiryTime;          // 過期時間（創建後一週）
        uint256 fundingDeadline;
        uint256 votingDeadline;
        bool fundingComplete;
        bool votingComplete;
        bool fundsDistributed;
        bool expired;                // 是否已過期
        address selectedVolunteer;
        mapping(address => uint256) pledges;  // 圈存承諾的金額
        mapping(address => uint256) donations; // 實際捐款的金額
        mapping(address => bool) hasVoted;
        mapping(address => uint256) votesReceived;
    }
    
    struct VolunteerInfo {
        string name;
        string selfVerificationId;
        bool isActive;
    }
    
    // 一週的秒數
    uint256 private constant ONE_WEEK = 7 * 24 * 60 * 60;
    
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
    event DisasterCreated(uint256 indexed disasterId, string name, uint256 fundingGoal, uint256 fundingDeadline, uint256 votingDeadline, uint256 expiryTime);
    event DonationPledged(uint256 indexed disasterId, address indexed donor, uint256 amount);
    event DonationCollected(uint256 indexed disasterId, address indexed donor, uint256 amount);
    event DonationRefunded(uint256 indexed disasterId, address indexed donor, uint256 amount);
    event VolunteerRegistered(address indexed volunteer, string name, string selfVerificationId);
    event VoteCast(uint256 indexed disasterId, address indexed voter, address indexed volunteer);
    event FundsDistributed(uint256 indexed disasterId, address volunteer, uint256 amount);
    event DisasterExpired(uint256 indexed disasterId, uint256 timestamp);
    event DisasterClosed(uint256 indexed disasterId, uint256 timestamp, string reason);
    
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
        disaster.creationTime = block.timestamp;
        disaster.expiryTime = block.timestamp + ONE_WEEK; // 設置一週後過期
        disaster.fundingDeadline = block.timestamp + _fundingDuration;
        disaster.votingDeadline = disaster.fundingDeadline + _votingDuration;
        
        emit DisasterCreated(
            disasterId,
            _name,
            _fundingGoal,
            disaster.fundingDeadline,
            disaster.votingDeadline,
            disaster.expiryTime
        );
    }
    
    /**
     * @dev Pledge a donation to a disaster (only authorizes, doesn't transfer tokens yet)
     * @param _disasterId ID of the disaster
     * @param _amount Amount to pledge
     */
    function pledgeDonation(uint256 _disasterId, uint256 _amount) external nonReentrant whenNotPaused {
        Disaster storage disaster = disasters[_disasterId];
        require(block.timestamp <= disaster.fundingDeadline, "Funding period ended");
        require(!disaster.fundingComplete, "Funding already complete");
        require(!disaster.expired, "Disaster has expired");
        
        // Check if the donor has enough balance and allowance
        require(donationToken.balanceOf(msg.sender) >= _amount, "Insufficient token balance");
        require(donationToken.allowance(msg.sender, address(this)) >= _amount, "Insufficient token allowance");
        
        // Update pledge info
        disaster.pledges[msg.sender] += _amount;
        disaster.totalPledged += _amount;
        
        if (disaster.totalPledged >= disaster.fundingGoal) {
            disaster.fundingComplete = true;
        }
        
        emit DonationPledged(_disasterId, msg.sender, _amount);
    }
    
    /**
     * @dev Collect pledged donations after a volunteer is selected
     * @param _disasterId ID of the disaster
     */
    function collectDonations(uint256 _disasterId) external onlyRole(AGENT_ROLE) nonReentrant {
        Disaster storage disaster = disasters[_disasterId];
        require(disaster.votingComplete, "Voting not complete");
        require(!disaster.fundsDistributed, "Funds already distributed");
        require(disaster.selectedVolunteer != address(0), "No volunteer selected");
        require(!disaster.expired, "Disaster has expired");
        
        // Collect donations from all pledgers
        for (uint256 i = 0; i < volunteerList.length; i++) {
            address donor = volunteerList[i];
            uint256 pledgedAmount = disaster.pledges[donor];
            
            if (pledgedAmount > 0) {
                // Attempt to transfer the tokens
                if (donationToken.transferFrom(donor, address(this), pledgedAmount)) {
                    disaster.donations[donor] = pledgedAmount;
                    disaster.totalCollected += pledgedAmount;
                    emit DonationCollected(_disasterId, donor, pledgedAmount);
                } else {
                    // If transfer fails, record that this donor didn't fulfill the pledge
                    emit DonationRefunded(_disasterId, donor, pledgedAmount);
                }
            }
        }
    }
    
    /**
     * @dev Register as a volunteer
     * @param _name Name of the volunteer
     * @param _selfVerificationId Verification ID from self.xyz
     */
    function registerVolunteer(string memory _name, string memory _selfVerificationId) external whenNotPaused {
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
    function vote(uint256 _disasterId, address _volunteer) external nonReentrant whenNotPaused {
        Disaster storage disaster = disasters[_disasterId];
        require(disaster.fundingComplete, "Funding not complete");
        require(block.timestamp <= disaster.votingDeadline, "Voting period ended");
        require(!disaster.votingComplete, "Voting already complete");
        require(disaster.pledges[msg.sender] > 0, "Only pledgers can vote");
        require(!disaster.hasVoted[msg.sender], "Already voted");
        require(hasRole(VOLUNTEER_ROLE, _volunteer), "Not a registered volunteer");
        require(msg.sender != _volunteer, "Cannot vote for self");
        require(!disaster.expired, "Disaster has expired");
        
        // Record vote
        disaster.hasVoted[msg.sender] = true;
        
        // Voting power is proportional to pledge amount
        uint256 votingPower = disaster.pledges[msg.sender];
        disaster.votesReceived[_volunteer] += votingPower;
        
        emit VoteCast(_disasterId, msg.sender, _volunteer);
    }
    
    /**
     * @dev Finalize voting and select the volunteer with the most votes
     * @param _disasterId ID of the disaster
     */
    function finalizeVoting(uint256 _disasterId) external whenNotPaused {
        Disaster storage disaster = disasters[_disasterId];
        require(disaster.fundingComplete, "Funding not complete");
        require(block.timestamp > disaster.votingDeadline, "Voting period not ended");
        require(!disaster.votingComplete, "Voting already complete");
        require(!disaster.expired, "Disaster has expired");
        
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
    function distributeFunds(uint256 _disasterId) external onlyRole(AGENT_ROLE) nonReentrant {
        Disaster storage disaster = disasters[_disasterId];
        require(disaster.votingComplete, "Voting not complete");
        require(!disaster.fundsDistributed, "Funds already distributed");
        require(disaster.selectedVolunteer != address(0), "No volunteer selected");
        require(!disaster.expired, "Disaster has expired");
        
        uint256 amount = disaster.totalCollected;
        disaster.fundsDistributed = true;
        
        require(donationToken.transfer(disaster.selectedVolunteer, amount), "Token transfer failed");
        
        emit FundsDistributed(_disasterId, disaster.selectedVolunteer, amount);
    }
    
    /**
     * @dev Check and update expiry status of a disaster
     * @param _disasterId ID of the disaster
     * @return Whether the disaster is expired
     */
    function checkExpiry(uint256 _disasterId) public returns (bool) {
        Disaster storage disaster = disasters[_disasterId];
        
        if (!disaster.expired && block.timestamp > disaster.expiryTime) {
            disaster.expired = true;
            emit DisasterExpired(_disasterId, block.timestamp);
            return true;
        }
        
        return disaster.expired;
    }
    
    /**
     * @dev Close a disaster DAO and stop all functionality
     * @param _disasterId ID of the disaster
     * @param _reason Reason for closing the disaster
     */
    function closeDisaster(uint256 _disasterId, string memory _reason) external onlyRole(AGENT_ROLE) {
        Disaster storage disaster = disasters[_disasterId];
        disaster.expired = true;
        emit DisasterClosed(_disasterId, block.timestamp, _reason);
    }
    
    /**
     * @dev Pause all contract functions
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause all contract functions
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Get pledge amount for a specific donor and disaster
     * @param _disasterId ID of the disaster
     * @param _donor Address of the donor
     * @return Pledge amount
     */
    function getPledge(uint256 _disasterId, address _donor) external view returns (uint256) {
        return disasters[_disasterId].pledges[_donor];
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