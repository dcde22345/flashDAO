// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./FlashDAOToken.sol";
import "./FlashDAOTreasury.sol";
import "./FlashDAOGovernance.sol";
import "./VolunteerRegistry.sol";

/**
 * @title MultiChainDAOFactory
 * @dev Factory contract to deploy new FlashDAO instances across multiple chains
 */
contract MultiChainDAOFactory is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    struct DAOInfo {
        string name;
        address tokenAddress;
        address treasuryAddress;
        address governanceAddress;
        address volunteerRegistryAddress;
        uint256 creationTime;
        uint256 chainId;
        bool active;
    }
    
    // DAO ID to DAOInfo mapping
    mapping(bytes32 => DAOInfo) public daos;
    
    // Array of DAO IDs for enumeration
    bytes32[] public daoIds;
    
    // Events
    event DAOCreated(
        bytes32 indexed daoId,
        string name,
        address tokenAddress,
        address treasuryAddress,
        address governanceAddress,
        address volunteerRegistryAddress,
        uint256 chainId
    );
    event DAODeactivated(bytes32 indexed daoId);
    
    /**
     * @dev Constructor
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Create a new FlashDAO instance
     * @param _name Name of the DAO
     * @param _usdcAddress Address of the USDC token on the current chain
     * @param _selfProtocolAddress Address of the Self Protocol on the current chain
     * @return daoId Unique identifier for the created DAO
     */
    function createNewDAO(
        string memory _name,
        address _usdcAddress,
        address _selfProtocolAddress
    ) external onlyRole(ADMIN_ROLE) returns (bytes32 daoId) {
        // Deploy token contract
        FlashDAOToken token = new FlashDAOToken();
        
        // Deploy volunteer registry
        VolunteerRegistry volunteerRegistry = new VolunteerRegistry(_selfProtocolAddress);
        
        // Deploy treasury with all three required parameters
        FlashDAOTreasury treasury = new FlashDAOTreasury(
            _usdcAddress,           // USDC 地址
            address(token),         // 治理代幣地址
            address(volunteerRegistry)  // 志願者註冊表地址
        );
        
        // Deploy governance
        FlashDAOGovernance governance = new FlashDAOGovernance(
            address(token),
            _usdcAddress,
            address(volunteerRegistry),
            _selfProtocolAddress,
            msg.sender
        );
        
        // Grant MINTER_ROLE to treasury
        token.grantRole(keccak256("MINTER_ROLE"), address(treasury));
        
        // Generate unique DAO ID
        daoId = keccak256(abi.encodePacked(_name, block.timestamp, block.chainid));
        
        // Store DAO information
        daos[daoId] = DAOInfo({
            name: _name,
            tokenAddress: address(token),
            treasuryAddress: address(treasury),
            governanceAddress: address(governance),
            volunteerRegistryAddress: address(volunteerRegistry),
            creationTime: block.timestamp,
            chainId: block.chainid,
            active: true
        });
        
        // Add to ID array for enumeration
        daoIds.push(daoId);
        
        emit DAOCreated(
            daoId,
            _name,
            address(token),
            address(treasury),
            address(governance),
            address(volunteerRegistry),
            block.chainid
        );
        
        return daoId;
    }
    
    /**
     * @dev Deactivate a DAO
     * @param daoId ID of the DAO to deactivate
     */
    function deactivateDAO(bytes32 daoId) external onlyRole(ADMIN_ROLE) {
        require(daos[daoId].active, "DAO already inactive or doesn't exist");
        
        daos[daoId].active = false;
        
        emit DAODeactivated(daoId);
    }
    
    /**
     * @dev Get DAO information
     * @param daoId ID of the DAO
     * @return DAOInfo struct containing DAO details
     */
    function getDAOInfo(bytes32 daoId) external view returns (DAOInfo memory) {
        return daos[daoId];
    }
    
    /**
     * @dev Get the total number of DAOs
     * @return Number of DAOs created
     */
    function getDAOCount() external view returns (uint256) {
        return daoIds.length;
    }
    
    /**
     * @dev Get all active DAOs
     * @return Array of active DAO IDs
     */
    function getActiveDAOs() external view returns (bytes32[] memory) {
        uint256 activeCount = 0;
        
        // Count active DAOs
        for (uint256 i = 0; i < daoIds.length; i++) {
            if (daos[daoIds[i]].active) {
                activeCount++;
            }
        }
        
        // Create array of active DAO IDs
        bytes32[] memory activeDAOs = new bytes32[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < daoIds.length; i++) {
            if (daos[daoIds[i]].active) {
                activeDAOs[currentIndex] = daoIds[i];
                currentIndex++;
            }
        }
        
        return activeDAOs;
    }
    
    /**
     * @dev Get DAO ID by index
     * @param index Index in the daoIds array
     * @return DAO ID at the specified index
     */
    function getDAOIdByIndex(uint256 index) external view returns (bytes32) {
        require(index < daoIds.length, "Index out of bounds");
        return daoIds[index];
    }
} 