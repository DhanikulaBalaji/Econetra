from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid
from src.models.user import db

class QRCode(db.Model):
    __tablename__ = 'qr_codes'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dpp_id = db.Column(db.String(36), db.ForeignKey('digital_product_passports.id'), nullable=False, unique=True)
    qr_code_image_url = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert QRCode instance to dictionary."""
        return {
            'id': self.id,
            'dpp_id': self.dpp_id,
            'qr_code_image_url': self.qr_code_image_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create QRCode instance from dictionary."""
        qr_code = cls()
        for key, value in data.items():
            if hasattr(qr_code, key) and key not in ['id', 'created_at']:
                setattr(qr_code, key, value)
        return qr_code

