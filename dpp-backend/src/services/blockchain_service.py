"""
Blockchain Service for Digital Product Passport smart contract integration
Handles interaction with the DPP Registry smart contract on Polygon
"""

import os
import json
import hashlib
from typing import Dict, Any, Optional, Tuple
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()

class BlockchainService:
    """Service class for blockchain operations"""
    
    def __init__(self):
        self.rpc_url = os.getenv('POLYGON_RPC_URL', 'https://polygon-rpc.com/')
        self.private_key = os.getenv('PRIVATE_KEY')
        self.contract_address = os.getenv('CONTRACT_ADDRESS')
        
        # Initialize Web3
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        
        # Initialize account if private key is provided
        self.account = None
        if self.private_key:
            self.account = Account.from_key(self.private_key)
        
        # Contract ABI (simplified for essential functions)
        self.contract_abi = [
            {
                "inputs": [
                    {"name": "ipfsCid", "type": "string"},
                    {"name": "dataHash", "type": "bytes32"},
                    {"name": "productId", "type": "string"},
                    {"name": "supplierInfo", "type": "string"}
                ],
                "name": "registerDPP",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"name": "dataHash", "type": "bytes32"}],
                "name": "verifyByHash",
                "outputs": [
                    {"name": "isValid", "type": "bool"},
                    {"name": "dppId", "type": "uint256"},
                    {"name": "ipfsCid", "type": "string"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"name": "ipfsCid", "type": "string"}],
                "name": "verifyByCid",
                "outputs": [
                    {"name": "isValid", "type": "bool"},
                    {"name": "dppId", "type": "uint256"},
                    {"name": "dataHash", "type": "bytes32"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"name": "dppId", "type": "uint256"}],
                "name": "getDPP",
                "outputs": [{
                    "components": [
                        {"name": "ipfsCid", "type": "string"},
                        {"name": "dataHash", "type": "bytes32"},
                        {"name": "issuer", "type": "address"},
                        {"name": "timestamp", "type": "uint256"},
                        {"name": "isActive", "type": "bool"},
                        {"name": "productId", "type": "string"},
                        {"name": "supplierInfo", "type": "string"}
                    ],
                    "name": "",
                    "type": "tuple"
                }],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getTotalDPPs",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "name": "dppId", "type": "uint256"},
                    {"indexed": True, "name": "ipfsCid", "type": "string"},
                    {"indexed": True, "name": "dataHash", "type": "bytes32"},
                    {"indexed": False, "name": "issuer", "type": "address"},
                    {"indexed": False, "name": "productId", "type": "string"}
                ],
                "name": "DPPRegistered",
                "type": "event"
            }
        ]
        
        # Initialize contract
        self.contract = None
        if self.contract_address and self.w3.is_connected():
            try:
                self.contract = self.w3.eth.contract(
                    address=Web3.to_checksum_address(self.contract_address),
                    abi=self.contract_abi
                )
            except Exception as e:
                print(f"Warning: Could not initialize contract: {e}")
    
    def is_connected(self) -> bool:
        """Check if connected to blockchain"""
        return self.w3.is_connected()
    
    def get_account_address(self) -> Optional[str]:
        """Get the account address"""
        return self.account.address if self.account else None
    
    def get_balance(self) -> Optional[float]:
        """Get account balance in MATIC"""
        if not self.account or not self.is_connected():
            return None
        
        try:
            balance_wei = self.w3.eth.get_balance(self.account.address)
            return self.w3.from_wei(balance_wei, 'ether')
        except Exception as e:
            print(f"Error getting balance: {e}")
            return None
    
    def generate_data_hash(self, data: Dict[str, Any]) -> str:
        """
        Generate a hash of the DPP data for blockchain storage
        
        Args:
            data: DPP data dictionary
            
        Returns:
            Hex string of the hash
        """
        # Create a consistent string representation
        json_str = json.dumps(data, sort_keys=True, separators=(',', ':'))
        
        # Generate keccak256 hash (Ethereum standard)
        hash_bytes = Web3.keccak(text=json_str)
        return hash_bytes.hex()
    
    def register_dpp_on_blockchain(
        self, 
        ipfs_cid: str, 
        data_hash: str, 
        product_id: str, 
        supplier_info: str
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Register a DPP on the blockchain
        
        Args:
            ipfs_cid: IPFS Content Identifier
            data_hash: Hash of the DPP data
            product_id: Unique product identifier
            supplier_info: Supplier information hash
            
        Returns:
            Tuple of (success, transaction_info, error_message)
        """
        try:
            if not self.contract or not self.account:
                return False, None, "Contract or account not initialized"
            
            if not self.is_connected():
                return False, None, "Not connected to blockchain"
            
            # Prepare transaction
            function = self.contract.functions.registerDPP(
                ipfs_cid,
                Web3.to_bytes(hexstr=data_hash),
                product_id,
                supplier_info
            )
            
            # Build transaction
            transaction = function.build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 500000,  # Adjust as needed
                'gasPrice': self.w3.to_wei('20', 'gwei')  # Adjust as needed
            })
            
            # Sign transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.private_key)
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for transaction receipt
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Extract DPP ID from logs
            dpp_id = None
            for log in tx_receipt.logs:
                try:
                    decoded_log = self.contract.events.DPPRegistered().process_log(log)
                    dpp_id = decoded_log['args']['dppId']
                    break
                except:
                    continue
            
            transaction_info = {
                'transaction_hash': tx_hash.hex(),
                'block_number': tx_receipt.blockNumber,
                'gas_used': tx_receipt.gasUsed,
                'dpp_id': dpp_id,
                'status': tx_receipt.status
            }
            
            print(f"Successfully registered DPP on blockchain: {tx_hash.hex()}")
            return True, transaction_info, None
            
        except Exception as e:
            error_msg = f"Error registering DPP on blockchain: {str(e)}"
            print(error_msg)
            return False, None, error_msg
    
    def verify_dpp_by_hash(self, data_hash: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Verify a DPP by its data hash
        
        Args:
            data_hash: Hash to verify
            
        Returns:
            Tuple of (success, verification_result, error_message)
        """
        try:
            if not self.contract:
                return False, None, "Contract not initialized"
            
            if not self.is_connected():
                return False, None, "Not connected to blockchain"
            
            # Call contract function
            result = self.contract.functions.verifyByHash(
                Web3.to_bytes(hexstr=data_hash)
            ).call()
            
            verification_result = {
                'is_valid': result[0],
                'dpp_id': result[1],
                'ipfs_cid': result[2]
            }
            
            return True, verification_result, None
            
        except Exception as e:
            error_msg = f"Error verifying DPP by hash: {str(e)}"
            print(error_msg)
            return False, None, error_msg
    
    def verify_dpp_by_cid(self, ipfs_cid: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Verify a DPP by its IPFS CID
        
        Args:
            ipfs_cid: IPFS CID to verify
            
        Returns:
            Tuple of (success, verification_result, error_message)
        """
        try:
            if not self.contract:
                return False, None, "Contract not initialized"
            
            if not self.is_connected():
                return False, None, "Not connected to blockchain"
            
            # Call contract function
            result = self.contract.functions.verifyByCid(ipfs_cid).call()
            
            verification_result = {
                'is_valid': result[0],
                'dpp_id': result[1],
                'data_hash': result[2].hex()
            }
            
            return True, verification_result, None
            
        except Exception as e:
            error_msg = f"Error verifying DPP by CID: {str(e)}"
            print(error_msg)
            return False, None, error_msg
    
    def get_dpp_from_blockchain(self, dpp_id: int) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Get DPP information from blockchain
        
        Args:
            dpp_id: DPP identifier
            
        Returns:
            Tuple of (success, dpp_info, error_message)
        """
        try:
            if not self.contract:
                return False, None, "Contract not initialized"
            
            if not self.is_connected():
                return False, None, "Not connected to blockchain"
            
            # Call contract function
            result = self.contract.functions.getDPP(dpp_id).call()
            
            dpp_info = {
                'ipfs_cid': result[0],
                'data_hash': result[1].hex(),
                'issuer': result[2],
                'timestamp': result[3],
                'is_active': result[4],
                'product_id': result[5],
                'supplier_info': result[6]
            }
            
            return True, dpp_info, None
            
        except Exception as e:
            error_msg = f"Error getting DPP from blockchain: {str(e)}"
            print(error_msg)
            return False, None, error_msg
    
    def get_total_dpps(self) -> Tuple[bool, Optional[int], Optional[str]]:
        """
        Get total number of DPPs registered
        
        Returns:
            Tuple of (success, total_count, error_message)
        """
        try:
            if not self.contract:
                return False, None, "Contract not initialized"
            
            if not self.is_connected():
                return False, None, "Not connected to blockchain"
            
            # Call contract function
            total = self.contract.functions.getTotalDPPs().call()
            
            return True, total, None
            
        except Exception as e:
            error_msg = f"Error getting total DPPs: {str(e)}"
            print(error_msg)
            return False, None, error_msg

# Global blockchain service instance
blockchain_service = BlockchainService()

def get_blockchain_service() -> BlockchainService:
    """Get the global blockchain service instance"""
    return blockchain_service

