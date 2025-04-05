// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC20Mock
 * @dev Mock ERC20 token for testing purposes
 */
contract ERC20Mock is ERC20, Ownable {
    uint8 private _decimals;

    /**
     * @dev Constructor to create a mock ERC20 token
     * @param name Name of the token
     * @param symbol Symbol of the token
     * @param decimalsValue Number of decimals for the token
     */
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimalsValue
    ) ERC20(name, symbol) Ownable() {
        _decimals = decimalsValue;
        transferOwnership(msg.sender);
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Creates `amount` new tokens and assigns them to `account`.
     * @param account The address to receive the tokens
     * @param amount The amount of tokens to mint
     */
    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`.
     * @param account The address to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }
} 