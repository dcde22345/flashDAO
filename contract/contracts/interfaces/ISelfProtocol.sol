// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ISelfProtocol
 * @dev Self Protocol接口，用於志願者身份驗證
 */
interface ISelfProtocol {
    /**
     * @dev 驗證用戶憑證
     * @param user 用戶地址
     * @param credentials 憑證數據
     * @return 是否驗證通過
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