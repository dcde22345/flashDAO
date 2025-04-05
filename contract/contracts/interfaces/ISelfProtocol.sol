// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ISelfProtocol
 * @dev Interface for the Self Protocol identity verification system
 */
interface ISelfProtocol {
    /**
     * @dev Verifies credentials provided by a user
     * @param user Address of the user
     * @param credentials Raw credentials data
     * @return verified True if credentials are valid
     */
    function verifyCredentials(address user, bytes calldata credentials) external view returns (bool);
    
    /**
     * @dev Checks if an address has a verified identity
     * @param user Address to check
     * @return hasIdentity True if the address has a verified identity
     */
    function hasVerifiedIdentity(address user) external view returns (bool);
    
    /**
     * @dev Gets identity verification timestamp
     * @param user Address to check
     * @return timestamp Time when identity was verified, 0 if not verified
     */
    function getVerificationTimestamp(address user) external view returns (uint256);
} 