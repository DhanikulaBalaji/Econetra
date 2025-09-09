from flask import Blueprint, request, jsonify, send_file
from src.models.user import db
from src.models.dpp import DigitalProductPassport
from src.models.qr_code import QRCode
import qrcode
import io
import base64
import uuid
import os

qr_codes_bp = Blueprint('qr_codes', __name__)

def generate_qr_code_image(data, size=10, border=4):
    """Generate QR code image and return as base64 string."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=size,
        border=border,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    
    img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
    return f"data:image/png;base64,{img_base64}"

@qr_codes_bp.route('/qr_codes/<dpp_id>', methods=['GET'])
def get_qr_code(dpp_id):
    """Generate and retrieve QR code for a given DPP."""
    try:
        # Check if DPP exists
        dpp = DigitalProductPassport.query.get(dpp_id)
        if not dpp:
            return jsonify({
                'success': False,
                'error': 'DPP not found'
            }), 404
        
        # Check if QR code already exists
        existing_qr = QRCode.query.filter_by(dpp_id=dpp_id).first()
        if existing_qr:
            return jsonify({
                'success': True,
                'data': existing_qr.to_dict()
            })
        
        # Generate QR code
        qr_data = dpp.dpp_url  # QR code contains the DPP verification URL
        qr_image_data = generate_qr_code_image(qr_data)
        
        # Create QR code record
        qr_code = QRCode(
            id=str(uuid.uuid4()),
            dpp_id=dpp_id,
            qr_code_image_url=qr_image_data
        )
        
        db.session.add(qr_code)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': qr_code.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@qr_codes_bp.route('/qr_codes/<dpp_id>/download', methods=['GET'])
def download_qr_code(dpp_id):
    """Download QR code as PNG file."""
    try:
        # Get QR code record
        qr_code = QRCode.query.filter_by(dpp_id=dpp_id).first()
        if not qr_code:
            return jsonify({
                'success': False,
                'error': 'QR code not found'
            }), 404
        
        # Extract base64 data
        if qr_code.qr_code_image_url.startswith('data:image/png;base64,'):
            base64_data = qr_code.qr_code_image_url.split(',')[1]
            img_data = base64.b64decode(base64_data)
            
            # Create in-memory file
            img_buffer = io.BytesIO(img_data)
            img_buffer.seek(0)
            
            return send_file(
                img_buffer,
                mimetype='image/png',
                as_attachment=True,
                download_name=f'dpp_qr_code_{dpp_id}.png'
            )
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid QR code image format'
            }), 400
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@qr_codes_bp.route('/qr_codes/batch', methods=['POST'])
def generate_batch_qr_codes():
    """Generate QR codes for multiple DPPs."""
    try:
        data = request.get_json()
        dpp_ids = data.get('dpp_ids', [])
        
        if not dpp_ids:
            return jsonify({
                'success': False,
                'error': 'No DPP IDs provided'
            }), 400
        
        results = []
        errors = []
        
        for dpp_id in dpp_ids:
            try:
                # Check if DPP exists
                dpp = DigitalProductPassport.query.get(dpp_id)
                if not dpp:
                    errors.append(f"DPP {dpp_id} not found")
                    continue
                
                # Check if QR code already exists
                existing_qr = QRCode.query.filter_by(dpp_id=dpp_id).first()
                if existing_qr:
                    results.append(existing_qr.to_dict())
                    continue
                
                # Generate QR code
                qr_data = dpp.dpp_url
                qr_image_data = generate_qr_code_image(qr_data)
                
                # Create QR code record
                qr_code = QRCode(
                    id=str(uuid.uuid4()),
                    dpp_id=dpp_id,
                    qr_code_image_url=qr_image_data
                )
                
                db.session.add(qr_code)
                results.append(qr_code.to_dict())
                
            except Exception as e:
                errors.append(f"Error processing DPP {dpp_id}: {str(e)}")
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': results,
            'errors': errors
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@qr_codes_bp.route('/qr_codes', methods=['GET'])
def get_all_qr_codes():
    """Get all QR codes with pagination."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        qr_codes = QRCode.query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'success': True,
            'data': [qr.to_dict() for qr in qr_codes.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': qr_codes.total,
                'pages': qr_codes.pages
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

