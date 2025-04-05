// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./EventDAO.sol";
import "./VolunteerRegistry.sol";
import "./FlashDAOToken.sol";

// @title MultiChainDAOFactory
// @dev Factory for deploying DAOs across multiple chains
contract MultiChainDAOFactory is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");
    
    struct ChainDeployment {
        address eventDAOAddress;
        address tokenAddress;
        address volunteerRegistryAddress;
        uint256 deployedAt;
        bool active;
    }
    
    // Map: eventId => chainId => deployment details
    mapping(bytes32 => mapping(uint256 => ChainDeployment)) public deployments;
    mapping(bytes32 => bool) private eventExists;
    bytes32[] public allEventIds;
    
    event DAODeployed(
        bytes32 indexed eventId,
        uint256 indexed chainId,
        address eventDAOAddress,
        address tokenAddress,
        address volunteerRegistryAddress
    );
    
    event DAODeactivated(bytes32 indexed eventId, uint256 indexed chainId);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(DEPLOYER_ROLE, msg.sender);
    }
    
    // @dev Deploy DAO on current chain with same eventId as on other chains
    function deployDAO(
        bytes32 eventId,
        address eventDAOAddress,
        address tokenAddress,
        address volunteerRegistryAddress
    ) external onlyRole(DEPLOYER_ROLE) {
        require(!deployments[eventId][block.chainid].active, "DAO already deployed on this chain");
        
        _recordDeployment(
            eventId,
            eventDAOAddress,
            tokenAddress,
            volunteerRegistryAddress
        );
    }
    
    // @dev Record deployment details
    function _recordDeployment(
        bytes32 eventId,
        address eventDAOAddress,
        address tokenAddress,
        address volunteerRegistryAddress
    ) internal {
        deployments[eventId][block.chainid] = ChainDeployment({
            eventDAOAddress: eventDAOAddress,
            tokenAddress: tokenAddress,
            volunteerRegistryAddress: volunteerRegistryAddress,
            deployedAt: block.timestamp,
            active: true
        });
        
        // Record eventId if this is first deployment of this event
        if (!eventExists[eventId]) {
            allEventIds.push(eventId);
            eventExists[eventId] = true;
        }
        
        emit DAODeployed(
            eventId,
            block.chainid,
            eventDAOAddress,
            tokenAddress,
            volunteerRegistryAddress
        );
    }
    
    // @dev Generate unique event ID that is consistent across chains
    function generateEventIdWithParams(
        string memory eventName,
        string memory eventDescription,
        uint256 creationTimestamp,
        address creator
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(eventName, eventDescription, creationTimestamp, creator));
    }
    
    // @dev Compatibility method for old code
    function generateEventId(
        string memory eventName,
        string memory eventDescription
    ) external view returns (bytes32) {
        return generateEventIdWithParams(eventName, eventDescription, block.timestamp, msg.sender);
    }
    
    // @dev Deactivate DAO on this chain
    function deactivateDAO(bytes32 eventId) external onlyRole(ADMIN_ROLE) {
        require(deployments[eventId][block.chainid].active, "DAO not active or doesn't exist");
        
        deployments[eventId][block.chainid].active = false;
        
        emit DAODeactivated(eventId, block.chainid);
    }
    
    // @dev Get deployment details for an event on a specific chain
    function getDeployment(bytes32 eventId, uint256 chainId) external view returns (ChainDeployment memory) {
        return deployments[eventId][chainId];
    }
    
    // @dev Get deployment details for an event on current chain
    function getCurrentChainDeployment(bytes32 eventId) external view returns (ChainDeployment memory) {
        return deployments[eventId][block.chainid];
    }
    
    // @dev Get all event IDs
    function getAllEventIds() external view returns (bytes32[] memory) {
        return allEventIds;
    }
    
    // @dev Get count of unique events
    function getEventCount() external view returns (uint256) {
        return allEventIds.length;
    }
    
    // @dev Get all active deployments on current chain
    function getActiveDeploymentsOnCurrentChain() external view returns (bytes32[] memory) {
        uint256 activeCount = 0;
        
        // Count active deployments
        for (uint256 i = 0; i < allEventIds.length; i++) {
            if (deployments[allEventIds[i]][block.chainid].active) {
                activeCount++;
            }
        }
        
        // Create array of active event IDs
        bytes32[] memory activeEvents = new bytes32[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allEventIds.length; i++) {
            bytes32 eventId = allEventIds[i];
            if (deployments[eventId][block.chainid].active) {
                activeEvents[index] = eventId;
                index++;
            }
        }
        
        return activeEvents;
    }
} 