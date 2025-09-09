"""
Security Middleware for GDPR Compliance and Data Protection
"""

from flask import request, jsonify, g
from functools import wraps
import re
import hashlib
import hmac
import time
from datetime import datetime, timedelta
import logging

# Configure logging for security events
security_logger = logging.getLogger('security')
security_logger.setLevel(logging.INFO)

class SecurityMiddleware:
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        app.before_request(self.before_request)
        app.after_request(self.after_request)
    
    def before_request(self):
        """Security checks before processing requests"""
        # Rate limiting check
        if not self.check_rate_limit():
            return jsonify({
                'success': False,
                'error': 'Rate limit exceeded. Please try again later.'
            }), 429
        
        # Input validation
        if request.method in ['POST', 'PUT', 'PATCH']:
            if not self.validate_input():
                return jsonify({
                    'success': False,
                    'error': 'Invalid input detected'
                }), 400
        
        # Log security event
        self.log_security_event('request', {
            'ip': request.remote_addr,
            'method': request.method,
            'path': request.path,
            'user_agent': request.headers.get('User-Agent', '')
        })
    
    def after_request(self, response):
        """Add security headers to responses"""
        # GDPR compliance headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Privacy headers
        response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        return response
    
    def check_rate_limit(self):
        """Simple rate limiting implementation"""
        # In production, use Redis or similar for distributed rate limiting
        client_ip = request.remote_addr
        current_time = time.time()
        
        # Allow 100 requests per minute per IP
        if not hasattr(g, 'rate_limit_store'):
            g.rate_limit_store = {}
        
        if client_ip not in g.rate_limit_store:
            g.rate_limit_store[client_ip] = []
        
        # Clean old requests (older than 1 minute)
        g.rate_limit_store[client_ip] = [
            req_time for req_time in g.rate_limit_store[client_ip]
            if current_time - req_time < 60
        ]
        
        # Check if limit exceeded
        if len(g.rate_limit_store[client_ip]) >= 100:
            return False
        
        # Add current request
        g.rate_limit_store[client_ip].append(current_time)
        return True
    
    def validate_input(self):
        """Validate input for common security issues"""
        try:
            if request.is_json:
                data = request.get_json()
                if data:
                    return self.validate_json_data(data)
            
            # Validate form data
            for key, value in request.form.items():
                if not self.validate_field(key, value):
                    return False
            
            return True
        except Exception:
            return False
    
    def validate_json_data(self, data):
        """Validate JSON data recursively"""
        if isinstance(data, dict):
            for key, value in data.items():
                if not self.validate_field(key, value):
                    return False
                if isinstance(value, (dict, list)):
                    if not self.validate_json_data(value):
                        return False
        elif isinstance(data, list):
            for item in data:
                if not self.validate_json_data(item):
                    return False
        
        return True
    
    def validate_field(self, key, value):
        """Validate individual field for security issues"""
        if not isinstance(value, str):
            return True
        
        # Check for SQL injection patterns
        sql_patterns = [
            r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)",
            r"(--|#|/\*|\*/)",
            r"(\b(OR|AND)\s+\d+\s*=\s*\d+)",
            r"(\bUNION\s+SELECT\b)"
        ]
        
        for pattern in sql_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                self.log_security_event('sql_injection_attempt', {
                    'field': key,
                    'value': value[:100],  # Log first 100 chars only
                    'ip': request.remote_addr
                })
                return False
        
        # Check for XSS patterns
        xss_patterns = [
            r"<script[^>]*>.*?</script>",
            r"javascript:",
            r"on\w+\s*=",
            r"<iframe[^>]*>",
            r"<object[^>]*>",
            r"<embed[^>]*>"
        ]
        
        for pattern in xss_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                self.log_security_event('xss_attempt', {
                    'field': key,
                    'value': value[:100],
                    'ip': request.remote_addr
                })
                return False
        
        return True
    
    def log_security_event(self, event_type, details):
        """Log security events for monitoring"""
        security_logger.info(f"Security Event: {event_type}", extra={
            'event_type': event_type,
            'timestamp': datetime.utcnow().isoformat(),
            'details': details
        })

class GDPRCompliance:
    """GDPR Compliance utilities"""
    
    @staticmethod
    def anonymize_data(data, fields_to_anonymize):
        """Anonymize sensitive data fields"""
        if isinstance(data, dict):
            anonymized = data.copy()
            for field in fields_to_anonymize:
                if field in anonymized:
                    if isinstance(anonymized[field], str):
                        anonymized[field] = GDPRCompliance.hash_field(anonymized[field])
                    else:
                        anonymized[field] = "[ANONYMIZED]"
            return anonymized
        return data
    
    @staticmethod
    def hash_field(value):
        """Hash sensitive field values"""
        return hashlib.sha256(value.encode()).hexdigest()[:16] + "..."
    
    @staticmethod
    def validate_consent(user_id, consent_type):
        """Validate user consent for data processing"""
        # In production, check against consent database
        # For now, return True (implement proper consent management)
        return True
    
    @staticmethod
    def get_data_retention_period(data_type):
        """Get data retention period based on data type"""
        retention_periods = {
            'user_data': 365 * 2,  # 2 years
            'product_data': 365 * 7,  # 7 years (business records)
            'dpp_data': 365 * 10,  # 10 years (compliance records)
            'audit_logs': 365 * 3,  # 3 years
            'session_data': 30  # 30 days
        }
        return retention_periods.get(data_type, 365)  # Default 1 year
    
    @staticmethod
    def should_delete_data(created_at, data_type):
        """Check if data should be deleted based on retention policy"""
        retention_days = GDPRCompliance.get_data_retention_period(data_type)
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        
        return created_at < cutoff_date

def require_consent(consent_type):
    """Decorator to require user consent for data processing"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get user ID from request context
            user_id = getattr(g, 'user_id', None)
            
            if not user_id:
                return jsonify({
                    'success': False,
                    'error': 'Authentication required'
                }), 401
            
            if not GDPRCompliance.validate_consent(user_id, consent_type):
                return jsonify({
                    'success': False,
                    'error': f'Consent required for {consent_type}',
                    'consent_required': True,
                    'consent_type': consent_type
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def sanitize_output(data, user_role='user'):
    """Sanitize output data based on user role and GDPR requirements"""
    if not isinstance(data, dict):
        return data
    
    sanitized = data.copy()
    
    # Fields to remove for non-admin users
    sensitive_fields = [
        'password', 'password_hash', 'secret_key', 'private_key',
        'internal_notes', 'admin_comments'
    ]
    
    # Fields to anonymize for regular users
    anonymize_fields = []
    if user_role != 'admin':
        anonymize_fields = ['email', 'phone', 'address']
    
    # Remove sensitive fields
    for field in sensitive_fields:
        sanitized.pop(field, None)
    
    # Anonymize fields if needed
    if anonymize_fields:
        sanitized = GDPRCompliance.anonymize_data(sanitized, anonymize_fields)
    
    return sanitized

class DataProcessor:
    """Data processing utilities with GDPR compliance"""
    
    @staticmethod
    def process_personal_data(data, purpose, legal_basis):
        """Process personal data with GDPR compliance"""
        processing_record = {
            'timestamp': datetime.utcnow().isoformat(),
            'purpose': purpose,
            'legal_basis': legal_basis,
            'data_fields': list(data.keys()) if isinstance(data, dict) else [],
            'processor': 'DPP Platform'
        }
        
        # Log processing activity
        security_logger.info("Personal data processing", extra=processing_record)
        
        return data
    
    @staticmethod
    def export_user_data(user_id):
        """Export all user data for GDPR data portability"""
        # In production, collect data from all relevant tables
        user_data = {
            'export_timestamp': datetime.utcnow().isoformat(),
            'user_id': user_id,
            'data_sources': [
                'users', 'products', 'dpps', 'qr_codes', 'audit_logs'
            ],
            'format': 'JSON',
            'note': 'This export contains all personal data we hold about you.'
        }
        
        return user_data
    
    @staticmethod
    def delete_user_data(user_id, reason='user_request'):
        """Delete user data for GDPR right to erasure"""
        deletion_record = {
            'timestamp': datetime.utcnow().isoformat(),
            'user_id': user_id,
            'reason': reason,
            'status': 'completed',
            'data_deleted': [
                'user_profile', 'products', 'dpps', 'sessions'
            ]
        }
        
        # Log deletion activity
        security_logger.info("User data deletion", extra=deletion_record)
        
        return deletion_record

