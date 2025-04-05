// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @dev 用於測試的USDC代幣模擬合約
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private constant _decimals = 6;

    constructor() ERC20("USD Coin", "USDC") Ownable(msg.sender) {
        // 鑄造1,000,000 USDC到部署者地址
        _mint(msg.sender, 1_000_000 * 10**_decimals);
    }

    /**
     * @dev 返回代幣小數位數
     */
    function decimals() public pure override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev 鑄造新代幣
     * @param to 代幣接收地址
     * @param amount 鑄造數量
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Function to burn tokens
     * @param amount The amount of tokens to burn
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
} 