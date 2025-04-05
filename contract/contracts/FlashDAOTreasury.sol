// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./FlashDAOToken.sol";
import "./VolunteerRegistry.sol";

/**
 * @title FlashDAOTreasury
 * @dev Treasury contract for FlashDAO with donation and refund mechanisms
 */
contract FlashDAOTreasury is AccessControl, ReentrancyGuard {
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // External contracts
    IERC20 public usdcToken;
    FlashDAOToken public governanceToken;
    VolunteerRegistry public volunteerRegistry;
    
    // Donation window
    uint256 public constant REFUND_WINDOW = 7 days;
    
    struct Donation {
        uint256 amount;
        uint256 timestamp;
        bool confirmed;
        bool refunded;
    }
    
    // Donor => donationId => Donation
    mapping(address => mapping(uint256 => Donation)) public donations;
    mapping(address => uint256) public donationCount;
    
    // Events
    event DonationReceived(address indexed donor, uint256 indexed donationId, uint256 amount);
    event DonationConfirmed(address indexed donor, uint256 indexed donationId, uint256 tokensMinted);
    event DonationRefunded(address indexed donor, uint256 indexed donationId, uint256 amount);
    event FundsTransferred(address indexed recipient, uint256 amount);
    
    /**
     * @dev Constructor
     * @param _usdcToken Address of the USDC token
     * @param _governanceToken Address of the governance token
     * @param _volunteerRegistry Address of the volunteer registry
     */
    constructor(
        address _usdcToken,
        address _governanceToken,
        address _volunteerRegistry
    ) {
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_governanceToken != address(0), "Invalid governance token address");
        require(_volunteerRegistry != address(0), "Invalid volunteer registry address");
        
        usdcToken = IERC20(_usdcToken);
        governanceToken = FlashDAOToken(_governanceToken);
        volunteerRegistry = VolunteerRegistry(_volunteerRegistry);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Allow users to donate USDC
     * @param amount Amount of USDC to donate
     */
    function donate(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer USDC to this contract
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        
        // Create donation record
        uint256 id = donationCount[msg.sender]++;
        donations[msg.sender][id] = Donation({
            amount: amount,
            timestamp: block.timestamp,
            confirmed: false,
            refunded: false
        });
        
        emit DonationReceived(msg.sender, id, amount);
    }
    
    /**
     * @dev Admin confirms donation and mints governance tokens
     * @param donor Address of the donor
     * @param donationId ID of the donation
     */
    function confirmDonation(address donor, uint256 donationId) external onlyRole(ADMIN_ROLE) nonReentrant {
        Donation storage donation = donations[donor][donationId];
        require(!donation.confirmed, "Donation already confirmed");
        require(!donation.refunded, "Donation already refunded");
        
        donation.confirmed = true;
        
        // Mint governance tokens (even for volunteers, though they can't use them)
        uint256 tokenAmount = governanceToken.mintFromDonation(donor, donation.amount);
        
        emit DonationConfirmed(donor, donationId, tokenAmount);
    }
    
    /**
     * @dev Allow donors to refund unconfirmed donations after refund window
     * @param donationId ID of the donation to refund
     */
    function refundDonation(uint256 donationId) external nonReentrant {
        Donation storage donation = donations[msg.sender][donationId];
        require(!donation.confirmed, "Donation already confirmed");
        require(!donation.refunded, "Already refunded");
        require(block.timestamp > donation.timestamp + REFUND_WINDOW, "Refund window not passed");
        
        uint256 amount = donation.amount;
        donation.refunded = true;
        
        require(usdcToken.transfer(msg.sender, amount), "USDC transfer failed");
        
        emit DonationRefunded(msg.sender, donationId, amount);
    }
    
    /**
     * @dev Execute fund transfer to a recipient (called by governance)
     * @param recipient Address to receive funds
     * @param amount Amount to transfer
     */
    function executeTransfer(address recipient, uint256 amount) external onlyRole(GOVERNANCE_ROLE) nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= usdcToken.balanceOf(address(this)), "Insufficient balance");
        
        require(usdcToken.transfer(recipient, amount), "Transfer failed");
        
        emit FundsTransferred(recipient, amount);
    }
    
    /**
     * @dev Get pledge amount for a specific donor
     * @param donor Address of the donor
     * @param donationId ID of the donation
     */
    function getDonation(address donor, uint256 donationId) external view returns (
        uint256 amount,
        uint256 timestamp,
        bool confirmed,
        bool refunded
    ) {
        Donation storage donation = donations[donor][donationId];
        return (
            donation.amount,
            donation.timestamp,
            donation.confirmed,
            donation.refunded
        );
    }
    
    /**
     * @dev Get USDC balance of treasury
     */
    function getBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }
} 