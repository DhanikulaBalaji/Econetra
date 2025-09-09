from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.product import Product
from src.models.dpp import DigitalProductPassport
from src.config.supabase_client import supabase_client
import uuid
import json
from datetime import datetime

dpps_bp = Blueprint('dpps', __name__)

def generate_json_ld_data(product, dpp_id):
    """Generate JSON-LD formatted data for the DPP."""
    base_url = "https://econetra.com/dpp"
    
    json_ld = {
        "@context": [
            "https://www.w3.org/ns/credentials/v1",
            "https://test.uncefact.org/vocabulary/untp/dpp/0.5.0/",
            {
                "dpp": "https://test.uncefact.org/vocabulary/untp/dpp/0.5.0/",
                "gs1": "https://gs1.org/voc/",
                "epcis": "https://ref.gs1.org/epcis/"
            }
        ],
        "@type": "DigitalProductPassport",
        "@id": f"{base_url}/{dpp_id}",
        "dpp:productIdentifier": {
            "@type": "gs1:GTIN",
            "@value": product.gtin or f"TEMP-{product.id}"
        },
        "dpp:productName": product.product_name,
        "dpp:productDescription": product.description,
        "dpp:materialComposition": product.material_composition or {},
        "dpp:productionLocation": product.production_location,
        "dpp:productionDate": product.production_date.isoformat() if product.production_date else None,
        "dpp:supplier": {
            "@type": "Organization",
            "@id": product.supplier_id,
            "name": "Textile Supplier"  # This would come from user data
        },
        "dpp:sustainability": {
            "carbonFootprint": "TBD",
            "recyclability": "TBD",
            "certifications": []
        },
        "dpp:traceability": {
            "supplyChainEvents": [],
            "epcisEvents": []
        },
        "dpp:compliance": {
            "euRegulations": ["ESPR", "DPP Delegated Act"],
            "standards": ["JSON-LD", "GS1 Digital Link", "EPCIS 2.0"]
        },
        "dpp:issuedAt": datetime.utcnow().isoformat(),
        "dpp:version": "1.0"
    }
    
    return json_ld

@dpps_bp.route('/dpps', methods=['GET'])
def get_dpps():
    """Get all DPPs with optional filtering and pagination."""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        product_id = request.args.get('product_id')
        
        # Build query
        query = DigitalProductPassport.query
        
        if product_id:
            query = query.filter(DigitalProductPassport.product_id == product_id)
        
        # Paginate results
        dpps = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'success': True,
            'data': [dpp.to_dict() for dpp in dpps.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': dpps.total,
                'pages': dpps.pages
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@dpps_bp.route('/dpps/<dpp_id>', methods=['GET'])
def get_dpp(dpp_id):
    """Get a specific DPP by ID."""
    try:
        dpp = DigitalProductPassport.query.get(dpp_id)
        
        if not dpp:
            return jsonify({
                'success': False,
                'error': 'DPP not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': dpp.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@dpps_bp.route('/dpps/public/<dpp_id>', methods=['GET'])
def get_public_dpp(dpp_id):
    """Public endpoint to get DPP details for verification."""
    try:
        dpp = DigitalProductPassport.query.get(dpp_id)
        
        if not dpp:
            return jsonify({
                'success': False,
                'error': 'DPP not found'
            }), 404
        
        # Get associated product information
        product = Product.query.get(dpp.product_id)
        
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
            'issued_at': dpp.issued_at.isoformat() if dpp.issued_at else None,
            'verification_status': 'verified'  # This would be checked against blockchain
        }
        
        return jsonify({
            'success': True,
            'data': public_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@dpps_bp.route('/dpps', methods=['POST'])
def create_dpp():
    """Create a new DPP for a product."""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'product_id' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: product_id'
            }), 400
        
        # Check if product exists
        product = Product.query.get(data['product_id'])
        if not product:
            return jsonify({
                'success': False,
                'error': 'Product not found'
            }), 404
        
        # Check if DPP already exists for this product
        existing_dpp = DigitalProductPassport.query.filter_by(product_id=data['product_id']).first()
        if existing_dpp:
            return jsonify({
                'success': False,
                'error': 'DPP already exists for this product'
            }), 400
        
        # Generate DPP ID
        dpp_id = str(uuid.uuid4())
        
        # Generate JSON-LD data
        json_ld_data = generate_json_ld_data(product, dpp_id)
        
        # Create DPP URL
        dpp_url = f"https://econetra.com/verify/{dpp_id}"
        
        # Generate GS1 Digital Link (simplified)
        gs1_digital_link = f"https://id.gs1.org/01/{product.gtin or 'TEMP' + product.id}/10/LOT123?linkType=gs1:pip"
        
        # TODO: Upload to IPFS and get CID
        ipfs_cid = f"Qm{uuid.uuid4().hex[:40]}"  # Placeholder
        
        # TODO: Store hash on blockchain
        blockchain_hash = f"0x{uuid.uuid4().hex}"  # Placeholder
        
        # Create new DPP
        dpp = DigitalProductPassport(
            id=dpp_id,
            product_id=data['product_id'],
            dpp_url=dpp_url,
            ipfs_cid=ipfs_cid,
            blockchain_hash=blockchain_hash,
            gs1_digital_link=gs1_digital_link,
            epcis_events=data.get('epcis_events', []),
            json_ld_data=json_ld_data
        )
        
        db.session.add(dpp)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': dpp.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@dpps_bp.route('/dpps/verify/<blockchain_hash>', methods=['GET'])
def verify_dpp(blockchain_hash):
    """Verify DPP authenticity using blockchain hash."""
    try:
        dpp = DigitalProductPassport.query.filter_by(blockchain_hash=blockchain_hash).first()
        
        if not dpp:
            return jsonify({
                'success': False,
                'error': 'DPP not found',
                'verified': False
            }), 404
        
        # TODO: Verify against blockchain
        verification_result = {
            'verified': True,
            'blockchain_hash': blockchain_hash,
            'ipfs_cid': dpp.ipfs_cid,
            'dpp_id': dpp.id,
            'verification_timestamp': datetime.utcnow().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': verification_result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

