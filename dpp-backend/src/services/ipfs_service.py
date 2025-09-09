"""
IPFS Service for Digital Product Passport metadata storage
Handles uploading, retrieving, and managing DPP data on IPFS
"""

import os
import json
import hashlib
import ipfshttpclient
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
import requests
from dotenv import load_dotenv

load_dotenv()

class IPFSService:
    """Service class for IPFS operations"""
    
    def __init__(self):
        self.ipfs_api_url = os.getenv('IPFS_API_URL', '/ip4/127.0.0.1/tcp/5001')
        self.ipfs_project_id = os.getenv('IPFS_PROJECT_ID')
        self.ipfs_project_secret = os.getenv('IPFS_PROJECT_SECRET')
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize IPFS client with authentication if available"""
        try:
            if self.ipfs_project_id and self.ipfs_project_secret:
                # For Infura IPFS
                auth = (self.ipfs_project_id, self.ipfs_project_secret)
                self.client = ipfshttpclient.connect(
                    self.ipfs_api_url,
                    auth=auth
                )
            else:
                # For local IPFS node
                self.client = ipfshttpclient.connect(self.ipfs_api_url)
            
            # Test connection
            self.client.version()
            print("IPFS client initialized successfully")
            
        except Exception as e:
            print(f"Warning: Could not initialize IPFS client: {e}")
            self.client = None
    
    def upload_dpp_metadata(self, dpp_data: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Upload DPP metadata to IPFS
        
        Args:
            dpp_data: Dictionary containing DPP metadata
            
        Returns:
            Tuple of (success, cid, error_message)
        """
        try:
            if not self.client:
                return False, None, "IPFS client not initialized"
            
            # Add timestamp and version info
            metadata = {
                **dpp_data,
                "ipfs_upload_timestamp": datetime.utcnow().isoformat(),
                "ipfs_version": "1.0"
            }
            
            # Convert to JSON string
            json_data = json.dumps(metadata, indent=2, sort_keys=True)
            
            # Upload to IPFS
            result = self.client.add_json(metadata)
            cid = result
            
            print(f"Successfully uploaded DPP metadata to IPFS: {cid}")
            return True, cid, None
            
        except Exception as e:
            error_msg = f"Error uploading to IPFS: {str(e)}"
            print(error_msg)
            return False, None, error_msg
    
    def retrieve_dpp_metadata(self, cid: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Retrieve DPP metadata from IPFS
        
        Args:
            cid: IPFS Content Identifier
            
        Returns:
            Tuple of (success, metadata, error_message)
        """
        try:
            if not self.client:
                return False, None, "IPFS client not initialized"
            
            # Retrieve from IPFS
            metadata = self.client.get_json(cid)
            
            print(f"Successfully retrieved DPP metadata from IPFS: {cid}")
            return True, metadata, None
            
        except Exception as e:
            error_msg = f"Error retrieving from IPFS: {str(e)}"
            print(error_msg)
            return False, None, error_msg
    
    def pin_content(self, cid: str) -> Tuple[bool, Optional[str]]:
        """
        Pin content to ensure it stays available on IPFS
        
        Args:
            cid: IPFS Content Identifier
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            if not self.client:
                return False, "IPFS client not initialized"
            
            self.client.pin.add(cid)
            print(f"Successfully pinned content: {cid}")
            return True, None
            
        except Exception as e:
            error_msg = f"Error pinning content: {str(e)}"
            print(error_msg)
            return False, error_msg
    
    def unpin_content(self, cid: str) -> Tuple[bool, Optional[str]]:
        """
        Unpin content from IPFS
        
        Args:
            cid: IPFS Content Identifier
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            if not self.client:
                return False, "IPFS client not initialized"
            
            self.client.pin.rm(cid)
            print(f"Successfully unpinned content: {cid}")
            return True, None
            
        except Exception as e:
            error_msg = f"Error unpinning content: {str(e)}"
            print(error_msg)
            return False, error_msg
    
    def get_content_stats(self, cid: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Get statistics about IPFS content
        
        Args:
            cid: IPFS Content Identifier
            
        Returns:
            Tuple of (success, stats, error_message)
        """
        try:
            if not self.client:
                return False, None, "IPFS client not initialized"
            
            stats = self.client.object.stat(cid)
            
            return True, {
                'hash': stats['Hash'],
                'num_links': stats['NumLinks'],
                'block_size': stats['BlockSize'],
                'links_size': stats['LinksSize'],
                'data_size': stats['DataSize'],
                'cumulative_size': stats['CumulativeSize']
            }, None
            
        except Exception as e:
            error_msg = f"Error getting content stats: {str(e)}"
            print(error_msg)
            return False, None, error_msg
    
    def verify_content_integrity(self, cid: str, expected_data: Dict[str, Any]) -> Tuple[bool, bool, Optional[str]]:
        """
        Verify the integrity of content stored on IPFS
        
        Args:
            cid: IPFS Content Identifier
            expected_data: Expected data to compare against
            
        Returns:
            Tuple of (success, is_valid, error_message)
        """
        try:
            success, retrieved_data, error = self.retrieve_dpp_metadata(cid)
            
            if not success:
                return False, False, error
            
            # Remove timestamp fields for comparison
            retrieved_copy = retrieved_data.copy()
            expected_copy = expected_data.copy()
            
            retrieved_copy.pop('ipfs_upload_timestamp', None)
            retrieved_copy.pop('ipfs_version', None)
            expected_copy.pop('ipfs_upload_timestamp', None)
            expected_copy.pop('ipfs_version', None)
            
            # Compare data
            is_valid = retrieved_copy == expected_copy
            
            return True, is_valid, None
            
        except Exception as e:
            error_msg = f"Error verifying content integrity: {str(e)}"
            print(error_msg)
            return False, False, error_msg
    
    def generate_content_hash(self, data: Dict[str, Any]) -> str:
        """
        Generate a hash of the content for verification purposes
        
        Args:
            data: Data to hash
            
        Returns:
            SHA-256 hash of the data
        """
        # Create a consistent string representation
        json_str = json.dumps(data, sort_keys=True, separators=(',', ':'))
        
        # Generate SHA-256 hash
        return hashlib.sha256(json_str.encode('utf-8')).hexdigest()
    
    def get_ipfs_gateway_url(self, cid: str, gateway: str = "https://ipfs.io") -> str:
        """
        Generate IPFS gateway URL for public access
        
        Args:
            cid: IPFS Content Identifier
            gateway: IPFS gateway URL
            
        Returns:
            Full gateway URL
        """
        return f"{gateway}/ipfs/{cid}"
    
    def is_client_available(self) -> bool:
        """
        Check if IPFS client is available and working
        
        Returns:
            True if client is available, False otherwise
        """
        try:
            if not self.client:
                return False
            
            self.client.version()
            return True
            
        except Exception:
            return False

# Global IPFS service instance
ipfs_service = IPFSService()

def get_ipfs_service() -> IPFSService:
    """Get the global IPFS service instance"""
    return ipfs_service

