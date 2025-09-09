from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid
from src.models.user import db

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    supplier_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    product_name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    material_composition = db.Column(db.JSON)  # JSON object for material composition
    production_location = db.Column(db.String(255))
    production_date = db.Column(db.Date)
    gtin = db.Column(db.String(14), unique=True)  # Global Trade Item Number
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with DPP
    dpp = db.relationship('DigitalProductPassport', backref='product', uselist=False, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert Product instance to dictionary."""
        return {
            'id': self.id,
            'supplier_id': self.supplier_id,
            'product_name': self.product_name,
            'description': self.description,
            'material_composition': self.material_composition,
            'production_location': self.production_location,
            'production_date': self.production_date.isoformat() if self.production_date else None,
            'gtin': self.gtin,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create Product instance from dictionary."""
        product = cls()
        for key, value in data.items():
            if hasattr(product, key) and key not in ['id', 'created_at', 'updated_at']:
                if key == 'production_date' and value:
                    from datetime import datetime
                    product.production_date = datetime.fromisoformat(value).date()
                else:
                    setattr(product, key, value)
        return product

