// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./FlashDAOFactory.sol";
import "./FlashDAORewards.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title FlashDAOAgent
 * @dev Automated agent for creating FlashDAOs in response to disaster events
 */
contract FlashDAOAgent is AccessControl {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    // FlashDAO Factory contract
    FlashDAOFactory public factory;
    
    // FlashDAO Rewards contract
    FlashDAORewards public rewards;
    
    // ERC20 token used for donations
    IERC20 public donationToken;
    
    // Disaster severity threshold (1-10 scale)
    uint256 public severityThreshold;
    
    // Default funding duration in seconds (7 days)
    uint256 public defaultFundingDuration = 7 days;
    
    // Default voting duration in seconds (3 days)
    uint256 public defaultVotingDuration = 3 days;
    
    // Funding goal multiplier based on severity (severity * multiplier = funding goal)
    uint256 public fundingGoalMultiplier;
    
    // Recently created disasters (to prevent duplicates)
    mapping(bytes32 => uint256) public recentDisasters;
    
    // Cooldown period for creating disasters with similar names (1 day)
    uint256 public disasterCooldown = 1 days;
    
    // Events
    event DisasterDetected(string name, string description, uint256 severity, uint256 timestamp);
    event DAOCreated(address daoAddress, string disasterName, uint256 fundingGoal);
    
    /**
     * @dev Constructor
     * @param _factory Address of the FlashDAO Factory
     * @param _rewards Address of the FlashDAO Rewards
     * @param _donationToken Address of the ERC20 token used for donations
     * @param _severityThreshold Minimum severity to trigger DAO creation (1-10 scale)
     * @param _fundingGoalMultiplier Multiplier for funding goal calculation
     */
    constructor(
        address _factory,
        address _rewards,
        address _donationToken,
        uint256 _severityThreshold,
        uint256 _fundingGoalMultiplier
    ) {
        require(_severityThreshold > 0 && _severityThreshold <= 10, "Invalid severity threshold");
        require(_fundingGoalMultiplier > 0, "Invalid funding goal multiplier");
        
        factory = FlashDAOFactory(_factory);
        rewards = FlashDAORewards(_rewards);
        donationToken = IERC20(_donationToken);
        severityThreshold = _severityThreshold;
        fundingGoalMultiplier = _fundingGoalMultiplier;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Detect a disaster and create a FlashDAO if needed
     * @param _disasterName Name of the disaster
     * @param _disasterDescription Description of the disaster
     * @param _severity Severity of the disaster (1-10 scale)
     * @param _customFundingDuration Optional custom funding duration (0 for default)
     * @param _customVotingDuration Optional custom voting duration (0 for default)
     * @return Address of the created FlashDAO or address(0) if no DAO was created
     */
    function detectDisaster(
        string memory _disasterName,
        string memory _disasterDescription,
        uint256 _severity,
        uint256 _customFundingDuration,
        uint256 _customVotingDuration
    ) external onlyRole(ORACLE_ROLE) returns (address) {
        require(_severity > 0 && _severity <= 10, "Invalid severity level");
        
        bytes32 disasterHash = keccak256(abi.encodePacked(_disasterName));
        
        // Check if a similar disaster was recently created
        require(
            block.timestamp > recentDisasters[disasterHash] + disasterCooldown,
            "Similar disaster was recently created"
        );
        
        // Check if the disaster is severe enough to trigger a FlashDAO
        if (_severity >= severityThreshold) {
            // Calculate funding goal based on severity
            uint256 fundingGoal = _severity * fundingGoalMultiplier;
            
            // Use default or custom durations
            uint256 fundingDuration = _customFundingDuration > 0 ? _customFundingDuration : defaultFundingDuration;
            uint256 votingDuration = _customVotingDuration > 0 ? _customVotingDuration : defaultVotingDuration;
            
            // Create a FlashDAO for this disaster
            address daoAddress = factory.createDAO(
                address(donationToken),
                _disasterName,
                _disasterDescription,
                fundingGoal,
                fundingDuration,
                votingDuration
            );
            
            // Mark this disaster as recently created
            recentDisasters[disasterHash] = block.timestamp;
            
            emit DAOCreated(daoAddress, _disasterName, fundingGoal);
            return daoAddress;
        }
        
        emit DisasterDetected(_disasterName, _disasterDescription, _severity, block.timestamp);
        return address(0);
    }
    
    /**
     * @dev Update the severity threshold
     * @param _newThreshold New severity threshold
     */
    function updateSeverityThreshold(uint256 _newThreshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newThreshold > 0 && _newThreshold <= 10, "Invalid severity threshold");
        severityThreshold = _newThreshold;
    }
    
    /**
     * @dev Update the funding goal multiplier
     * @param _newMultiplier New funding goal multiplier
     */
    function updateFundingGoalMultiplier(uint256 _newMultiplier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newMultiplier > 0, "Invalid funding goal multiplier");
        fundingGoalMultiplier = _newMultiplier;
    }
    
    /**
     * @dev Update the default funding duration
     * @param _newDuration New default funding duration in seconds
     */
    function updateDefaultFundingDuration(uint256 _newDuration) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newDuration > 0, "Invalid duration");
        defaultFundingDuration = _newDuration;
    }
    
    /**
     * @dev Update the default voting duration
     * @param _newDuration New default voting duration in seconds
     */
    function updateDefaultVotingDuration(uint256 _newDuration) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newDuration > 0, "Invalid duration");
        defaultVotingDuration = _newDuration;
    }
    
    /**
     * @dev Update the disaster cooldown period
     * @param _newCooldown New cooldown period in seconds
     */
    function updateDisasterCooldown(uint256 _newCooldown) external onlyRole(DEFAULT_ADMIN_ROLE) {
        disasterCooldown = _newCooldown;
    }
} 