"""
GDPR Compliance API Routes
Handles data privacy, consent management, and user rights
"""

from flask import Blueprint, request, jsonify, g
from src.models.user import db, User
from src.middleware.security import GDPRCompliance, DataProcessor, require_consent, sanitize_output
from datetime import datetime, timedelta
import uuid
import json

gdpr_bp = Blueprint('gdpr', __name__)

@gdpr_bp.route('/api/gdpr/consent', methods=['POST'])
def manage_consent():
    """Manage user consent for data processing"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'consent_type', 'granted']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        user_id = data['user_id']
        consent_type = data['consent_type']
        granted = data['granted']
        
        # Validate consent type
        valid_consent_types = [
            'data_processing', 'marketing', 'analytics', 
            'third_party_sharing', 'automated_decision_making'
        ]
        
        if consent_type not in valid_consent_types:
            return jsonify({
                'success': False,
                'error': 'Invalid consent type'
            }), 400
        
        # Create consent record
        consent_record = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'consent_type': consent_type,
            'granted': granted,
            'timestamp': datetime.utcnow().isoformat(),
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', ''),
            'method': 'api_request'
        }
        
        # In production, store in dedicated consent table
        # For now, we'll simulate storage
        
        return jsonify({
            'success': True,
            'data': consent_record,
            'message': f'Consent {consent_type} {"granted" if granted else "withdrawn"} successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@gdpr_bp.route('/api/gdpr/consent/<user_id>', methods=['GET'])
def get_user_consent(user_id):
    """Get user's current consent status"""
    try:
        # In production, fetch from consent database
        # Mock consent data for demonstration
        consent_data = {
            'user_id': user_id,
            'consents': {
                'data_processing': {
                    'granted': True,
                    'timestamp': '2025-01-15T10:30:00Z',
                    'required': True
                },
                'marketing': {
                    'granted': False,
                    'timestamp': '2025-01-15T10:30:00Z',
                    'required': False
                },
                'analytics': {
                    'granted': True,
                    'timestamp': '2025-01-15T10:30:00Z',
                    'required': False
                },
                'third_party_sharing': {
                    'granted': False,
                    'timestamp': None,
                    'required': False
                },
                'automated_decision_making': {
                    'granted': False,
                    'timestamp': None,
                    'required': False
                }
            },
            'last_updated': '2025-01-15T10:30:00Z'
        }
        
        return jsonify({
            'success': True,
            'data': consent_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@gdpr_bp.route('/api/gdpr/data-export/<user_id>', methods=['POST'])
@require_consent('data_processing')
def export_user_data(user_id):
    """Export all user data (Right to Data Portability)"""
    try:
        # Verify user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        # Generate comprehensive data export
        export_data = DataProcessor.export_user_data(user_id)
        
        # Add actual user data
        export_data['user_profile'] = sanitize_output(user.to_dict(), 'user')
        
        # Add related data (products, DPPs, etc.)
        # In production, collect from all relevant tables
        export_data['products'] = []  # Fetch user's products
        export_data['dpps'] = []      # Fetch user's DPPs
        export_data['qr_codes'] = []  # Fetch user's QR codes
        export_data['audit_logs'] = [] # Fetch user's audit logs (last 90 days)
        
        # Create export record
        export_record = {
            'export_id': str(uuid.uuid4()),
            'user_id': user_id,
            'requested_at': datetime.utcnow().isoformat(),
            'status': 'completed',
            'format': 'JSON',
            'size_bytes': len(json.dumps(export_data)),
            'expires_at': (datetime.utcnow() + timedelta(days=30)).isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': {
                'export_record': export_record,
                'download_data': export_data
            },
            'message': 'Data export completed successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@gdpr_bp.route('/api/gdpr/data-deletion/<user_id>', methods=['DELETE'])
def delete_user_data(user_id):
    """Delete user data (Right to Erasure)"""
    try:
        # Verify user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        # Check if user has active DPPs that need to be preserved for compliance
        # In production, check business requirements for data retention
        
        deletion_reason = request.args.get('reason', 'user_request')
        
        # Perform data deletion
        deletion_record = DataProcessor.delete_user_data(user_id, deletion_reason)
        
        # In production, implement actual deletion logic:
        # 1. Anonymize or delete user profile
        # 2. Handle related data based on business rules
        # 3. Preserve data required for legal compliance
        # 4. Update consent records
        
        # For demonstration, we'll mark user as deleted
        user.status = 'deleted'
        user.email = f"deleted_{user_id}@anonymized.local"
        user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': deletion_record,
            'message': 'User data deletion completed successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@gdpr_bp.route('/api/gdpr/data-rectification/<user_id>', methods=['PUT'])
@require_consent('data_processing')
def rectify_user_data(user_id):
    """Rectify/correct user data (Right to Rectification)"""
    try:
        # Verify user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        data = request.get_json()
        corrections = data.get('corrections', {})
        
        if not corrections:
            return jsonify({
                'success': False,
                'error': 'No corrections provided'
            }), 400
        
        # Track changes for audit
        changes_made = []
        
        # Apply corrections
        correctable_fields = ['email', 'company_name', 'role']
        for field, new_value in corrections.items():
            if field in correctable_fields and hasattr(user, field):
                old_value = getattr(user, field)
                setattr(user, field, new_value)
                changes_made.append({
                    'field': field,
                    'old_value': old_value,
                    'new_value': new_value
                })
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Create rectification record
        rectification_record = {
            'rectification_id': str(uuid.uuid4()),
            'user_id': user_id,
            'requested_at': datetime.utcnow().isoformat(),
            'changes_made': changes_made,
            'status': 'completed'
        }
        
        return jsonify({
            'success': True,
            'data': rectification_record,
            'message': 'Data rectification completed successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@gdpr_bp.route('/api/gdpr/processing-activities', methods=['GET'])
def get_processing_activities():
    """Get data processing activities (Transparency)"""
    try:
        processing_activities = {
            'controller': {
                'name': 'Econetra DPP Platform',
                'contact': 'privacy@econetra.com',
                'dpo_contact': 'dpo@econetra.com'
            },
            'activities': [
                {
                    'purpose': 'User Account Management',
                    'legal_basis': 'Contract performance',
                    'data_categories': ['Identity data', 'Contact data'],
                    'retention_period': '2 years after account closure',
                    'recipients': ['Internal staff', 'IT service providers']
                },
                {
                    'purpose': 'Digital Product Passport Creation',
                    'legal_basis': 'Contract performance',
                    'data_categories': ['Product data', 'Supply chain data'],
                    'retention_period': '10 years (compliance requirement)',
                    'recipients': ['Blockchain network', 'IPFS network']
                },
                {
                    'purpose': 'Compliance Monitoring',
                    'legal_basis': 'Legal obligation',
                    'data_categories': ['Audit logs', 'Transaction records'],
                    'retention_period': '7 years',
                    'recipients': ['Regulatory authorities (upon request)']
                },
                {
                    'purpose': 'Service Improvement',
                    'legal_basis': 'Legitimate interest',
                    'data_categories': ['Usage analytics', 'Performance metrics'],
                    'retention_period': '2 years',
                    'recipients': ['Analytics service providers']
                }
            ],
            'rights': [
                'Right to access',
                'Right to rectification',
                'Right to erasure',
                'Right to restrict processing',
                'Right to data portability',
                'Right to object',
                'Rights related to automated decision making'
            ],
            'last_updated': '2025-01-15T00:00:00Z'
        }
        
        return jsonify({
            'success': True,
            'data': processing_activities
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@gdpr_bp.route('/api/gdpr/privacy-policy', methods=['GET'])
def get_privacy_policy():
    """Get current privacy policy"""
    try:
        privacy_policy = {
            'version': '1.0',
            'effective_date': '2025-01-15',
            'last_updated': '2025-01-15',
            'sections': {
                'data_collection': {
                    'title': 'Data We Collect',
                    'content': 'We collect information you provide directly, usage data, and technical data necessary for service provision.'
                },
                'data_use': {
                    'title': 'How We Use Your Data',
                    'content': 'We use your data to provide DPP services, ensure compliance, and improve our platform.'
                },
                'data_sharing': {
                    'title': 'Data Sharing',
                    'content': 'We share data only as necessary for service provision and compliance with legal obligations.'
                },
                'data_security': {
                    'title': 'Data Security',
                    'content': 'We implement appropriate technical and organizational measures to protect your data.'
                },
                'your_rights': {
                    'title': 'Your Rights',
                    'content': 'You have rights to access, rectify, erase, restrict, port, and object to processing of your data.'
                },
                'contact': {
                    'title': 'Contact Information',
                    'content': 'For privacy-related inquiries, contact privacy@econetra.com'
                }
            }
        }
        
        return jsonify({
            'success': True,
            'data': privacy_policy
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@gdpr_bp.route('/api/gdpr/data-breach', methods=['POST'])
def report_data_breach():
    """Report a data breach (Internal use)"""
    try:
        data = request.get_json()
        
        # Create breach report
        breach_report = {
            'breach_id': str(uuid.uuid4()),
            'reported_at': datetime.utcnow().isoformat(),
            'severity': data.get('severity', 'medium'),
            'description': data.get('description', ''),
            'affected_users': data.get('affected_users', 0),
            'data_categories': data.get('data_categories', []),
            'containment_measures': data.get('containment_measures', []),
            'notification_required': data.get('notification_required', True),
            'status': 'reported'
        }
        
        # In production, implement proper breach handling:
        # 1. Immediate containment
        # 2. Risk assessment
        # 3. Notification to authorities (72 hours)
        # 4. User notification if high risk
        # 5. Documentation and follow-up
        
        return jsonify({
            'success': True,
            'data': breach_report,
            'message': 'Data breach reported successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

