// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title ISelfProtocol
 * @dev Interface for Self Protocol verification
 */
interface ISelfProtocol {
    function verifyCredential(
        address user,
        bytes calldata credential,
        bytes calldata signature
    ) external view returns (bool);
    
    function getVerifier() external view returns (address);
}

/**
 * @title VolunteerRegistry
 * @dev Registry for volunteers with Self Protocol integration
 */
contract VolunteerRegistry is AccessControl {
    using ECDSA for bytes32;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Self Protocol interface - can be set to actual protocol address later
    ISelfProtocol public selfProtocol;
    bool public selfProtocolEnabled = false;
    
    struct VolunteerInfo {
        bool isRegistered;
        string name;
        string profileData; // IPFS hash to more detailed information
        uint256 registrationTime;
        bytes credential; // Stores Self Protocol credential hash
    }
    
    mapping(address => VolunteerInfo) public volunteers;
    address[] public volunteerAddresses;
    
    event VolunteerRegistered(address indexed volunteer, string name);
    event SelfProtocolUpdated(address indexed protocolAddress);
    event SelfProtocolStatusChanged(bool enabled);
    
    /**
     * @dev Constructor
     * @param _selfProtocol Address of Self Protocol contract (can be address(0) initially)
     */
    constructor(address _selfProtocol) {
        if (_selfProtocol != address(0)) {
            selfProtocol = ISelfProtocol(_selfProtocol);
            selfProtocolEnabled = true;
        }
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Set Self Protocol contract address
     * @param _protocolAddress The address of Self Protocol contract
     */
    function setSelfProtocol(address _protocolAddress) external onlyRole(ADMIN_ROLE) {
        require(_protocolAddress != address(0), "Invalid protocol address");
        selfProtocol = ISelfProtocol(_protocolAddress);
        emit SelfProtocolUpdated(_protocolAddress);
    }
    
    /**
     * @dev Enable or disable Self Protocol verification
     * @param _enabled Whether Self Protocol verification is enabled
     */
    function setSelfProtocolEnabled(bool _enabled) external onlyRole(ADMIN_ROLE) {
        selfProtocolEnabled = _enabled;
        emit SelfProtocolStatusChanged(_enabled);
    }
    
    /**
     * @dev Register as volunteer with Self Protocol verification
     * @param name Volunteer name
     * @param profileData Additional volunteer profile data
     * @param credential Self Protocol credential
     * @param signature Self Protocol signature
     */
    function registerWithSelfProtocol(
        string calldata name,
        string calldata profileData,
        bytes calldata credential,
        bytes calldata signature
    ) external {
        require(selfProtocolEnabled, "Self Protocol verification not enabled");
        require(!volunteers[msg.sender].isRegistered, "Already registered as volunteer");
        require(bytes(name).length > 0, "Name cannot be empty");
        
        // Verify through Self Protocol
        require(
            selfProtocol.verifyCredential(msg.sender, credential, signature),
            "Identity verification failed"
        );
        
        _registerVolunteer(msg.sender, name, profileData, credential);
    }
    
    /**
     * @dev Register volunteer by admin (fallback method)
     * @param volunteerAddress Address of the volunteer
     * @param name Volunteer name
     * @param profileData Additional volunteer info
     */
    function adminRegisterVolunteer(
        address volunteerAddress, 
        string calldata name, 
        string calldata profileData
    ) external onlyRole(ADMIN_ROLE) {
        require(!volunteers[volunteerAddress].isRegistered, "Volunteer already registered");
        require(bytes(name).length > 0, "Name cannot be empty");
        
        _registerVolunteer(volunteerAddress, name, profileData, "");
    }
    
    /**
     * @dev Internal function to register a volunteer
     */
    function _registerVolunteer(
        address volunteerAddress,
        string memory name,
        string memory profileData,
        bytes memory credential
    ) internal {
        volunteers[volunteerAddress] = VolunteerInfo({
            isRegistered: true,
            name: name,
            profileData: profileData,
            registrationTime: block.timestamp,
            credential: credential
        });
        
        volunteerAddresses.push(volunteerAddress);
        
        emit VolunteerRegistered(volunteerAddress, name);
    }
    
    /**
     * @dev Check if an address is a registered volunteer
     * @param account Address to check
     * @return Whether the address is a registered volunteer
     */
    function isVolunteer(address account) external view returns (bool) {
        return volunteers[account].isRegistered;
    }
    
    /**
     * @dev Get the total number of registered volunteers
     * @return Number of volunteers
     */
    function getVolunteerCount() external view returns (uint256) {
        return volunteerAddresses.length;
    }
    
    /**
     * @dev Get volunteer info by index
     * @param index Index in the volunteer list
     */
    function getVolunteerByIndex(uint256 index) external view returns (
        address volunteerAddress,
        string memory name,
        string memory profileData,
        uint256 registrationTime
    ) {
        require(index < volunteerAddresses.length, "Index out of bounds");
        address addr = volunteerAddresses[index];
        VolunteerInfo storage info = volunteers[addr];
        
        return (
            addr,
            info.name,
            info.profileData,
            info.registrationTime
        );
    }
} 