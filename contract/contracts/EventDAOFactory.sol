// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./EventDAO.sol";

/**
 * @title EventDAOFactory
 * @dev Factory contract for creating event-specific DAOs with fixed lifecycles
 */
contract EventDAOFactory is AccessControl {
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");
    
    struct EventDAOInfo {
        address daoAddress;
        string eventName;
        string eventDescription;
        uint256 createdAt;
        uint256 expiresAt;
        bool exists;
    }
    
    // Mapping from event ID to DAO information
    mapping(bytes32 => EventDAOInfo) public eventDAOs;
    
    // Array to keep track of all events
    bytes32[] public allEventIds;
    
    // Address of USDC token
    address public usdcToken;
    
    // Address of Self Protocol for volunteer verification
    address public selfProtocolAddress;
    
    // Default DAO lifetime (7 days)
    uint256 public constant DEFAULT_DAO_LIFETIME = 7 days;
    
    // Events
    event EventDAOCreated(
        bytes32 indexed eventId,
        string eventName,
        address daoAddress,
        uint256 expiresAt
    );
    
    /**
     * @dev Constructor
     * @param _usdcToken Address of the USDC token
     * @param _selfProtocolAddress Address of Self Protocol for volunteer verification
     */
    constructor(address _usdcToken, address _selfProtocolAddress) {
        require(_usdcToken != address(0), "Invalid USDC address");
        
        usdcToken = _usdcToken;
        selfProtocolAddress = _selfProtocolAddress;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CREATOR_ROLE, msg.sender);
    }
    
    /**
     * @dev Create a new event-specific DAO
     * @param eventName Name of the event
     * @param eventDescription Description of the event
     * @param lifetime Lifetime of the DAO in seconds (0 for default)
     * @return eventId Unique identifier for the event
     */
    function createEventDAO(
        string calldata eventName,
        string calldata eventDescription,
        uint256 lifetime
    ) external onlyRole(CREATOR_ROLE) returns (bytes32) {
        require(bytes(eventName).length > 0, "Event name cannot be empty");
        
        // Generate a unique event ID based on name and timestamp
        bytes32 eventId = keccak256(abi.encodePacked(eventName, block.timestamp, msg.sender));
        
        // Make sure this event ID doesn't already exist
        require(!eventDAOs[eventId].exists, "Event ID already exists");
        
        // Calculate expiration time
        uint256 daoLifetime = lifetime > 0 ? lifetime : DEFAULT_DAO_LIFETIME;
        uint256 expiresAt = block.timestamp + daoLifetime;
        
        // Create new EventDAO
        EventDAO newDAO = new EventDAO(
            eventName,
            eventDescription,
            usdcToken,
            selfProtocolAddress,
            expiresAt,
            msg.sender
        );
        
        // Store DAO information
        eventDAOs[eventId] = EventDAOInfo({
            daoAddress: address(newDAO),
            eventName: eventName,
            eventDescription: eventDescription,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            exists: true
        });
        
        // Add to list of all events
        allEventIds.push(eventId);
        
        // Emit event
        emit EventDAOCreated(eventId, eventName, address(newDAO), expiresAt);
        
        return eventId;
    }
    
    /**
     * @dev Get all active event DAOs
     * @return eventIds Array of active event IDs
     */
    function getActiveEventDAOs() external view returns (bytes32[] memory) {
        uint256 activeCount = 0;
        
        // Count active events
        for (uint256 i = 0; i < allEventIds.length; i++) {
            if (eventDAOs[allEventIds[i]].expiresAt > block.timestamp) {
                activeCount++;
            }
        }
        
        // Create array of active event IDs
        bytes32[] memory activeEvents = new bytes32[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allEventIds.length; i++) {
            bytes32 eventId = allEventIds[i];
            if (eventDAOs[eventId].expiresAt > block.timestamp) {
                activeEvents[index] = eventId;
                index++;
            }
        }
        
        return activeEvents;
    }
    
    /**
     * @dev Get all expired event DAOs
     * @return eventIds Array of expired event IDs
     */
    function getExpiredEventDAOs() external view returns (bytes32[] memory) {
        uint256 expiredCount = 0;
        
        // Count expired events
        for (uint256 i = 0; i < allEventIds.length; i++) {
            if (eventDAOs[allEventIds[i]].expiresAt <= block.timestamp) {
                expiredCount++;
            }
        }
        
        // Create array of expired event IDs
        bytes32[] memory expiredEvents = new bytes32[](expiredCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allEventIds.length; i++) {
            bytes32 eventId = allEventIds[i];
            if (eventDAOs[eventId].expiresAt <= block.timestamp) {
                expiredEvents[index] = eventId;
                index++;
            }
        }
        
        return expiredEvents;
    }
    
    /**
     * @dev Get the total number of event DAOs
     * @return count Total number of DAOs created
     */
    function getEventDAOCount() external view returns (uint256) {
        return allEventIds.length;
    }
} 