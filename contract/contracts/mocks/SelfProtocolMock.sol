// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/ISelfProtocol.sol";

/**
 * @title SelfProtocolMock
 * @dev Mock implementation of Self Protocol for testing
 */
contract SelfProtocolMock is ISelfProtocol, Ownable {
    // User => isVerified
    mapping(address => bool) public verifiedUsers;
    
    // User => verification timestamp
    mapping(address => uint256) public verificationTimestamp;
    
    /**
     * @dev Constructor
     */
    constructor() Ownable() {
        transferOwnership(msg.sender);
    }
    
    /**
     * @dev Verify a user (only owner)
     * @param user Address to verify
     */
    function verifyUser(address user) external onlyOwner {
        verifiedUsers[user] = true;
        verificationTimestamp[user] = block.timestamp;
    }
    
    /**
     * @dev Revoke verification for a user (only owner)
     * @param user Address to revoke
     */
    function revokeVerification(address user) external onlyOwner {
        verifiedUsers[user] = false;
        verificationTimestamp[user] = 0;
    }
    
    /**
     * @dev Verify user credentials by checking if they are verified in our system
     * @param user The address to check credentials for
     * @return bool Whether the credentials are valid
     */
    function verifyCredentials(address user, bytes calldata /* credentials */) external view override returns (bool) {
        return verifiedUsers[user];
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
        return verificationTimestamp[user];
    }
} 