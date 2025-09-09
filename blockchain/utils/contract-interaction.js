/**
 * Contract interaction utilities for DPP Registry
 * This module provides functions to interact with the deployed smart contract
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// Contract ABI (Application Binary Interface)
const DPP_REGISTRY_ABI = [
  "function registerDPP(string memory ipfsCid, bytes32 dataHash, string memory productId, string memory supplierInfo) external returns (uint256)",
  "function verifyByHash(bytes32 dataHash) external view returns (bool isValid, uint256 dppId, string memory ipfsCid)",
  "function verifyByCid(string memory ipfsCid) external view returns (bool isValid, uint256 dppId, bytes32 dataHash)",
  "function getDPP(uint256 dppId) external view returns (tuple(string ipfsCid, bytes32 dataHash, address issuer, uint256 timestamp, bool isActive, string productId, string supplierInfo))",
  "function getDPPByProductId(string memory productId) external view returns (tuple(string ipfsCid, bytes32 dataHash, address issuer, uint256 timestamp, bool isActive, string productId, string supplierInfo))",
  "function getTotalDPPs() external view returns (uint256)",
  "function isAuthorizedIssuer(address issuer) external view returns (bool)",
  "event DPPRegistered(uint256 indexed dppId, string indexed ipfsCid, bytes32 indexed dataHash, address issuer, string productId)"
];

class DPPContractManager {
  constructor(rpcUrl, privateKey, contractAddress) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(contractAddress, DPP_REGISTRY_ABI, this.wallet);
    this.contractAddress = contractAddress;
  }

  /**
   * Register a new DPP on the blockchain
   * @param {string} ipfsCid - IPFS Content Identifier
   * @param {string} dataHash - Hash of the DPP data (hex string)
   * @param {string} productId - Unique product identifier
   * @param {string} supplierInfo - Supplier information hash
   * @returns {Promise<Object>} Transaction result with DPP ID
   */
  async registerDPP(ipfsCid, dataHash, productId, supplierInfo) {
    try {
      console.log('Registering DPP on blockchain...', { ipfsCid, productId });
      
      // Ensure dataHash is properly formatted as bytes32
      const formattedHash = dataHash.startsWith('0x') ? dataHash : `0x${dataHash}`;
      
      const tx = await this.contract.registerDPP(
        ipfsCid,
        formattedHash,
        productId,
        supplierInfo
      );
      
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      
      // Extract DPP ID from the event
      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'DPPRegistered';
        } catch {
          return false;
        }
      });
      
      let dppId = null;
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        dppId = parsed.args.dppId.toString();
      }
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        dppId: dppId,
        gasUsed: receipt.gasUsed.toString()
      };
      
    } catch (error) {
      console.error('Error registering DPP:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify a DPP by its data hash
   * @param {string} dataHash - Hash to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyByHash(dataHash) {
    try {
      const formattedHash = dataHash.startsWith('0x') ? dataHash : `0x${dataHash}`;
      const result = await this.contract.verifyByHash(formattedHash);
      
      return {
        success: true,
        isValid: result.isValid,
        dppId: result.dppId.toString(),
        ipfsCid: result.ipfsCid
      };
      
    } catch (error) {
      console.error('Error verifying DPP by hash:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify a DPP by its IPFS CID
   * @param {string} ipfsCid - IPFS CID to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyByCid(ipfsCid) {
    try {
      const result = await this.contract.verifyByCid(ipfsCid);
      
      return {
        success: true,
        isValid: result.isValid,
        dppId: result.dppId.toString(),
        dataHash: result.dataHash
      };
      
    } catch (error) {
      console.error('Error verifying DPP by CID:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get DPP information by DPP ID
   * @param {string|number} dppId - DPP identifier
   * @returns {Promise<Object>} DPP information
   */
  async getDPP(dppId) {
    try {
      const result = await this.contract.getDPP(dppId);
      
      return {
        success: true,
        data: {
          ipfsCid: result.ipfsCid,
          dataHash: result.dataHash,
          issuer: result.issuer,
          timestamp: result.timestamp.toString(),
          isActive: result.isActive,
          productId: result.productId,
          supplierInfo: result.supplierInfo
        }
      };
      
    } catch (error) {
      console.error('Error getting DPP:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get DPP information by product ID
   * @param {string} productId - Product identifier
   * @returns {Promise<Object>} DPP information
   */
  async getDPPByProductId(productId) {
    try {
      const result = await this.contract.getDPPByProductId(productId);
      
      return {
        success: true,
        data: {
          ipfsCid: result.ipfsCid,
          dataHash: result.dataHash,
          issuer: result.issuer,
          timestamp: result.timestamp.toString(),
          isActive: result.isActive,
          productId: result.productId,
          supplierInfo: result.supplierInfo
        }
      };
      
    } catch (error) {
      console.error('Error getting DPP by product ID:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get total number of registered DPPs
   * @returns {Promise<Object>} Total count
   */
  async getTotalDPPs() {
    try {
      const result = await this.contract.getTotalDPPs();
      
      return {
        success: true,
        total: result.toString()
      };
      
    } catch (error) {
      console.error('Error getting total DPPs:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if an address is an authorized issuer
   * @param {string} address - Address to check
   * @returns {Promise<Object>} Authorization status
   */
  async isAuthorizedIssuer(address) {
    try {
      const result = await this.contract.isAuthorizedIssuer(address);
      
      return {
        success: true,
        isAuthorized: result
      };
      
    } catch (error) {
      console.error('Error checking issuer authorization:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get the current wallet address
   * @returns {string} Wallet address
   */
  getWalletAddress() {
    return this.wallet.address;
  }

  /**
   * Get the contract address
   * @returns {string} Contract address
   */
  getContractAddress() {
    return this.contractAddress;
  }
}

/**
 * Create a DPP contract manager instance
 * @param {string} rpcUrl - Blockchain RPC URL
 * @param {string} privateKey - Wallet private key
 * @param {string} contractAddress - Deployed contract address
 * @returns {DPPContractManager} Contract manager instance
 */
export function createDPPContractManager(rpcUrl, privateKey, contractAddress) {
  return new DPPContractManager(rpcUrl, privateKey, contractAddress);
}

/**
 * Generate a hash for DPP data
 * @param {Object} dppData - DPP data object
 * @returns {string} Hash of the data
 */
export function generateDataHash(dppData) {
  const dataString = JSON.stringify(dppData, Object.keys(dppData).sort());
  return ethers.keccak256(ethers.toUtf8Bytes(dataString));
}

export { DPPContractManager };

