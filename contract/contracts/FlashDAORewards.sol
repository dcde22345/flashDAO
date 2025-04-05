// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./FlashDAO.sol";

/**
 * @title FlashDAORewards
 * @dev NFT rewards for FlashDAO donors and volunteers
 */
contract FlashDAORewards is ERC721Enumerable, AccessControl {
    using Counters for Counters.Counter;
    using Strings for uint256;
    
    bytes32 public constant DAO_ROLE = keccak256("DAO_ROLE");
    
    // Token ID counter
    Counters.Counter private _tokenIdCounter;
    
    // NFT Types
    enum NFTType { DONOR, VOLUNTEER }
    
    // NFT metadata
    struct NFTMetadata {
        NFTType nftType;
        string disasterName;
        uint256 donationAmount;
        uint256 timestamp;
    }
    
    // Token ID to metadata
    mapping(uint256 => NFTMetadata) public tokenMetadata;
    
    // Donor address to total donation amount
    mapping(address => uint256) public totalDonations;
    
    // Donor address to number of volunteer roles
    mapping(address => uint256) public totalVolunteerRoles;
    
    // Milestone thresholds for donors
    uint256[] public donorMilestones;
    
    // Events
    event RewardMinted(address indexed recipient, uint256 indexed tokenId, NFTType nftType, string disasterName);
    
    /**
     * @dev Constructor
     * @param _donorMilestones Array of donation amount milestones for donor rewards
     */
    constructor(uint256[] memory _donorMilestones) ERC721("FlashDAO Rewards", "FLASHR") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        // Set donor milestones
        for (uint256 i = 0; i < _donorMilestones.length; i++) {
            donorMilestones.push(_donorMilestones[i]);
        }
    }
    
    /**
     * @dev Mint a donor reward NFT
     * @param _donor Address of the donor
     * @param _disasterName Name of the disaster
     * @param _donationAmount Amount donated
     */
    function mintDonorReward(address _donor, string memory _disasterName, uint256 _donationAmount) external onlyRole(DAO_ROLE) {
        // Update total donations
        totalDonations[_donor] += _donationAmount;
        
        // Check if donor has reached a new milestone
        bool reachedMilestone = false;
        uint256 totalDonation = totalDonations[_donor];
        
        for (uint256 i = 0; i < donorMilestones.length; i++) {
            // If total donation is exactly equal to a milestone or 
            // it just crossed a milestone that wasn't previously crossed
            if (totalDonation == donorMilestones[i] || 
                (totalDonation > donorMilestones[i] && totalDonation - _donationAmount <= donorMilestones[i])) {
                reachedMilestone = true;
                break;
            }
        }
        
        if (reachedMilestone) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            
            _mint(_donor, tokenId);
            
            tokenMetadata[tokenId] = NFTMetadata({
                nftType: NFTType.DONOR,
                disasterName: _disasterName,
                donationAmount: _donationAmount,
                timestamp: block.timestamp
            });
            
            emit RewardMinted(_donor, tokenId, NFTType.DONOR, _disasterName);
        }
    }
    
    /**
     * @dev Mint a volunteer reward NFT
     * @param _volunteer Address of the volunteer
     * @param _disasterName Name of the disaster
     */
    function mintVolunteerReward(address _volunteer, string memory _disasterName) external onlyRole(DAO_ROLE) {
        totalVolunteerRoles[_volunteer]++;
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _mint(_volunteer, tokenId);
        
        tokenMetadata[tokenId] = NFTMetadata({
            nftType: NFTType.VOLUNTEER,
            disasterName: _disasterName,
            donationAmount: 0,
            timestamp: block.timestamp
        });
        
        emit RewardMinted(_volunteer, tokenId, NFTType.VOLUNTEER, _disasterName);
    }
    
    /**
     * @dev Get metadata for a token as JSON
     * @param _tokenId ID of the token
     * @return Token metadata as JSON string
     */
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "Token does not exist");
        
        NFTMetadata memory metadata = tokenMetadata[_tokenId];
        string memory nftTypeStr = metadata.nftType == NFTType.DONOR ? "Donor" : "Volunteer";
        
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "FlashDAO ', nftTypeStr, ' Badge", ',
                        '"description": "A recognition for ', nftTypeStr, ' contribution to ', metadata.disasterName, '", ',
                        '"attributes": [',
                            '{"trait_type": "Type", "value": "', nftTypeStr, '"}, ',
                            '{"trait_type": "Disaster", "value": "', metadata.disasterName, '"}, ',
                            metadata.nftType == NFTType.DONOR ? 
                                string(abi.encodePacked('{"trait_type": "Donation Amount", "value": ', metadata.donationAmount.toString(), '}, ')) : 
                                '', 
                            '{"trait_type": "Date", "value": "', metadata.timestamp.toString(), '"}',
                        ']',
                        '}'
                    )
                )
            )
        );
        
        return string(abi.encodePacked("data:application/json;base64,", json));
    }
    
    /**
     * @dev Get the number of donor milestones
     * @return Number of donor milestones
     */
    function getDonorMilestoneCount() external view returns (uint256) {
        return donorMilestones.length;
    }
    
    /**
     * @dev Add a new donor milestone
     * @param _milestone New milestone amount
     */
    function addDonorMilestone(uint256 _milestone) external onlyRole(DEFAULT_ADMIN_ROLE) {
        donorMilestones.push(_milestone);
    }
    
    // Required override for AccessControl
    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 