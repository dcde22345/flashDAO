// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/ISelfProtocol.sol";

/**
 * @title MockSelfProtocol
 * @dev Mock implementation of the Self Protocol for testing
 */
contract MockSelfProtocol is ISelfProtocol {
    mapping(address => bool) public verifiedUsers;
    mapping(address => uint256) public verificationTimestamps;
    mapping(address => uint256) public tokenBalances;
    
    /**
     * @dev Verify a user's credentials for testing
     * @param volunteer Address of the volunteer
     * @param credentials Encoded credentials data (not used in mock)
     * @return Always returns true for testing
     */
    function verifyCredentials(address volunteer, bytes calldata credentials) external view override returns (bool) {
        // In mock version, always return true for testing
        return true;
    }
    
    /**
     * @dev Manually set a user as verified (for testing)
     * @param user Address to verify
     */
    function setVerified(address user) external {
        verifiedUsers[user] = true;
        verificationTimestamps[user] = block.timestamp;
    }
    
    /**
     * @dev Checks if an address has a verified identity
     * @param user Address to check
     * @return hasIdentity True if the address has a verified identity
     */
    function hasVerifiedIdentity(address user) external view override returns (bool) {
        return verifiedUsers[user];
    }
    
    /**
     * @dev Gets identity verification timestamp
     * @param user Address to check
     * @return timestamp Time when identity was verified, 0 if not verified
     */
    function getVerificationTimestamp(address user) external view override returns (uint256) {
        return verificationTimestamps[user];
    }
    
    /**
     * @dev Mints tokens to a user (mock function for testing)
     * @param user Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address user, uint256 amount) external {
        tokenBalances[user] += amount;
    }
    
    /**
     * @dev Gets token balance of a user
     * @param user Address to check
     * @return balance Token balance of the user
     */
    function balanceOf(address user) external view returns (uint256) {
        return tokenBalances[user];
    }
} 