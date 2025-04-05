// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./interfaces/ISelfProtocol.sol";

/**
 * @title EventDAO
 * @dev A single-event DAO with fixed lifecycle, direct token minting, and fund distribution
 */
contract EventDAO is AccessControl, ReentrancyGuard {
    using Math for uint256;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Event information
    string public eventName;
    string public eventDescription;
    uint256 public expiresAt;
    bool public fundsDistributed;
    
    // External contracts
    IERC20 public usdcToken;
    ISelfProtocol public selfProtocol;
    
    // Constants for token calculation
    uint256 public constant BASE_AMOUNT = 1000 * 10**18; // 1000 tokens base multiplier
    uint256 public constant SCALE_FACTOR = 100 * 10**6;  // 100 USDC scaling factor (6 decimals)
    uint256 private constant LN_SCALING = 10**18;
    
    // Volunteer management
    struct Volunteer {
        address volunteerAddress;
        string name;
        string description;
        bool approved;
    }
    
    Volunteer[] public volunteers;
    mapping(address => bool) public isVolunteer;
    mapping(address => uint256) public volunteerIndex;
    
    // Voting and donation tracking
    mapping(address => uint256) public donations;
    address[] private donorList;
    mapping(address => bool) private isDonor;
    
    mapping(address => uint256) public votingPower;
    mapping(address => bool) public hasVoted;
    mapping(uint256 => uint256) public volunteerVotes;
    uint256 public winningVolunteerIndex;
    bool public electionConcluded;
    bool public noWinner;
    mapping(address => bool) public refunded;
    uint256 public totalDonationsAmount;
    
    // Governance token (internal tracking only)
    string public tokenName;
    string public tokenSymbol;
    mapping(address => uint256) public balanceOf;
    uint256 public totalSupply;
    
    // Events
    event DonationReceived(address indexed donor, uint256 amount, uint256 tokensMinted);
    event VolunteerRegistered(address indexed volunteer, string name);
    event VolunteerApproved(address indexed volunteer, uint256 volunteerIndex);
    event VoteCast(address indexed voter, uint256 indexed volunteerIndex, uint256 votes);
    event ElectionConcluded(uint256 winningVolunteerIndex, address winner, uint256 voteCount);
    event FundsDistributed(address recipient, uint256 amount);
    event RefundClaimed(address indexed donor, uint256 amount);
    
    /**
     * @dev Constructor
     * @param _eventName Name of the event
     * @param _eventDescription Description of the event
     * @param _usdcToken Address of the USDC token
     * @param _selfProtocolAddress Address of Self Protocol for volunteer verification
     * @param _expiresAt Timestamp when the DAO expires
     * @param _admin Address of the DAO admin
     */
    constructor(
        string memory _eventName,
        string memory _eventDescription,
        address _usdcToken,
        address _selfProtocolAddress,
        uint256 _expiresAt,
        address _admin
    ) {
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_expiresAt > block.timestamp, "Expiration must be in the future");
        
        eventName = _eventName;
        eventDescription = _eventDescription;
        expiresAt = _expiresAt;
        usdcToken = IERC20(_usdcToken);
        selfProtocol = ISelfProtocol(_selfProtocolAddress);
        
        tokenName = string(abi.encodePacked("FlashDAO ", _eventName, " Token"));
        tokenSymbol = "FDAO";
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
    }
    
    /**
     * @dev Donate USDC and immediately receive governance tokens
     * @param amount Amount of USDC to donate
     */
    function donate(uint256 amount) external nonReentrant {
        require(block.timestamp < expiresAt, "DAO has expired");
        require(!isVolunteer[msg.sender], "Volunteers cannot donate");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer USDC from sender to this contract
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        
        // Calculate tokens based on logarithmic curve
        uint256 tokenAmount = calculateTokenAmount(amount);
        
        // Add donor to list if not already there
        if (!isDonor[msg.sender]) {
            donorList.push(msg.sender);
            isDonor[msg.sender] = true;
        }
        
        // Update donation and token tracking
        donations[msg.sender] += amount;
        totalDonationsAmount += amount;
        balanceOf[msg.sender] += tokenAmount;
        totalSupply += tokenAmount;
        votingPower[msg.sender] += tokenAmount;
        
        emit DonationReceived(msg.sender, amount, tokenAmount);
    }
    
    /**
     * @dev Register as a volunteer
     * @param name Volunteer name
     * @param description Volunteer description
     * @param credentials Credentials from Self Protocol
     */
    function registerAsVolunteer(
        string calldata name,
        string calldata description,
        bytes calldata credentials
    ) external nonReentrant {
        require(block.timestamp < expiresAt, "DAO has expired");
        require(!isVolunteer[msg.sender], "Already registered as volunteer");
        require(!hasVoted[msg.sender], "Voters cannot be volunteers");
        require(bytes(name).length > 0, "Name cannot be empty");
        
        // Verify credentials with Self Protocol
        require(selfProtocol.verifyCredentials(msg.sender, credentials), "Invalid credentials");
        
        // Add to volunteers array
        volunteers.push(Volunteer({
            volunteerAddress: msg.sender,
            name: name,
            description: description,
            approved: false
        }));
        
        // Update tracking
        isVolunteer[msg.sender] = true;
        volunteerIndex[msg.sender] = volunteers.length - 1;
        
        emit VolunteerRegistered(msg.sender, name);
    }
    
    /**
     * @dev Admin approves a volunteer
     * @param _volunteerIndex Index of the volunteer
     */
    function approveVolunteer(uint256 _volunteerIndex) external onlyRole(ADMIN_ROLE) {
        require(_volunteerIndex < volunteers.length, "Invalid volunteer index");
        require(!volunteers[_volunteerIndex].approved, "Volunteer already approved");
        
        volunteers[_volunteerIndex].approved = true;
        
        emit VolunteerApproved(volunteers[_volunteerIndex].volunteerAddress, _volunteerIndex);
    }
    
    /**
     * @dev Cast vote for a volunteer
     * @param _volunteerIndex Index of the volunteer to vote for
     */
    function vote(uint256 _volunteerIndex) external nonReentrant {
        require(block.timestamp < expiresAt, "DAO has expired");
        require(!electionConcluded, "Election already concluded");
        require(_volunteerIndex < volunteers.length, "Invalid volunteer index");
        require(volunteers[_volunteerIndex].approved, "Volunteer not approved");
        require(votingPower[msg.sender] > 0, "No voting power");
        require(!hasVoted[msg.sender], "Already voted");
        require(!isVolunteer[msg.sender], "Volunteers cannot vote");
        
        // Record vote
        uint256 votes = votingPower[msg.sender];
        volunteerVotes[_volunteerIndex] += votes;
        hasVoted[msg.sender] = true;
        
        emit VoteCast(msg.sender, _volunteerIndex, votes);
    }
    
    /**
     * @dev Conclude the election (callable by anyone after expiration)
     */
    function concludeElection() external nonReentrant {
        require(block.timestamp >= expiresAt, "DAO not yet expired");
        require(!electionConcluded, "Election already concluded");
        
        // Find volunteer with most votes
        uint256 maxVotes = 0;
        bool hasWinner = false;
        
        for (uint256 i = 0; i < volunteers.length; i++) {
            if (volunteers[i].approved && volunteerVotes[i] > maxVotes) {
                maxVotes = volunteerVotes[i];
                winningVolunteerIndex = i;
                hasWinner = true;
            }
        }
        
        electionConcluded = true;
        
        if (hasWinner && maxVotes > 0) {
            address winner = volunteers[winningVolunteerIndex].volunteerAddress;
            emit ElectionConcluded(winningVolunteerIndex, winner, maxVotes);
        } else {
            noWinner = true;
            emit ElectionConcluded(0, address(0), 0);
        }
    }
    
    /**
     * @dev Distribute funds to winning volunteer (anyone can call after election concluded)
     */
    function distributeFunds() external nonReentrant {
        require(electionConcluded, "Election not concluded");
        require(!fundsDistributed, "Funds already distributed");
        require(!noWinner, "No winner elected");
        require(block.timestamp >= expiresAt, "DAO not yet expired");
        
        address winner = volunteers[winningVolunteerIndex].volunteerAddress;
        
        if (winner != address(0) && volunteerVotes[winningVolunteerIndex] > 0) {
            // Transfer all USDC to the winner
            uint256 balance = usdcToken.balanceOf(address(this));
            require(usdcToken.transfer(winner, balance), "USDC transfer failed");
            
            fundsDistributed = true;
            
            emit FundsDistributed(winner, balance);
        }
    }
    
    /**
     * @dev Claim refund if no winner was elected (individual donors must call)
     */
    function claimRefund() external nonReentrant {
        require(electionConcluded, "Election not concluded");
        require(!fundsDistributed, "Funds already distributed");
        require(noWinner, "There is a winner");
        require(block.timestamp >= expiresAt, "DAO not yet expired");
        require(donations[msg.sender] > 0, "No donations to refund");
        require(!refunded[msg.sender], "Already refunded");
        
        // Calculate refund amount proportional to donation
        uint256 donationAmount = donations[msg.sender];
        uint256 totalBalance = usdcToken.balanceOf(address(this));
        uint256 refundAmount = (donationAmount * totalBalance) / totalDonationsAmount;
        
        // Mark as refunded
        refunded[msg.sender] = true;
        
        // Transfer USDC back to donor
        require(usdcToken.transfer(msg.sender, refundAmount), "USDC transfer failed");
        
        emit RefundClaimed(msg.sender, refundAmount);
    }
    
    /**
     * @dev Calculate token amount using logarithmic curve
     * @param donationAmount Amount of USDC donated (6 decimals)
     * @return Token amount (18 decimals)
     */
    function calculateTokenAmount(uint256 donationAmount) public pure returns (uint256) {
        // Scale to handle USDC's 6 decimals vs ERC20 18 decimals
        uint256 scaledAmount = donationAmount * 10**12; // Scale to 18 decimals
        
        // Ensure we don't overflow when scaling
        if (scaledAmount < donationAmount) {
            // If overflow, cap at maximum value
            return BASE_AMOUNT;
        }
        
        // Calculate (donation / SCALE_FACTOR) with protection against division by zero
        uint256 x;
        if (SCALE_FACTOR > 0) {
            x = (scaledAmount * LN_SCALING) / SCALE_FACTOR;
        } else {
            return 0;
        }
        
        // If x is very small, return linear approximation
        if (x < LN_SCALING / 100) {
            return (BASE_AMOUNT * x) / LN_SCALING;
        }
        
        // Otherwise, use logarithmic formula with unchecked math for Taylor series
        // ln(1+x) approximation using Taylor series
        uint256 lnResult;
        
        unchecked {
            uint256 term1 = x;
            
            // Avoid overflow in term calculations
            if (x <= LN_SCALING) { // Only calculate if x is reasonable
                uint256 xSquared = (x * x) / LN_SCALING;
                uint256 term2 = xSquared / 2;
                
                if (term1 > term2) {
                    lnResult = term1 - term2;
                    
                    // Only calculate term3 if xSquared is not too large
                    if (xSquared <= LN_SCALING) {
                        uint256 term3 = (xSquared * x) / (3 * LN_SCALING);
                        if (term3 < LN_SCALING) {
                            lnResult += term3;
                        }
                    }
                }
            } else {
                // For very large x, return maximum value
                return BASE_AMOUNT;
            }
        }
        
        return (BASE_AMOUNT * lnResult) / LN_SCALING;
    }
    
    /**
     * @dev Get the total donations received
     * @return Total USDC donated
     */
    function getTotalDonations() public view returns (uint256) {
        return totalDonationsAmount;
    }
    
    /**
     * @dev Get all donors
     * @return Array of donor addresses
     */
    function getDonors() public view returns (address[] memory) {
        return donorList;
    }
    
    /**
     * @dev Get the number of donors
     * @return Number of donors
     */
    function getDonorCount() external view returns (uint256) {
        return donorList.length;
    }
    
    /**
     * @dev Get the number of volunteers
     * @return Number of volunteers
     */
    function getVolunteerCount() external view returns (uint256) {
        return volunteers.length;
    }
    
    /**
     * @dev Get volunteer information by index
     * @param index The index of the volunteer to retrieve
     * @return volunteer Volunteer address, name, description, approval status, and votes
     */
    function getVolunteer(uint256 index) external view returns (address, string memory, string memory, bool, uint256) {
        require(index < volunteers.length, "Invalid volunteer index");
        
        Volunteer storage v = volunteers[index];
        return (
            v.volunteerAddress,
            v.name,
            v.description,
            v.approved,
            volunteerVotes[index]
        );
    }
    
    /**
     * @dev Check if the DAO has expired
     * @return True if expired
     */
    function isExpired() external view returns (bool) {
        return block.timestamp >= expiresAt;
    }
    
    /**
     * @dev Check if the DAO is in refund mode (no winner elected)
     * @return True if in refund mode
     */
    function isInRefundMode() external view returns (bool) {
        return electionConcluded && noWinner;
    }
} 