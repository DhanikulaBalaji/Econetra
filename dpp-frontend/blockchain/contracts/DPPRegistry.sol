// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title DPPRegistry
 * @dev Smart contract for registering and verifying Digital Product Passports
 * @notice This contract stores immutable hashes of DPP data on the Polygon blockchain
 */
contract DPPRegistry is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Counter for DPP entries
    Counters.Counter private _dppCounter;
    
    // Struct to store DPP information
    struct DPPEntry {
        string ipfsCid;           // IPFS Content Identifier
        bytes32 dataHash;         // Hash of the DPP data
        address issuer;           // Address of the DPP issuer
        uint256 timestamp;        // Timestamp of registration
        bool isActive;            // Status of the DPP
        string productId;         // Product identifier
        string supplierInfo;      // Supplier information hash
    }
    
    // Mapping from DPP ID to DPP entry
    mapping(uint256 => DPPEntry) public dppEntries;
    
    // Mapping from IPFS CID to DPP ID
    mapping(string => uint256) public cidToDppId;
    
    // Mapping from data hash to DPP ID
    mapping(bytes32 => uint256) public hashToDppId;
    
    // Mapping from product ID to DPP ID
    mapping(string => uint256) public productToDppId;
    
    // Mapping of authorized issuers
    mapping(address => bool) public authorizedIssuers;
    
    // Events
    event DPPRegistered(
        uint256 indexed dppId,
        string indexed ipfsCid,
        bytes32 indexed dataHash,
        address issuer,
        string productId
    );
    
    event DPPUpdated(
        uint256 indexed dppId,
        string newIpfsCid,
        bytes32 newDataHash
    );
    
    event DPPDeactivated(uint256 indexed dppId);
    
    event IssuerAuthorized(address indexed issuer);
    
    event IssuerRevoked(address indexed issuer);
    
    // Modifiers
    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender] || msg.sender == owner(), "Not authorized issuer");
        _;
    }
    
    modifier validDppId(uint256 dppId) {
        require(dppId > 0 && dppId <= _dppCounter.current(), "Invalid DPP ID");
        _;
    }
    
    constructor() {
        // Owner is automatically authorized
        authorizedIssuers[msg.sender] = true;
    }
    
    /**
     * @dev Register a new DPP on the blockchain
     * @param ipfsCid IPFS Content Identifier for the DPP metadata
     * @param dataHash Hash of the DPP data for integrity verification
     * @param productId Unique identifier for the product
     * @param supplierInfo Hash of supplier information
     * @return dppId The unique ID assigned to this DPP
     */
    function registerDPP(
        string memory ipfsCid,
        bytes32 dataHash,
        string memory productId,
        string memory supplierInfo
    ) external onlyAuthorizedIssuer nonReentrant returns (uint256) {
        require(bytes(ipfsCid).length > 0, "IPFS CID cannot be empty");
        require(dataHash != bytes32(0), "Data hash cannot be empty");
        require(bytes(productId).length > 0, "Product ID cannot be empty");
        require(cidToDppId[ipfsCid] == 0, "IPFS CID already registered");
        require(hashToDppId[dataHash] == 0, "Data hash already registered");
        require(productToDppId[productId] == 0, "Product already has DPP");
        
        _dppCounter.increment();
        uint256 newDppId = _dppCounter.current();
        
        dppEntries[newDppId] = DPPEntry({
            ipfsCid: ipfsCid,
            dataHash: dataHash,
            issuer: msg.sender,
            timestamp: block.timestamp,
            isActive: true,
            productId: productId,
            supplierInfo: supplierInfo
        });
        
        cidToDppId[ipfsCid] = newDppId;
        hashToDppId[dataHash] = newDppId;
        productToDppId[productId] = newDppId;
        
        emit DPPRegistered(newDppId, ipfsCid, dataHash, msg.sender, productId);
        
        return newDppId;
    }
    
    /**
     * @dev Update an existing DPP with new IPFS CID and data hash
     * @param dppId The DPP ID to update
     * @param newIpfsCid New IPFS Content Identifier
     * @param newDataHash New hash of the DPP data
     */
    function updateDPP(
        uint256 dppId,
        string memory newIpfsCid,
        bytes32 newDataHash
    ) external onlyAuthorizedIssuer validDppId(dppId) nonReentrant {
        DPPEntry storage entry = dppEntries[dppId];
        require(entry.isActive, "DPP is not active");
        require(entry.issuer == msg.sender || msg.sender == owner(), "Not authorized to update this DPP");
        require(bytes(newIpfsCid).length > 0, "IPFS CID cannot be empty");
        require(newDataHash != bytes32(0), "Data hash cannot be empty");
        require(cidToDppId[newIpfsCid] == 0 || cidToDppId[newIpfsCid] == dppId, "IPFS CID already used");
        require(hashToDppId[newDataHash] == 0 || hashToDppId[newDataHash] == dppId, "Data hash already used");
        
        // Remove old mappings
        delete cidToDppId[entry.ipfsCid];
        delete hashToDppId[entry.dataHash];
        
        // Update entry
        entry.ipfsCid = newIpfsCid;
        entry.dataHash = newDataHash;
        
        // Add new mappings
        cidToDppId[newIpfsCid] = dppId;
        hashToDppId[newDataHash] = dppId;
        
        emit DPPUpdated(dppId, newIpfsCid, newDataHash);
    }
    
    /**
     * @dev Deactivate a DPP
     * @param dppId The DPP ID to deactivate
     */
    function deactivateDPP(uint256 dppId) external onlyAuthorizedIssuer validDppId(dppId) {
        DPPEntry storage entry = dppEntries[dppId];
        require(entry.isActive, "DPP already inactive");
        require(entry.issuer == msg.sender || msg.sender == owner(), "Not authorized to deactivate this DPP");
        
        entry.isActive = false;
        
        emit DPPDeactivated(dppId);
    }
    
    /**
     * @dev Verify a DPP by its data hash
     * @param dataHash The hash to verify
     * @return isValid Whether the hash is valid and active
     * @return dppId The DPP ID associated with the hash
     * @return ipfsCid The IPFS CID for retrieving full data
     */
    function verifyByHash(bytes32 dataHash) external view returns (
        bool isValid,
        uint256 dppId,
        string memory ipfsCid
    ) {
        dppId = hashToDppId[dataHash];
        if (dppId == 0) {
            return (false, 0, "");
        }
        
        DPPEntry memory entry = dppEntries[dppId];
        isValid = entry.isActive;
        ipfsCid = entry.ipfsCid;
    }
    
    /**
     * @dev Verify a DPP by its IPFS CID
     * @param ipfsCid The IPFS CID to verify
     * @return isValid Whether the CID is valid and active
     * @return dppId The DPP ID associated with the CID
     * @return dataHash The data hash for integrity verification
     */
    function verifyByCid(string memory ipfsCid) external view returns (
        bool isValid,
        uint256 dppId,
        bytes32 dataHash
    ) {
        dppId = cidToDppId[ipfsCid];
        if (dppId == 0) {
            return (false, 0, bytes32(0));
        }
        
        DPPEntry memory entry = dppEntries[dppId];
        isValid = entry.isActive;
        dataHash = entry.dataHash;
    }
    
    /**
     * @dev Get DPP information by product ID
     * @param productId The product identifier
     * @return entry The complete DPP entry
     */
    function getDPPByProductId(string memory productId) external view returns (DPPEntry memory entry) {
        uint256 dppId = productToDppId[productId];
        require(dppId != 0, "No DPP found for this product");
        return dppEntries[dppId];
    }
    
    /**
     * @dev Get DPP information by DPP ID
     * @param dppId The DPP identifier
     * @return entry The complete DPP entry
     */
    function getDPP(uint256 dppId) external view validDppId(dppId) returns (DPPEntry memory entry) {
        return dppEntries[dppId];
    }
    
    /**
     * @dev Authorize a new issuer
     * @param issuer Address to authorize
     */
    function authorizeIssuer(address issuer) external onlyOwner {
        require(issuer != address(0), "Invalid issuer address");
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }
    
    /**
     * @dev Revoke issuer authorization
     * @param issuer Address to revoke
     */
    function revokeIssuer(address issuer) external onlyOwner {
        require(issuer != owner(), "Cannot revoke owner");
        authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer);
    }
    
    /**
     * @dev Get the total number of registered DPPs
     * @return count The total count
     */
    function getTotalDPPs() external view returns (uint256 count) {
        return _dppCounter.current();
    }
    
    /**
     * @dev Check if an address is an authorized issuer
     * @param issuer Address to check
     * @return isAuthorized Whether the address is authorized
     */
    function isAuthorizedIssuer(address issuer) external view returns (bool isAuthorized) {
        return authorizedIssuers[issuer] || issuer == owner();
    }
}

