// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/ISelfProtocol.sol";

/**
 * @title VolunteerRegistry
 * @dev Contract for registering and managing volunteers for FlashDAO events
 */
contract VolunteerRegistry is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EVENT_MANAGER_ROLE = keccak256("EVENT_MANAGER_ROLE");
    
    ISelfProtocol public selfProtocol;
    uint256 private _volunteerId;
    
    struct Volunteer {
        uint256 id;
        address walletAddress;
        string name;
        string description;
        uint256 registrationDate;
        bool isActive;
        bool isApproved;
    }
    
    // Volunteer storage
    mapping(address => Volunteer) public volunteerByAddress;
    mapping(uint256 => address) public volunteerAddressById;
    mapping(uint256 => bool) public volunteerExists;
    
    // Voting restriction tracking
    mapping(address => bool) public hasVoted;
    
    // Events
    event VolunteerRegistered(uint256 indexed volunteerId, address indexed volunteerAddress, string name);
    event VolunteerApproved(uint256 indexed volunteerId, address indexed volunteerAddress);
    event VolunteerDeactivated(uint256 indexed volunteerId, address indexed volunteerAddress);
    event SelfProtocolAddressUpdated(address indexed newAddress);
    
    /**
     * @dev Constructor to initialize the contract
     * @param _selfProtocolAddress Address of the Self Protocol for credential verification
     */
    constructor(address _selfProtocolAddress) {
        require(_selfProtocolAddress != address(0), "Invalid Self Protocol address");
        
        selfProtocol = ISelfProtocol(_selfProtocolAddress);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(EVENT_MANAGER_ROLE, msg.sender);
    }
    
    /**
     * @dev Allow users to register themselves as volunteers
     * @param _name Name of the volunteer
     * @param _description Description of the volunteer
     * @param _credentials Self Protocol credentials for verification
     */
    function registerAsVolunteer(
        string calldata _name,
        string calldata _description,
        bytes calldata _credentials
    ) external {
        require(!isVolunteer(msg.sender), "Already registered as volunteer");
        require(!hasVoted[msg.sender], "Voters cannot be volunteers");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        // Verify credentials with Self Protocol
        require(selfProtocol.verifyCredentials(msg.sender, _credentials), "Invalid credentials");
        
        // Create new volunteer
        uint256 newVolunteerId = _volunteerId;
        _volunteerId = _volunteerId + 1;
        
        Volunteer memory newVolunteer = Volunteer({
            id: newVolunteerId,
            walletAddress: msg.sender,
            name: _name,
            description: _description,
            registrationDate: block.timestamp,
            isActive: true,
            isApproved: false
        });
        
        volunteerByAddress[msg.sender] = newVolunteer;
        volunteerAddressById[newVolunteerId] = msg.sender;
        volunteerExists[newVolunteerId] = true;
        
        emit VolunteerRegistered(newVolunteerId, msg.sender, _name);
    }
    
    /**
     * @dev Allow admins to register volunteers
     * @param _volunteerAddress Address of the volunteer
     * @param _name Name of the volunteer
     * @param _description Description of the volunteer
     * @param _credentials Self Protocol credentials for verification
     */
    function registerVolunteer(
        address _volunteerAddress,
        string calldata _name,
        string calldata _description,
        bytes calldata _credentials
    ) external onlyRole(ADMIN_ROLE) {
        require(_volunteerAddress != address(0), "Invalid volunteer address");
        require(!isVolunteer(_volunteerAddress), "Already registered as volunteer");
        require(!hasVoted[_volunteerAddress], "Voters cannot be volunteers");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        // Verify credentials with Self Protocol
        require(selfProtocol.verifyCredentials(_volunteerAddress, _credentials), "Invalid credentials");
        
        // Create new volunteer
        uint256 newVolunteerId = _volunteerId;
        _volunteerId = _volunteerId + 1;
        
        Volunteer memory newVolunteer = Volunteer({
            id: newVolunteerId,
            walletAddress: _volunteerAddress,
            name: _name,
            description: _description,
            registrationDate: block.timestamp,
            isActive: true,
            isApproved: true  // Auto-approved when registered by admin
        });
        
        volunteerByAddress[_volunteerAddress] = newVolunteer;
        volunteerAddressById[newVolunteerId] = _volunteerAddress;
        volunteerExists[newVolunteerId] = true;
        
        emit VolunteerRegistered(newVolunteerId, _volunteerAddress, _name);
        emit VolunteerApproved(newVolunteerId, _volunteerAddress);
    }
    
    /**
     * @dev Approve a volunteer
     * @param volunteerId ID of the volunteer to approve
     */
    function approveVolunteer(uint256 volunteerId) external onlyRole(EVENT_MANAGER_ROLE) {
        require(volunteerExists[volunteerId], "Volunteer does not exist");
        
        address volunteerAddress = volunteerAddressById[volunteerId];
        Volunteer storage volunteer = volunteerByAddress[volunteerAddress];
        
        require(!volunteer.isApproved, "Volunteer already approved");
        require(volunteer.isActive, "Volunteer is not active");
        
        volunteer.isApproved = true;
        
        emit VolunteerApproved(volunteerId, volunteerAddress);
    }
    
    /**
     * @dev Deactivate a volunteer
     * @param volunteerId ID of the volunteer to deactivate
     */
    function deactivateVolunteer(uint256 volunteerId) external onlyRole(ADMIN_ROLE) {
        require(volunteerExists[volunteerId], "Volunteer does not exist");
        
        address volunteerAddress = volunteerAddressById[volunteerId];
        Volunteer storage volunteer = volunteerByAddress[volunteerAddress];
        
        require(volunteer.isActive, "Volunteer already inactive");
        
        volunteer.isActive = false;
        
        emit VolunteerDeactivated(volunteerId, volunteerAddress);
    }
    
    /**
     * @dev Mark a user as having voted (can only be called by an event contract with EVENT_MANAGER_ROLE)
     * @param _voter Address of the user who voted
     */
    function markAsVoted(address _voter) external onlyRole(EVENT_MANAGER_ROLE) {
        hasVoted[_voter] = true;
    }
    
    /**
     * @dev Update the Self Protocol address
     * @param _newSelfProtocolAddress New address for Self Protocol
     */
    function updateSelfProtocolAddress(address _newSelfProtocolAddress) external onlyRole(ADMIN_ROLE) {
        require(_newSelfProtocolAddress != address(0), "Invalid Self Protocol address");
        
        selfProtocol = ISelfProtocol(_newSelfProtocolAddress);
        
        emit SelfProtocolAddressUpdated(_newSelfProtocolAddress);
    }
    
    /**
     * @dev Check if an address is a registered volunteer
     * @param _address Address to check
     * @return True if the address is a registered volunteer
     */
    function isVolunteer(address _address) public view returns (bool) {
        return volunteerByAddress[_address].walletAddress == _address;
    }
    
    /**
     * @dev Check if a volunteer is approved
     * @param volunteerId ID of the volunteer to check
     * @return True if the volunteer is approved
     */
    function isApproved(uint256 volunteerId) external view returns (bool) {
        require(volunteerExists[volunteerId], "Volunteer does not exist");
        
        address volunteerAddress = volunteerAddressById[volunteerId];
        return volunteerByAddress[volunteerAddress].isApproved;
    }
    
    /**
     * @dev Get volunteer information by ID
     * @param volunteerId ID of the volunteer
     * @return Volunteer information (id, address, name, description, registration date, active status, approval status)
     */
    function getVolunteerById(uint256 volunteerId) external view returns (Volunteer memory) {
        require(volunteerExists[volunteerId], "Volunteer does not exist");
        
        address volunteerAddress = volunteerAddressById[volunteerId];
        return volunteerByAddress[volunteerAddress];
    }
    
    /**
     * @dev Get volunteer information by address
     * @param _volunteerAddress Address of the volunteer
     * @return Volunteer information (id, address, name, description, registration date, active status, approval status)
     */
    function getVolunteerByAddress(address _volunteerAddress) external view returns (Volunteer memory) {
        require(isVolunteer(_volunteerAddress), "Not a volunteer");
        
        return volunteerByAddress[_volunteerAddress];
    }
    
    /**
     * @dev Get the total number of registered volunteers
     * @return Total number of volunteers
     */
    function getVolunteerCount() external view returns (uint256) {
        return _volunteerId;
    }
} 