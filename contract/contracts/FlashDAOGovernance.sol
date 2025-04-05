// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ISelfProtocol.sol";
import "./FlashDAOToken.sol";
import "./VolunteerRegistry.sol";

/**
 * @title FlashDAOGovernance
 * @dev Governance contract for FlashDAO with voting and fund distribution
 */
contract FlashDAOGovernance is AccessControl, ReentrancyGuard {
    // Access roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // External contracts
    FlashDAOToken public governanceToken;
    IERC20 public usdcToken;
    VolunteerRegistry public volunteerRegistry;
    ISelfProtocol public selfProtocol;
    
    // Voting and election state
    mapping(address => uint256) public votingPower;
    mapping(address => bool) public hasVoted;
    mapping(uint256 => uint256) public volunteerVotes;
    uint256 public winningVolunteerIndex;
    bool public electionConcluded;
    bool public noWinner;
    
    // Events
    event VoteCast(address indexed voter, uint256 indexed volunteerIndex, uint256 votes);
    event ElectionConcluded(uint256 winningVolunteerIndex, address winner, uint256 voteCount);
    
    /**
     * @dev Constructor
     * @param _governanceTokenAddress Address of the governance token
     * @param _usdcAddress Address of the USDC token
     * @param _volunteerRegistryAddress Address of the volunteer registry
     * @param _selfProtocolAddress Address of the Self Protocol
     * @param _admin Address of the admin
     */
    constructor(
        address _governanceTokenAddress,
        address _usdcAddress,
        address _volunteerRegistryAddress,
        address _selfProtocolAddress,
        address _admin
    ) {
        require(_governanceTokenAddress != address(0), "Invalid token address");
        require(_usdcAddress != address(0), "Invalid USDC address");
        require(_volunteerRegistryAddress != address(0), "Invalid registry address");
        require(_selfProtocolAddress != address(0), "Invalid Self Protocol address");
        require(_admin != address(0), "Invalid admin address");
        
        governanceToken = FlashDAOToken(_governanceTokenAddress);
        usdcToken = IERC20(_usdcAddress);
        volunteerRegistry = VolunteerRegistry(_volunteerRegistryAddress);
        selfProtocol = ISelfProtocol(_selfProtocolAddress);
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
    }
    
    /**
     * @dev Cast a vote for a volunteer
     * @param _volunteerIndex Index of the volunteer in the registry
     */
    function vote(uint256 _volunteerIndex) external nonReentrant {
        require(!electionConcluded, "Election already concluded");
        require(volunteerRegistry.isApprovedVolunteer(address(0)), "Volunteer not approved");
        require(!hasVoted[msg.sender], "Already voted");
        
        // Get voting power from governance token balance
        uint256 balance = governanceToken.balanceOf(msg.sender);
        require(balance > 0, "No voting power");
        
        // Record vote
        votingPower[msg.sender] = balance;
        volunteerVotes[_volunteerIndex] += balance;
        hasVoted[msg.sender] = true;
        
        emit VoteCast(msg.sender, _volunteerIndex, balance);
    }
    
    /**
     * @dev Conclude the election and determine winner
     */
    function concludeElection() external onlyRole(ADMIN_ROLE) {
        require(!electionConcluded, "Election already concluded");
        
        // Find volunteer with most votes
        uint256 maxVotes = 0;
        bool hasWinner = false;
        uint256 volunteerCount = volunteerRegistry.getVolunteerCount();
        
        for (uint256 i = 0; i < volunteerCount; i++) {
            if (volunteerVotes[i] > maxVotes) {
                maxVotes = volunteerVotes[i];
                winningVolunteerIndex = i;
                hasWinner = true;
            }
        }
        
        electionConcluded = true;
        
        if (hasWinner && maxVotes > 0) {
            // Get winning volunteer address (this is simplified)
            address winner = address(0); // In a real implementation, get this from volunteer registry
            emit ElectionConcluded(winningVolunteerIndex, winner, maxVotes);
        } else {
            noWinner = true;
            emit ElectionConcluded(0, address(0), 0);
        }
    }
    
    /**
     * @dev Get the current vote count for a volunteer
     * @param _volunteerIndex Index of the volunteer
     * @return Vote count
     */
    function getVoteCount(uint256 _volunteerIndex) external view returns (uint256) {
        return volunteerVotes[_volunteerIndex];
    }
    
    /**
     * @dev Check if an address has voted
     * @param _voter Address to check
     * @return Whether the address has voted
     */
    function hasUserVoted(address _voter) external view returns (bool) {
        return hasVoted[_voter];
    }
} 