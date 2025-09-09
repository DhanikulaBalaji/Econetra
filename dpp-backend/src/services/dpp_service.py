"""
Integrated DPP Service
Combines IPFS storage and blockchain verification for complete DPP management
"""

import uuid
import json
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
from src.services.ipfs_service import get_ipfs_service
from src.services.blockchain_service import get_blockchain_service
from src.models.user import db
from src.models.product import Product
from src.models.dpp import DigitalProductPassport

class DPPService:
    """Integrated service for DPP operations"""
    
    def __init__(self):
        self.ipfs_service = get_ipfs_service()
        self.blockchain_service = get_blockchain_service()
    
    def generate_json_ld_metadata(self, product: Product, dpp_id: str) -> Dict[str, Any]:
        """
        Generate JSON-LD formatted metadata for the DPP
        
        Args:
            product: Product instance
            dpp_id: DPP identifier
            
        Returns:
            JSON-LD formatted metadata
        """
        base_url = "https://econetra.com/dpp"
        
        json_ld = {
            "@context": [
                "https://www.w3.org/ns/credentials/v1",
                "https://test.uncefact.org/vocabulary/untp/dpp/0.5.0/",
                {
                    "dpp": "https://test.uncefact.org/vocabulary/untp/dpp/0.5.0/",
                    "gs1": "https://gs1.org/voc/",
                    "epcis": "https://ref.gs1.org/epcis/",
                    "schema": "https://schema.org/"
                }
            ],
            "@type": "DigitalProductPassport",
            "@id": f"{base_url}/{dpp_id}",
            "dpp:productIdentifier": {
                "@type": "gs1:GTIN",
                "@value": product.gtin or f"ECONETRA-{product.id}"
            },
            "dpp:productName": product.product_name,
            "dpp:productDescription": product.description,
            "dpp:materialComposition": product.material_composition or {},
            "dpp:productionLocation": {
                "@type": "schema:Place",
                "schema:name": product.production_location or "Tiruppur, India"
            },
            "dpp:productionDate": product.production_date.isoformat() if product.production_date else None,
            "dpp:supplier": {
                "@type": "schema:Organization",
                "@id": f"urn:supplier:{product.supplier_id}",
                "schema:name": "Textile Supplier",
                "schema:location": "Tiruppur, India"
            },
            "dpp:sustainability": {
                "dpp:carbonFootprint": {
                    "@type": "schema:QuantitativeValue",
                    "schema:value": "TBD",
                    "schema:unitCode": "KGM"
                },
                "dpp:recyclability": "TBD",
                "dpp:certifications": [],
                "dpp:waterUsage": {
                    "@type": "schema:QuantitativeValue",
                    "schema:value": "TBD",
                    "schema:unitCode": "LTR"
                }
            },
            "dpp:traceability": {
                "dpp:supplyChainEvents": [],
                "epcis:events": []
            },
            "dpp:compliance": {
                "dpp:euRegulations": ["ESPR", "DPP Delegated Act"],
                "dpp:standards": ["JSON-LD", "GS1 Digital Link", "EPCIS 2.0"],
                "dpp:certificationBodies": []
            },
            "dpp:digitalSignature": {
                "@type": "dpp:CryptographicSignature",
                "dpp:signatureMethod": "blockchain",
                "dpp:blockchain": "Polygon",
                "dpp:contractAddress": self.blockchain_service.contract_address
            },
            "dpp:issuedAt": datetime.utcnow().isoformat(),
            "dpp:version": "1.0",
            "dpp:issuer": {
                "@type": "schema:Organization",
                "schema:name": "Econetra DPP Platform",
                "schema:url": "https://econetra.com"
            }
        }
        
        return json_ld
    
    def create_complete_dpp(
        self, 
        product_id: str, 
        epcis_events: Optional[list] = None
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Create a complete DPP with IPFS storage and blockchain registration
        
        Args:
            product_id: Product identifier
            epcis_events: Optional EPCIS events list
            
        Returns:
            Tuple of (success, dpp_data, error_message)
        """
        try:
            # Get product
            product = Product.query.get(product_id)
            if not product:
                return False, None, "Product not found"
            
            # Check if DPP already exists
            existing_dpp = DigitalProductPassport.query.filter_by(product_id=product_id).first()
            if existing_dpp:
                return False, None, "DPP already exists for this product"
            
            # Generate DPP ID
            dpp_id = str(uuid.uuid4())
            
            # Generate JSON-LD metadata
            json_ld_data = self.generate_json_ld_metadata(product, dpp_id)
            
            # Add EPCIS events if provided
            if epcis_events:
                json_ld_data["dpp:traceability"]["epcis:events"] = epcis_events
            
            # Upload to IPFS
            ipfs_success, ipfs_cid, ipfs_error = self.ipfs_service.upload_dpp_metadata(json_ld_data)
            if not ipfs_success:
                return False, None, f"IPFS upload failed: {ipfs_error}"
            
            # Generate data hash for blockchain
            data_hash = self.blockchain_service.generate_data_hash(json_ld_data)
            
            # Register on blockchain
            blockchain_success, tx_info, blockchain_error = self.blockchain_service.register_dpp_on_blockchain(
                ipfs_cid,
                data_hash,
                product_id,
                f"supplier:{product.supplier_id}"
            )
            
            if not blockchain_success:
                # If blockchain fails, we still have IPFS data
                print(f"Blockchain registration failed: {blockchain_error}")
                blockchain_hash = f"0x{data_hash}"  # Use data hash as fallback
                tx_info = {'transaction_hash': blockchain_hash}
            else:
                blockchain_hash = tx_info['transaction_hash']
            
            # Create DPP URL
            dpp_url = f"https://econetra.com/verify/{dpp_id}"
            
            # Generate GS1 Digital Link
            gs1_digital_link = f"https://id.gs1.org/01/{product.gtin or 'ECONETRA' + product.id}/10/LOT123?linkType=gs1:pip"
            
            # Create DPP record in database
            dpp = DigitalProductPassport(
                id=dpp_id,
                product_id=product_id,
                dpp_url=dpp_url,
                ipfs_cid=ipfs_cid,
                blockchain_hash=blockchain_hash,
                gs1_digital_link=gs1_digital_link,
                epcis_events=epcis_events or [],
                json_ld_data=json_ld_data
            )
            
            db.session.add(dpp)
            db.session.commit()
            
            # Pin content on IPFS
            self.ipfs_service.pin_content(ipfs_cid)
            
            result_data = {
                'dpp_id': dpp_id,
                'ipfs_cid': ipfs_cid,
                'blockchain_hash': blockchain_hash,
                'dpp_url': dpp_url,
                'gs1_digital_link': gs1_digital_link,
                'json_ld_data': json_ld_data,
                'blockchain_success': blockchain_success,
                'transaction_info': tx_info
            }
            
            return True, result_data, None
            
        except Exception as e:
            db.session.rollback()
            error_msg = f"Error creating DPP: {str(e)}"
            print(error_msg)
            return False, None, error_msg
    
    def verify_dpp_integrity(self, dpp_id: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Verify the integrity of a DPP across IPFS and blockchain
        
        Args:
            dpp_id: DPP identifier
            
        Returns:
            Tuple of (success, verification_result, error_message)
        """
        try:
            # Get DPP from database
            dpp = DigitalProductPassport.query.get(dpp_id)
            if not dpp:
                return False, None, "DPP not found"
            
            verification_result = {
                'dpp_id': dpp_id,
                'database_check': True,
                'ipfs_check': False,
                'blockchain_check': False,
                'data_integrity': False,
                'overall_valid': False
            }
            
            # Verify IPFS content
            ipfs_success, ipfs_data, ipfs_error = self.ipfs_service.retrieve_dpp_metadata(dpp.ipfs_cid)
            if ipfs_success:
                verification_result['ipfs_check'] = True
                
                # Check data integrity
                integrity_success, is_valid, integrity_error = self.ipfs_service.verify_content_integrity(
                    dpp.ipfs_cid, 
                    dpp.json_ld_data
                )
                if integrity_success and is_valid:
                    verification_result['data_integrity'] = True
            
            # Verify blockchain record
            blockchain_success, blockchain_data, blockchain_error = self.blockchain_service.verify_dpp_by_cid(dpp.ipfs_cid)
            if blockchain_success and blockchain_data['is_valid']:
                verification_result['blockchain_check'] = True
            
            # Overall validity
            verification_result['overall_valid'] = (
                verification_result['database_check'] and
                verification_result['ipfs_check'] and
                verification_result['data_integrity'] and
                verification_result['blockchain_check']
            )
            
            return True, verification_result, None
            
        except Exception as e:
            error_msg = f"Error verifying DPP integrity: {str(e)}"
            print(error_msg)
            return False, None, error_msg
    
    def get_dpp_public_data(self, dpp_id: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Get public DPP data for verification portal
        
        Args:
            dpp_id: DPP identifier
            
        Returns:
            Tuple of (success, public_data, error_message)
        """
        try:
            # Get DPP from database
            dpp = DigitalProductPassport.query.get(dpp_id)
            if not dpp:
                return False, None, "DPP not found"
            
            # Get associated product
            product = Product.query.get(dpp.product_id)
            
            # Verify integrity
            verification_success, verification_result, _ = self.verify_dpp_integrity(dpp_id)
            
            public_data = {
                'dpp_id': dpp.id,
                'product_name': product.product_name if product else 'Unknown',
                'product_description': product.description if product else None,
                'material_composition': product.material_composition if product else {},
                'production_location': product.production_location if product else None,
                'production_date': product.production_date.isoformat() if product and product.production_date else None,
                'json_ld_data': dpp.json_ld_data,
                'gs1_digital_link': dpp.gs1_digital_link,
                'blockchain_hash': dpp.blockchain_hash,
                'ipfs_cid': dpp.ipfs_cid,
                'ipfs_gateway_url': self.ipfs_service.get_ipfs_gateway_url(dpp.ipfs_cid),
                'issued_at': dpp.issued_at.isoformat() if dpp.issued_at else None,
                'verification_status': verification_result if verification_success else {'overall_valid': False},
                'compliance_info': {
                    'eu_regulations': ['ESPR', 'DPP Delegated Act'],
                    'standards': ['JSON-LD', 'GS1 Digital Link', 'EPCIS 2.0'],
                    'blockchain_network': 'Polygon'
                }
            }
            
            return True, public_data, None
            
        except Exception as e:
            error_msg = f"Error getting public DPP data: {str(e)}"
            print(error_msg)
            return False, None, error_msg
    
    def update_dpp_metadata(
        self, 
        dpp_id: str, 
        updated_data: Dict[str, Any]
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Update DPP metadata (creates new version)
        
        Args:
            dpp_id: DPP identifier
            updated_data: Updated metadata
            
        Returns:
            Tuple of (success, update_result, error_message)
        """
        try:
            # Get existing DPP
            dpp = DigitalProductPassport.query.get(dpp_id)
            if not dpp:
                return False, None, "DPP not found"
            
            # Merge updated data with existing JSON-LD
            updated_json_ld = {**dpp.json_ld_data, **updated_data}
            updated_json_ld['dpp:updatedAt'] = datetime.utcnow().isoformat()
            
            # Upload new version to IPFS
            ipfs_success, new_ipfs_cid, ipfs_error = self.ipfs_service.upload_dpp_metadata(updated_json_ld)
            if not ipfs_success:
                return False, None, f"IPFS upload failed: {ipfs_error}"
            
            # Generate new data hash
            new_data_hash = self.blockchain_service.generate_data_hash(updated_json_ld)
            
            # Update database record
            dpp.ipfs_cid = new_ipfs_cid
            dpp.json_ld_data = updated_json_ld
            dpp.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            # Pin new content
            self.ipfs_service.pin_content(new_ipfs_cid)
            
            update_result = {
                'dpp_id': dpp_id,
                'new_ipfs_cid': new_ipfs_cid,
                'new_data_hash': new_data_hash,
                'updated_at': dpp.updated_at.isoformat()
            }
            
            return True, update_result, None
            
        except Exception as e:
            db.session.rollback()
            error_msg = f"Error updating DPP metadata: {str(e)}"
            print(error_msg)
            return False, None, error_msg

# Global DPP service instance
dpp_service = DPPService()

def get_dpp_service() -> DPPService:
    """Get the global DPP service instance"""
    return dpp_service

