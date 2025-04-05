// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC token for testing
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private _decimals = 6; // USDC has 6 decimals
    
    /**
     * @dev Constructor
     */
    constructor() ERC20("USD Coin", "USDC") Ownable(msg.sender) {}
    
    /**
     * @dev Mint tokens to an address
     * @param to Address to mint tokens to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Override decimals function
     */
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
} 