// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/ISelfProtocol.sol";

/**
 * @title VolunteerRegistry
 * @dev Registry for volunteers with credential verification
 */
contract VolunteerRegistry is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    struct Volunteer {
        address volunteerAddress;
        string name;
        string description;
        bool approved;
        uint256 registrationTime;
    }
    
    // Volunteer management
    Volunteer[] public volunteers;
    mapping(address => bool) public isVolunteer;
    mapping(address => uint256) public volunteerIndex;
    
    // Self Protocol for credential verification
    ISelfProtocol public selfProtocol;
    
    // Events
    event VolunteerRegistered(address indexed volunteer, string name);
    event VolunteerApproved(address indexed volunteer, uint256 volunteerIndex);
    
    /**
     * @dev Constructor
     * @param _selfProtocolAddress Address of Self Protocol for credential verification
     */
    constructor(address _selfProtocolAddress) {
        require(_selfProtocolAddress != address(0), "Invalid Self Protocol address");
        
        selfProtocol = ISelfProtocol(_selfProtocolAddress);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }
    
    /**
     * @dev Register as a volunteer
     * @param name Volunteer name
     * @param description Volunteer description
     * @param credentials Credentials from Self Protocol
     */
    function registerAsVolunteer(
        string calldata name,
        string calldata description,
        bytes calldata credentials
    ) external {
        require(!isVolunteer[msg.sender], "Already registered as volunteer");
        require(bytes(name).length > 0, "Name cannot be empty");
        
        // Verify credentials with Self Protocol
        require(selfProtocol.verifyCredentials(msg.sender, credentials), "Invalid credentials");
        
        // Add to volunteers array
        volunteers.push(Volunteer({
            volunteerAddress: msg.sender,
            name: name,
            description: description,
            approved: false,
            registrationTime: block.timestamp
        }));
        
        // Update tracking
        isVolunteer[msg.sender] = true;
        volunteerIndex[msg.sender] = volunteers.length - 1;
        
        emit VolunteerRegistered(msg.sender, name);
    }
    
    /**
     * @dev Admin approves a volunteer
     * @param _volunteerIndex Index of the volunteer
     */
    function approveVolunteer(uint256 _volunteerIndex) external onlyRole(VERIFIER_ROLE) {
        require(_volunteerIndex < volunteers.length, "Invalid volunteer index");
        require(!volunteers[_volunteerIndex].approved, "Volunteer already approved");
        
        volunteers[_volunteerIndex].approved = true;
        
        emit VolunteerApproved(volunteers[_volunteerIndex].volunteerAddress, _volunteerIndex);
    }
    
    /**
     * @dev Get volunteer count
     * @return Number of volunteers registered
     */
    function getVolunteerCount() external view returns (uint256) {
        return volunteers.length;
    }
    
    /**
     * @dev Check if a volunteer is approved
     * @param volunteerAddress Address of the volunteer
     * @return Whether the volunteer is approved
     */
    function isApprovedVolunteer(address volunteerAddress) external view returns (bool) {
        if (!isVolunteer[volunteerAddress]) {
            return false;
        }
        return volunteers[volunteerIndex[volunteerAddress]].approved;
    }
} 