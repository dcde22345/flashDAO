// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/ISelfProtocol.sol";
import "./VolunteerRegistry.sol";

/**
 * @title FlashDAOGovernance
 * @dev Governance contract for FlashDAO with voting and fund distribution
 */
contract FlashDAOGovernance is AccessControl, ReentrancyGuard {
    // Access roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Contracts
    IERC20 public governanceToken;
    IERC20 public usdcToken;
    VolunteerRegistry public volunteerRegistry;
    ISelfProtocol public selfProtocol;
    
    // Governance configuration
    uint256 public electionDuration;
    uint256 public minimumQuorum; // Min percentage (out of 100) of tokens that must vote
    
    // Election status
    uint256 public electionStartTime;
    uint256 public electionEndTime;
    bool public electionActive;
    bool public electionConcluded;
    
    // Voting tracking
    mapping(address => uint256) public votesReceived; // Volunteer -> vote count
    mapping(address => address) public voterChoices;  // Voter -> chosen volunteer
    mapping(address => bool) public hasVoted;
    uint256 public totalVotesCast;
    address public electionWinner;
    
    // Fund tracking
    uint256 public totalFundsRaised;
    bool public fundsDistributed;
    
    // Events
    event ElectionStarted(uint256 startTime, uint256 endTime);
    event VoteCast(address indexed voter, address indexed volunteer, uint256 votes);
    event ElectionConcluded(address indexed winner, uint256 votes);
    event FundsDistributed(address indexed recipient, uint256 amount);
    event NoWinnerDeclared();
    
    /**
     * @dev Constructor
     * @param _governanceToken The governance token used for voting
     * @param _usdcToken The USDC token used for donations
     * @param _volunteerRegistry Registry of verified volunteers
     * @param _selfProtocol Self Protocol for identity verification
     * @param _admin Admin address
     */
    constructor(
        address _governanceToken,
        address _usdcToken,
        address _volunteerRegistry,
        address _selfProtocol,
        address _admin
    ) {
        require(_governanceToken != address(0), "Invalid governance token");
        require(_usdcToken != address(0), "Invalid USDC token");
        require(_volunteerRegistry != address(0), "Invalid volunteer registry");
        
        governanceToken = IERC20(_governanceToken);
        usdcToken = IERC20(_usdcToken);
        volunteerRegistry = VolunteerRegistry(_volunteerRegistry);
        selfProtocol = ISelfProtocol(_selfProtocol);
        
        electionDuration = 7 days;
        minimumQuorum = 10; // 10% minimum participation
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
    }
    
    /**
     * @dev Start a new election
     * @param _duration Duration in seconds
     */
    function startElection(uint256 _duration) external onlyRole(ADMIN_ROLE) {
        require(!electionActive, "Election already active");
        require(_duration > 0, "Duration must be greater than 0");
        
        electionDuration = _duration;
        electionStartTime = block.timestamp;
        electionEndTime = electionStartTime + _duration;
        electionActive = true;
        electionConcluded = false;
        totalVotesCast = 0;
        fundsDistributed = false;
        
        emit ElectionStarted(electionStartTime, electionEndTime);
    }
    
    /**
     * @dev Vote for a volunteer
     * @param _volunteer Address of the volunteer to vote for
     */
    function vote(address _volunteer) external nonReentrant {
        require(electionActive, "No active election");
        require(block.timestamp < electionEndTime, "Election has ended");
        require(!hasVoted[msg.sender], "Already voted");
        
        // Verify volunteer exists and is approved
        VolunteerRegistry.Volunteer memory volunteer = volunteerRegistry.getVolunteerByAddress(_volunteer);
        require(volunteer.isActive && volunteer.isApproved, "Invalid or unapproved volunteer");
        
        // Calculate voting power
        uint256 votingPower = governanceToken.balanceOf(msg.sender);
        require(votingPower > 0, "No voting power");
        
        // Record vote
        votesReceived[_volunteer] += votingPower;
        voterChoices[msg.sender] = _volunteer;
        hasVoted[msg.sender] = true;
        totalVotesCast += votingPower;
        
        // Mark voter in volunteer registry
        volunteerRegistry.markAsVoted(msg.sender);
        
        emit VoteCast(msg.sender, _volunteer, votingPower);
    }
    
    /**
     * @dev Conclude the election
     */
    function concludeElection() external {
        require(electionActive, "No active election");
        require(block.timestamp >= electionEndTime || 
                totalVotesCast >= (governanceToken.totalSupply() * minimumQuorum) / 100,
                "Election not yet eligible for conclusion");
        require(!electionConcluded, "Election already concluded");
        
        electionActive = false;
        electionConcluded = true;
        
        // Find the winner
        address winningVolunteer = address(0);
        uint256 winningVoteCount = 0;
        
        for (uint256 i = 1; i <= volunteerRegistry.getVolunteerCount(); i++) {
            VolunteerRegistry.Volunteer memory volunteer = volunteerRegistry.getVolunteerById(i);
            address volunteerAddress = volunteer.walletAddress;
            
            if (volunteer.isActive && volunteer.isApproved && 
                votesReceived[volunteerAddress] > winningVoteCount) {
                winningVoteCount = votesReceived[volunteerAddress];
                winningVolunteer = volunteerAddress;
            }
        }
        
        // If there's a winner with votes
        if (winningVolunteer != address(0) && winningVoteCount > 0) {
            electionWinner = winningVolunteer;
            emit ElectionConcluded(winningVolunteer, winningVoteCount);
        } else {
            emit NoWinnerDeclared();
        }
    }
    
    /**
     * @dev Distribute funds to the winner
     */
    function distributeFunds() external nonReentrant {
        require(electionConcluded, "Election not concluded");
        require(!fundsDistributed, "Funds already distributed");
        require(electionWinner != address(0), "No winner to distribute to");
        
        uint256 totalFunds = usdcToken.balanceOf(address(this));
        require(totalFunds > 0, "No funds to distribute");
        
        // Transfer all USDC to the winner
        fundsDistributed = true;
        require(usdcToken.transfer(electionWinner, totalFunds), "Token transfer failed");
        
        emit FundsDistributed(electionWinner, totalFunds);
    }
    
    /**
     * @dev Update election parameters
     * @param _minimumQuorum New minimum quorum percentage
     * @param _electionDuration New default election duration
     */
    function updateElectionParameters(
        uint256 _minimumQuorum,
        uint256 _electionDuration
    ) external onlyRole(ADMIN_ROLE) {
        require(!electionActive, "Cannot change during active election");
        require(_minimumQuorum <= 100, "Quorum cannot exceed 100%");
        require(_electionDuration > 0, "Duration must be greater than 0");
        
        minimumQuorum = _minimumQuorum;
        electionDuration = _electionDuration;
    }
    
    /**
     * @dev Check if election has reached quorum
     * @return Whether the quorum has been reached
     */
    function hasReachedQuorum() public view returns (bool) {
        return totalVotesCast >= (governanceToken.totalSupply() * minimumQuorum) / 100;
    }
    
    /**
     * @dev Check if election has ended
     * @return Whether the election period has ended
     */
    function isElectionEnded() public view returns (bool) {
        return block.timestamp >= electionEndTime;
    }
    
    /**
     * @dev Get the tally of votes for a volunteer
     * @param _volunteer Address of the volunteer
     * @return Number of votes received
     */
    function getVotesFor(address _volunteer) external view returns (uint256) {
        return votesReceived[_volunteer];
    }
    
    /**
     * @dev Get the choice of a voter
     * @param _voter Address of the voter
     * @return Address of the chosen volunteer, or zero address if not voted
     */
    function getVoterChoice(address _voter) external view returns (address) {
        return voterChoices[_voter];
    }
    
    /**
     * @dev Get time remaining in the election
     * @return Seconds remaining, or 0 if ended
     */
    function getTimeRemaining() external view returns (uint256) {
        if (!electionActive || block.timestamp >= electionEndTime) {
            return 0;
        }
        return electionEndTime - block.timestamp;
    }
} 