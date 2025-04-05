// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title FlashDAOToken
 * @dev Governance token for FlashDAO with logarithmic minting mechanism
 */
contract FlashDAOToken is ERC20, AccessControl {
    using Math for uint256;
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Constants for token calculation
    uint256 public constant BASE_AMOUNT = 1000 * 10**18; // 1000 tokens base multiplier
    uint256 public constant SCALE_FACTOR = 100 * 10**6;  // 100 USDC scaling factor (6 decimals)
    
    // Natural log approximation constants for fixed-point math
    uint256 private constant LN_SCALING = 10**18;
    
    event TokensMinted(address indexed receiver, uint256 donationAmount, uint256 tokenAmount);
    
    /**
     * @dev Constructor
     */
    constructor() ERC20("FlashDAO Governance Token", "FDGT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }
    
    /**
     * @dev Mint tokens to a recipient
     * @param to Recipient address
     * @param donationAmount Amount of USDC donated
     */
    function mintFromDonation(address to, uint256 donationAmount) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(donationAmount > 0, "Donation amount must be greater than 0");
        
        // Calculate tokens using logarithmic decay
        uint256 tokenAmount = calculateTokenAmount(donationAmount);
        
        // Mint tokens
        _mint(to, tokenAmount);
        
        emit TokensMinted(to, donationAmount, tokenAmount);
        
        return tokenAmount;
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
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 