// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./VolunteerRegistry.sol";
import "./FlashDAOToken.sol";
import "./FlashDAOTreasury.sol";
import "./FlashDAOGovernance.sol";

/**
 * @title MultiChainDAOFactory
 * @dev Factory contract for deploying the entire DAO system
 */
contract MultiChainDAOFactory is AccessControl {
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");
    
    struct DAODeployment {
        address volunteerRegistry;
        address governanceToken;
        address treasury;
        address governance;
        uint256 chainId;
        uint256 deploymentTime;
    }
    
    // DAO ID => ChainID => Deployment
    mapping(bytes32 => mapping(uint256 => DAODeployment)) public deployments;
    
    // DAO ID list
    bytes32[] public daoIds;
    
    // Events
    event DAODeployed(
        bytes32 indexed daoId,
        uint256 indexed chainId,
        address volunteerRegistry,
        address governanceToken,
        address treasury,
        address governance
    );
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DEPLOYER_ROLE, msg.sender);
    }
    
    /**
     * @dev Deploy a complete DAO system
     * @param daoId Unique identifier for the DAO (same across chains)
     * @param usdcAddress Address of the USDC token on this chain
     * @param selfProtocolAddress Address of Self Protocol verifier (can be address(0))
     */
    function deployDAO(
        bytes32 daoId,
        address usdcAddress,
        address selfProtocolAddress
    ) external onlyRole(DEPLOYER_ROLE) returns (
        address volunteerRegistry,
        address governanceToken,
        address treasury,
        address governance
    ) {
        require(usdcAddress != address(0), "Invalid USDC address");
        require(deployments[daoId][block.chainid].deploymentTime == 0, "DAO already deployed on this chain");
        
        // Step 1: Deploy VolunteerRegistry
        VolunteerRegistry _volunteerRegistry = new VolunteerRegistry(selfProtocolAddress);
        volunteerRegistry = address(_volunteerRegistry);
        
        // Step 2: Deploy governance token
        FlashDAOToken _governanceToken = new FlashDAOToken();
        governanceToken = address(_governanceToken);
        
        // Step 3: Deploy treasury
        FlashDAOTreasury _treasury = new FlashDAOTreasury(
            usdcAddress,
            governanceToken,
            volunteerRegistry
        );
        treasury = address(_treasury);
        
        // Step 4: Deploy governance
        FlashDAOGovernance _governance = new FlashDAOGovernance(
            governanceToken,
            treasury,
            volunteerRegistry
        );
        governance = address(_governance);
        
        // Step 5: Set up permissions
        _governanceToken.grantRole(keccak256("MINTER_ROLE"), treasury);
        _volunteerRegistry.grantRole(keccak256("ADMIN_ROLE"), msg.sender);
        _treasury.grantRole(keccak256("ADMIN_ROLE"), msg.sender);
        _governance.grantRole(keccak256("ADMIN_ROLE"), msg.sender);
        
        // Record deployment
        deployments[daoId][block.chainid] = DAODeployment({
            volunteerRegistry: volunteerRegistry,
            governanceToken: governanceToken,
            treasury: treasury,
            governance: governance,
            chainId: block.chainid,
            deploymentTime: block.timestamp
        });
        
        // Add to list if first deployment
        if (deployments[daoId][block.chainid].deploymentTime == 0) {
            daoIds.push(daoId);
        }
        
        emit DAODeployed(
            daoId,
            block.chainid,
            volunteerRegistry,
            governanceToken,
            treasury,
            governance
        );
        
        return (volunteerRegistry, governanceToken, treasury, governance);
    }
    
    /**
     * @dev Get deployment details for a DAO on a specific chain
     * @param daoId ID of the DAO
     * @param chainId Chain ID
     */
    function getDeployment(bytes32 daoId, uint256 chainId) external view returns (
        address volunteerRegistry,
        address governanceToken,
        address treasury,
        address governance,
        uint256 deploymentTime
    ) {
        DAODeployment storage deployment = deployments[daoId][chainId];
        return (
            deployment.volunteerRegistry,
            deployment.governanceToken,
            deployment.treasury,
            deployment.governance,
            deployment.deploymentTime
        );
    }
    
    /**
     * @dev Get deployment details for a DAO on current chain
     * @param daoId ID of the DAO
     */
    function getDeploymentOnCurrentChain(bytes32 daoId) external view returns (
        address volunteerRegistry,
        address governanceToken,
        address treasury,
        address governance,
        uint256 deploymentTime
    ) {
        DAODeployment storage deployment = deployments[daoId][block.chainid];
        return (
            deployment.volunteerRegistry,
            deployment.governanceToken,
            deployment.treasury,
            deployment.governance,
            deployment.deploymentTime
        );
    }
    
    /**
     * @dev Get count of unique DAOs
     */
    function getDaoCount() external view returns (uint256) {
        return daoIds.length;
    }
    
    /**
     * @dev Get DAO ID by index
     * @param index Index in the DAO list
     */
    function getDaoIdByIndex(uint256 index) external view returns (bytes32) {
        require(index < daoIds.length, "Index out of bounds");
        return daoIds[index];
    }
} 