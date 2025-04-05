// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./FlashDAO.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title FlashDAOFactory
 * @dev Factory contract for creating and managing FlashDAO instances
 */
contract FlashDAOFactory is AccessControl {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    
    // List of all created FlashDAOs
    address[] public deployedDAOs;
    
    // Mapping from disaster name hash to DAO address
    mapping(bytes32 => address) public daoByDisasterHash;
    
    // Events
    event DAOCreated(address indexed daoAddress, string disasterName, uint256 timestamp);
    
    /**
     * @dev Constructor
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Create a new FlashDAO instance
     * @param _donationToken Address of the ERC20 token used for donations
     * @param _disasterName Name of the disaster
     * @param _disasterDescription Description of the disaster
     * @param _fundingGoal Funding goal in donation tokens
     * @param _fundingDuration Duration of the funding period in seconds
     * @param _votingDuration Duration of the voting period in seconds
     * @return Address of the created FlashDAO
     */
    function createDAO(
        address _donationToken,
        string memory _disasterName,
        string memory _disasterDescription,
        uint256 _fundingGoal,
        uint256 _fundingDuration,
        uint256 _votingDuration
    ) external onlyRole(AGENT_ROLE) returns (address) {
        // Create hash of the disaster name to prevent duplicates
        bytes32 disasterHash = keccak256(abi.encodePacked(_disasterName));
        require(daoByDisasterHash[disasterHash] == address(0), "DAO for this disaster already exists");
        
        // Create a new FlashDAO instance
        FlashDAO newDAO = new FlashDAO(_donationToken);
        
        // Grant AGENT_ROLE to this factory
        newDAO.grantRole(newDAO.AGENT_ROLE(), address(this));
        
        // Create the disaster in the new DAO
        newDAO.createDisaster(
            _disasterName,
            _disasterDescription,
            _fundingGoal,
            _fundingDuration,
            _votingDuration
        );
        
        // Store the deployed DAO
        deployedDAOs.push(address(newDAO));
        daoByDisasterHash[disasterHash] = address(newDAO);
        
        emit DAOCreated(address(newDAO), _disasterName, block.timestamp);
        
        return address(newDAO);
    }
    
    /**
     * @dev Grant AGENT_ROLE to an address for a specific DAO
     * @param _dao Address of the FlashDAO
     * @param _agent Address to grant the AGENT_ROLE to
     */
    function grantAgentRole(address _dao, address _agent) external onlyRole(DEFAULT_ADMIN_ROLE) {
        FlashDAO dao = FlashDAO(_dao);
        dao.grantRole(dao.AGENT_ROLE(), _agent);
    }
    
    /**
     * @dev Get the number of deployed DAOs
     * @return Number of deployed DAOs
     */
    function getDeployedDAOCount() external view returns (uint256) {
        return deployedDAOs.length;
    }
    
    /**
     * @dev Check if a DAO exists for a specific disaster name
     * @param _disasterName Name of the disaster
     * @return Whether a DAO exists for the given disaster name
     */
    function daoExists(string memory _disasterName) external view returns (bool) {
        bytes32 disasterHash = keccak256(abi.encodePacked(_disasterName));
        return daoByDisasterHash[disasterHash] != address(0);
    }
    
    /**
     * @dev Get the DAO address for a specific disaster name
     * @param _disasterName Name of the disaster
     * @return Address of the DAO for the given disaster name
     */
    function getDAOAddress(string memory _disasterName) external view returns (address) {
        bytes32 disasterHash = keccak256(abi.encodePacked(_disasterName));
        return daoByDisasterHash[disasterHash];
    }
} 