from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid
from src.models.user import db

class DigitalProductPassport(db.Model):
    __tablename__ = 'digital_product_passports'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = db.Column(db.String(36), db.ForeignKey('products.id'), nullable=False, unique=True)
    dpp_url = db.Column(db.String(500), nullable=False, unique=True)
    ipfs_cid = db.Column(db.String(100), nullable=False, unique=True)
    blockchain_hash = db.Column(db.String(66), nullable=False, unique=True)  # Ethereum hash format
    gs1_digital_link = db.Column(db.String(500))
    epcis_events = db.Column(db.JSON)  # JSON object for EPCIS 2.0 events
    json_ld_data = db.Column(db.JSON, nullable=False)  # Full DPP data in JSON-LD format
    issued_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with QR Code
    qr_code = db.relationship('QRCode', backref='dpp', uselist=False, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert DPP instance to dictionary."""
        return {
            'id': self.id,
            'product_id': self.product_id,
            'dpp_url': self.dpp_url,
            'ipfs_cid': self.ipfs_cid,
            'blockchain_hash': self.blockchain_hash,
            'gs1_digital_link': self.gs1_digital_link,
            'epcis_events': self.epcis_events,
            'json_ld_data': self.json_ld_data,
            'issued_at': self.issued_at.isoformat() if self.issued_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create DPP instance from dictionary."""
        dpp = cls()
        for key, value in data.items():
            if hasattr(dpp, key) and key not in ['id', 'issued_at', 'updated_at']:
                setattr(dpp, key, value)
        return dpp

