// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

contract neoxverse is ERC1155, Ownable, ReentrancyGuard, ERC1155Holder {
    using Strings for uint256;

    // Constants
    uint256 public constant AURA_TOKEN_ID = 0; // ID for fungible AURA tokens
    uint256 public constant DAILY_CLAIM_INTERVAL = 1 days;
    uint256 public constant STAKE_APR = 1500; // 15% APR
    uint256 public constant APR_DENOMINATOR = 10000;

    // State variables
    mapping(string => bool) public activeLocations;
    mapping(address => mapping(string => uint256)) public lastClaim;
    mapping(uint256 => LocationNFT) public locationNFTs;
    mapping(address => mapping(string => StakeInfo)) public userStakes;
    mapping(string => uint256) public totalLocationStakes;
    mapping(string => uint256) public totalLocationAura;
    mapping(address => mapping(string => uint256)) public userLocationAura;
    mapping(string => address[]) public locationVisitors;
    
    uint256 public nftCounter = 1; // Start from 1, 0 is reserved for AURA

    // Add base URI for metadata
    string private _baseURI;

    // Structs
    struct LocationNFT {
        uint256 tokenId;
        string placeId;
        address owner;
        string imageUri;
        uint256 timestamp;
        bool isNFTMinted;
    }

    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
    }

    // Events
    event AuraClaimed(address indexed user, string placeId, uint256 amount);
    event LocationNFTMinted(address indexed owner, string placeId, uint256 tokenId);
    event AuraStaked(address indexed user, string placeId, uint256 amount);
    event AuraUnstaked(address indexed user, string placeId, uint256 amount, uint256 rewards);
    event QuestCompleted(address indexed user, uint256 amount);
    event LocationActivated(string placeId, address activator);
    event LocationStaked(address indexed user, string placeId, uint256 amount);
    event StakeWithdrawn(address indexed user, string placeId, uint256 amount, uint256 rewards);
    event Debug(string message, address account, uint256 value);
    event Debug(string message, uint256 value1, uint256 value2);

    constructor() ERC1155("") Ownable(msg.sender) {
        // Mint initial AURA supply
        _mint(msg.sender, AURA_TOKEN_ID, 1000000 * 1e18, "");
    }

    // Add setBaseURI function
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseURI = newBaseURI;
    }

    // Modified to use ERC1155 balanceOf
    function auraBalance(address account) public view returns (uint256) {
        return balanceOf(account, AURA_TOKEN_ID);
    }

    function claimAura(string memory placeId) external nonReentrant {
        if (!activeLocations[placeId]) {
            activeLocations[placeId] = true;
            emit LocationActivated(placeId, msg.sender);
        }

        require(
            block.timestamp >= lastClaim[msg.sender][placeId] + DAILY_CLAIM_INTERVAL,
            "Too soon to claim"
        );

        uint256 amount = 100 * 1e18;
        lastClaim[msg.sender][placeId] = block.timestamp;

        totalLocationAura[placeId] += amount;
        userLocationAura[msg.sender][placeId] += amount;

        bool isNewVisitor = true;
        for(uint i = 0; i < locationVisitors[placeId].length; i++) {
            if(locationVisitors[placeId][i] == msg.sender) {
                isNewVisitor = false;
                break;
            }
        }
        if(isNewVisitor) {
            locationVisitors[placeId].push(msg.sender);
        }

        _mint(msg.sender, AURA_TOKEN_ID, amount, "");
        emit AuraClaimed(msg.sender, placeId, amount);
    }

    function mintLocationNFT(string memory placeId, string memory imageUri) external {
        require(activeLocations[placeId], "Location not active");
        
        nftCounter++;
        locationNFTs[nftCounter] = LocationNFT(
            nftCounter,
            placeId,
            msg.sender,
            imageUri,
            block.timestamp,
            true
        );

        _mint(msg.sender, nftCounter, 1, "");
        emit LocationNFTMinted(msg.sender, placeId, nftCounter);
    }

    // Override uri function properly
    function uri(uint256 tokenId) public view override returns (string memory) {
        if (tokenId == AURA_TOKEN_ID) {
            return string(abi.encodePacked(_baseURI, "aura.json"));
        }
        
        LocationNFT memory nft = locationNFTs[tokenId];
        require(nft.timestamp != 0, "Token does not exist");
        
        // Return a proper metadata JSON URI that follows OpenSea metadata standards
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(
                    bytes(
                        string(
                            abi.encodePacked(
                                '{"name": "neoxverse Location #', 
                                Strings.toString(tokenId),
                                '", "description": "neoxverse Location NFT", "image": "',
                                nft.imageUri,
                                '", "attributes": [{"trait_type": "Location", "value": "',
                                nft.placeId,
                                '"}]}'
                            )
                        )
                    )
                )
            )
        );
    }

    // Add isApprovedForAll override to allow contract to transfer tokens
    function isApprovedForAll(address account, address operator) 
        public 
        view 
        virtual 
        override 
        returns (bool) 
    {
        // Allow the contract itself to transfer tokens
        if (operator == address(this)) {
            return true;
        }
        return super.isApprovedForAll(account, operator);
    }

    // Add custom errors
    error NotActive(string placeId);
    error InsufficientBalance(uint256 required, uint256 actual);
    error NotApproved(address user, address operator);
    error TransferFailed();

    // Modify staking functions to use ERC1155
    function stake(string memory placeId, uint256 amount) external nonReentrant {
        if (!activeLocations[placeId]) {
            revert("LOCATION_NOT_ACTIVE");
        }

        if (amount == 0) {
            revert("ZERO_STAKE_AMOUNT");
        }

        uint256 userBalance = balanceOf(msg.sender, AURA_TOKEN_ID);
        if (userBalance < amount) {
            revert("INSUFFICIENT_BALANCE");
        }

        // Transfer tokens to contract
        _safeTransferFrom(msg.sender, address(this), AURA_TOKEN_ID, amount, "");

        // Update stake info
        StakeInfo storage userStake = userStakes[msg.sender][placeId];
        if (userStake.amount > 0) {
            _claimStakingRewards(msg.sender, placeId);
        }

        userStake.amount += amount;
        userStake.timestamp = block.timestamp;
        totalLocationStakes[placeId] += amount;

        emit AuraStaked(msg.sender, placeId, amount);
    }

    // Fix unstake function to handle approvals
    function unstake(string memory placeId) external nonReentrant {
        StakeInfo storage userStake = userStakes[msg.sender][placeId];
        require(userStake.amount > 0, "No stake found");

        uint256 rewards = _calculateRewards(msg.sender, placeId);
        uint256 stakedAmount = userStake.amount;

        totalLocationStakes[placeId] -= stakedAmount;
        userStake.amount = 0;
        userStake.timestamp = 0;

        // Mint rewards first
        _mint(msg.sender, AURA_TOKEN_ID, rewards, "");
        
        // Then transfer staked amount back
        _safeTransferFrom(address(this), msg.sender, AURA_TOKEN_ID, stakedAmount, "");

        emit AuraUnstaked(msg.sender, placeId, stakedAmount, rewards);
    }

    // Quest completion
    function completeQuest(address user, uint256 amount) external onlyOwner {
        _mint(user, AURA_TOKEN_ID, amount, "");
        emit QuestCompleted(user, amount);
    }

    // Event access check
    function checkEventAccess(uint256 minAura) external view returns (bool) {
        return balanceOf(msg.sender, AURA_TOKEN_ID) >= minAura;
    }

    // Internal functions
    function _calculateRewards(address user, string memory placeId) internal view returns (uint256) {
        StakeInfo memory userStake = userStakes[user][placeId];
        if (userStake.amount == 0) return 0;

        uint256 timeStaked = block.timestamp - userStake.timestamp;
        return (userStake.amount * STAKE_APR * timeStaked) / (365 days * APR_DENOMINATOR);
    }

    function _claimStakingRewards(address user, string memory placeId) internal {
        uint256 rewards = _calculateRewards(user, placeId);
        if (rewards > 0) {
            _mint(user, AURA_TOKEN_ID, rewards, "");
            userStakes[user][placeId].timestamp = block.timestamp;
        }
    }

    // View functions for UI
    function getLocationStats(string memory placeId) external view returns (
        uint256 totalAura,
        uint256 totalStaked,
        uint256 visitorCount
    ) {
        return (
            totalLocationAura[placeId],
            totalLocationStakes[placeId],
            locationVisitors[placeId].length
        );
    }

    function getUserLocationStats(address user, string memory placeId) external view returns (
        uint256 auraFarmed,
        uint256 stakeAmount,
        uint256 lastClaimTime,
        bool hasVisited
    ) {
        bool _hasVisited = false;
        for(uint i = 0; i < locationVisitors[placeId].length; i++) {
            if(locationVisitors[placeId][i] == user) {
                _hasVisited = true;
                break;
            }
        }
        
        return (
            userLocationAura[user][placeId],
            userStakes[user][placeId].amount,
            lastClaim[user][placeId],
            _hasVisited
        );
    }

    function getNFTInfo(uint256 tokenId) external view returns (
        string memory placeId,
        address owner,
        string memory imageUri,
        uint256 timestamp,
        bool isNFTMinted
    ) {
        LocationNFT memory nft = locationNFTs[tokenId];
        require(nft.timestamp != 0, "Token does not exist");
        return (
            nft.placeId,
            nft.owner,
            nft.imageUri,
            nft.timestamp,
            nft.isNFTMinted
        );
    }

    // Add this override to resolve the conflict
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155, ERC1155Holder)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 