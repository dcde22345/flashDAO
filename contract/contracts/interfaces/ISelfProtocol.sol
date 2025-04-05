// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ISelfProtocol
 * @dev Interface for the Self Protocol integration for volunteer verification
 */
interface ISelfProtocol {
    /**
     * @dev Verifies the credentials of a volunteer
     * @param volunteer Address of the volunteer
     * @param credentials Encoded credentials data
     * @return valid Whether the credentials are valid
     */
    function verifyCredentials(address volunteer, bytes calldata credentials) external view returns (bool);
    
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