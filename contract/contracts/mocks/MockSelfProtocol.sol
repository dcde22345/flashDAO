// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/ISelfProtocol.sol";

/**
 * @title MockSelfProtocol
 * @dev 用於測試的Self Protocol模擬合約
 */
contract MockSelfProtocol is Ownable, ISelfProtocol {
    mapping(address => bool) public verifiedUsers;
    mapping(address => uint256) public verificationTimestamps;
    mapping(address => uint256) public tokenBalances;
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev 驗證用戶憑證
     * @param user 用戶地址
     * @param credentials 憑證數據 (在模擬合約中不使用)
     * @return 驗證是否通過
     */
    function verifyCredentials(address user, bytes calldata credentials) external view override returns (bool) {
        // 在模擬環境中，僅檢查用戶是否已驗證
        return verifiedUsers[user];
    }
    
    /**
     * @dev 設置用戶驗證狀態
     * @param user 用戶地址
     * @param isVerified 驗證狀態
     */
    function setUserVerified(address user, bool isVerified) external onlyOwner {
        verifiedUsers[user] = isVerified;
        if (isVerified) {
            verificationTimestamps[user] = block.timestamp;
        } else {
            verificationTimestamps[user] = 0;
        }
    }
    
    /**
     * @dev 批量設置用戶驗證狀態
     * @param users 用戶地址數組
     * @param isVerified 驗證狀態
     */
    function batchSetUserVerified(address[] calldata users, bool isVerified) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            verifiedUsers[users[i]] = isVerified;
            if (isVerified) {
                verificationTimestamps[users[i]] = block.timestamp;
            } else {
                verificationTimestamps[users[i]] = 0;
            }
        }
    }
    
    /**
     * @dev Checks if an address has a verified identity
     * @param user Address to check
     * @return True if the address has a verified identity
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