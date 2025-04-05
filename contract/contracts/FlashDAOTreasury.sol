// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./FlashDAOToken.sol";
import "./VolunteerRegistry.sol";

/**
 * @title FlashDAOTreasury
 * @dev Treasury contract for FlashDAO that handles donations and fund distribution
 */
contract FlashDAOTreasury is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    
    // External contracts
    IERC20 public usdcToken;
    FlashDAOToken public governanceToken;
    VolunteerRegistry public volunteerRegistry;
    
    // Treasury state
    bool public fundsDistributed;
    uint256 public totalDonations;
    
    // Donation tracking
    mapping(address => uint256) public donations;
    address[] private donorList;
    mapping(address => bool) private isDonor;
    
    // Token calculation constants
    uint256 public constant BASE_AMOUNT = 1000 * 10**18; // 1000 tokens base
    uint256 public constant SCALE_FACTOR = 100 * 10**6;  // 100 USDC scaling
    
    // Events
    event DonationReceived(address indexed donor, uint256 amount, uint256 tokensMinted);
    event FundsDistributed(address recipient, uint256 amount);
    event RefundClaimed(address indexed donor, uint256 amount);
    
    /**
     * @dev Constructor
     * @param _usdcAddress Address of the USDC token
     * @param _governanceTokenAddress Address of the governance token
     * @param _volunteerRegistryAddress Address of the volunteer registry
     */
    constructor(
        address _usdcAddress,
        address _governanceTokenAddress,
        address _volunteerRegistryAddress
    ) {
        require(_usdcAddress != address(0), "Invalid USDC address");
        require(_governanceTokenAddress != address(0), "Invalid token address");
        require(_volunteerRegistryAddress != address(0), "Invalid registry address");
        
        usdcToken = IERC20(_usdcAddress);
        governanceToken = FlashDAOToken(_governanceTokenAddress);
        volunteerRegistry = VolunteerRegistry(_volunteerRegistryAddress);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Donate USDC and receive governance tokens
     * @param amount Amount of USDC to donate
     */
    function donate(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(!fundsDistributed, "Funds already distributed");
        
        // Transfer USDC from sender to this contract
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        
        // Calculate tokens based on logarithmic curve
        uint256 tokenAmount = calculateTokenAmount(amount);
        
        // Add donor to list if not already there
        if (!isDonor[msg.sender]) {
            donorList.push(msg.sender);
            isDonor[msg.sender] = true;
        }
        
        // Update donation tracking
        donations[msg.sender] += amount;
        totalDonations += amount;
        
        // Mint governance tokens to donor
        governanceToken.mint(msg.sender, tokenAmount);
        
        emit DonationReceived(msg.sender, amount, tokenAmount);
    }
    
    /**
     * @dev Distribute funds to a recipient (can only be called by governance)
     * @param recipient Address to send funds to
     */
    function distributeFunds(address recipient) external onlyRole(GOVERNANCE_ROLE) nonReentrant {
        require(!fundsDistributed, "Funds already distributed");
        require(totalDonations > 0, "No funds to distribute");
        require(recipient != address(0), "Invalid recipient address");
        require(volunteerRegistry.isApprovedVolunteer(recipient), "Recipient must be approved volunteer");
        
        uint256 balance = usdcToken.balanceOf(address(this));
        require(balance > 0, "Treasury is empty");
        
        fundsDistributed = true;
        
        // Transfer all USDC to the recipient
        require(usdcToken.transfer(recipient, balance), "USDC transfer failed");
        
        emit FundsDistributed(recipient, balance);
    }
    
    /**
     * @dev Allow donor to claim refund if no funds have been distributed yet
     */
    function claimRefund() external nonReentrant {
        require(!fundsDistributed, "Funds already distributed");
        require(isDonor[msg.sender], "Not a donor");
        
        uint256 donationAmount = donations[msg.sender];
        require(donationAmount > 0, "No donation to refund");
        
        // Update state before transfer
        donations[msg.sender] = 0;
        totalDonations -= donationAmount;
        
        // Transfer USDC back to donor
        require(usdcToken.transfer(msg.sender, donationAmount), "USDC transfer failed");
        
        emit RefundClaimed(msg.sender, donationAmount);
    }
    
    /**
     * @dev Grant GOVERNANCE_ROLE to an address (can only be called by admin)
     * @param governanceAddress Address to grant the role to
     */
    function setGovernance(address governanceAddress) external onlyRole(ADMIN_ROLE) {
        require(governanceAddress != address(0), "Invalid governance address");
        _grantRole(GOVERNANCE_ROLE, governanceAddress);
    }
    
    /**
     * @dev Calculate token amount using logarithmic curve
     * @param donationAmount Amount of USDC donated (6 decimals)
     * @return Token amount (18 decimals)
     */
    function calculateTokenAmount(uint256 donationAmount) public pure returns (uint256) {
        // Simple linear calculation for this implementation
        // In a real implementation, this would use a logarithmic curve
        return donationAmount * 10 * 10**12; // 10 tokens per USDC, scaled from 6 to 18 decimals
    }
    
    /**
     * @dev Get the total number of donors
     * @return Number of donors
     */
    function getDonorCount() external view returns (uint256) {
        return donorList.length;
    }
    
    /**
     * @dev Get donor address by index
     * @param index Index in the donor list
     * @return Donor address
     */
    function getDonorByIndex(uint256 index) external view returns (address) {
        require(index < donorList.length, "Index out of bounds");
        return donorList[index];
    }
} 