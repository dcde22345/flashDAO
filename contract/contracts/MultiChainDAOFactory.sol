// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./EventDAO.sol";
import "./VolunteerRegistry.sol";
import "./FlashDAOToken.sol";

/**
 * @title MultiChainDAOFactory
 * @dev Factory contract to deploy identical DAOs across multiple chains for cross-chain governance
 */
contract MultiChainDAOFactory is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");
    
    struct ChainDeployment {
        address eventDAOAddress;
        address tokenAddress;
        address volunteerRegistryAddress;
        uint256 deploymentTime;
        bool active;
    }
    
    // Map: eventId => chainId => deployment details
    mapping(bytes32 => mapping(uint256 => ChainDeployment)) public deployments;
    
    // All unique event IDs deployed across any chain
    bytes32[] public allEventIds;
    
    // Track which event IDs exist
    mapping(bytes32 => bool) public eventExists;
    
    // Events
    event DAODeployed(
        bytes32 indexed eventId, 
        uint256 indexed chainId,
        string eventName,
        address eventDAOAddress, 
        address tokenAddress, 
        address volunteerRegistryAddress
    );
    
    event DAODeactivated(bytes32 indexed eventId, uint256 indexed chainId);
    
    /**
     * @dev Constructor
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(DEPLOYER_ROLE, msg.sender);
    }
    
    /**
     * @dev Deploy an identical DAO on the current chain
     * @param eventId Unique identifier for the event (same across chains)
     * @param eventName Name of the event
     * @param eventDescription Description of the event
     * @param usdcAddress Address of USDC on this chain
     * @param selfProtocolAddress Address of Self Protocol on this chain
     * @param duration Duration of the event in seconds
     * @return eventDAOAddress Address of the deployed EventDAO
     * @return tokenAddress Address of the deployed FlashDAOToken
     * @return volunteerRegistryAddress Address of the deployed VolunteerRegistry
     */
    function deployDAO(
        bytes32 eventId,
        string memory eventName,
        string memory eventDescription,
        address usdcAddress,
        address selfProtocolAddress,
        uint256 duration
    ) external onlyRole(DEPLOYER_ROLE) returns (
        address eventDAOAddress,
        address tokenAddress,
        address volunteerRegistryAddress
    ) {
        require(usdcAddress != address(0), "Invalid USDC address");
        require(!deployments[eventId][block.chainid].active, "DAO already deployed on this chain");
        
        // Calculate expiration time
        uint256 expiresAt = block.timestamp + duration;
        
        // Deploy FlashDAOToken
        FlashDAOToken token = new FlashDAOToken();
        tokenAddress = address(token);
        
        // Deploy VolunteerRegistry
        VolunteerRegistry volunteerRegistry = new VolunteerRegistry(selfProtocolAddress);
        volunteerRegistryAddress = address(volunteerRegistry);
        
        // Deploy EventDAO
        EventDAO eventDAO = new EventDAO(
            eventName,
            eventDescription,
            usdcAddress,
            selfProtocolAddress,
            expiresAt,
            msg.sender
        );
        eventDAOAddress = address(eventDAO);
        
        // Store deployment information
        deployments[eventId][block.chainid] = ChainDeployment({
            eventDAOAddress: eventDAOAddress,
            tokenAddress: tokenAddress,
            volunteerRegistryAddress: volunteerRegistryAddress,
            deploymentTime: block.timestamp,
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
            eventName,
            eventDAOAddress,
            tokenAddress,
            volunteerRegistryAddress
        );
        
        return (eventDAOAddress, tokenAddress, volunteerRegistryAddress);
    }
    
    /**
     * @dev Generate a unique event ID based on name, description and timestamp
     * @param eventName Name of the event
     * @param eventDescription Description of the event
     * @return eventId Unique identifier
     */
    function generateEventId(
        string memory eventName,
        string memory eventDescription
    ) external view returns (bytes32) {
        return keccak256(abi.encodePacked(eventName, eventDescription, block.timestamp, msg.sender));
    }
    
    /**
     * @dev Deactivate a DAO on this chain
     * @param eventId ID of the event
     */
    function deactivateDAO(bytes32 eventId) external onlyRole(ADMIN_ROLE) {
        require(deployments[eventId][block.chainid].active, "DAO not active or doesn't exist");
        
        deployments[eventId][block.chainid].active = false;
        
        emit DAODeactivated(eventId, block.chainid);
    }
    
    /**
     * @dev Get deployment details for an event on a specific chain
     * @param eventId ID of the event
     * @param chainId Chain ID
     * @return Deployment details
     */
    function getDeployment(bytes32 eventId, uint256 chainId) external view returns (ChainDeployment memory) {
        return deployments[eventId][chainId];
    }
    
    /**
     * @dev Get deployment details for an event on current chain
     * @param eventId ID of the event
     * @return Deployment details
     */
    function getCurrentChainDeployment(bytes32 eventId) external view returns (ChainDeployment memory) {
        return deployments[eventId][block.chainid];
    }
    
    /**
     * @dev Get all event IDs
     * @return Array of all event IDs
     */
    function getAllEventIds() external view returns (bytes32[] memory) {
        return allEventIds;
    }
    
    /**
     * @dev Get count of unique events
     * @return Number of unique events
     */
    function getEventCount() external view returns (uint256) {
        return allEventIds.length;
    }
    
    /**
     * @dev Get all active deployments on current chain
     * @return eventIds Array of active event IDs on this chain
     */
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