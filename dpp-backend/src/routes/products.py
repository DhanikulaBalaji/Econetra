from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.product import Product
from src.config.supabase_client import supabase_client
import uuid
from datetime import datetime

products_bp = Blueprint('products', __name__)

@products_bp.route('/products', methods=['GET'])
def get_products():
    """Get all products with optional filtering and pagination."""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        supplier_id = request.args.get('supplier_id')
        
        # Build query
        query = Product.query
        
        if supplier_id:
            query = query.filter(Product.supplier_id == supplier_id)
        
        # Paginate results
        products = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'success': True,
            'data': [product.to_dict() for product in products.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': products.total,
                'pages': products.pages
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@products_bp.route('/products/<product_id>', methods=['GET'])
def get_product(product_id):
    """Get a specific product by ID."""
    try:
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({
                'success': False,
                'error': 'Product not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': product.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@products_bp.route('/products', methods=['POST'])
def create_product():
    """Create a new product."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['product_name', 'supplier_id']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Create new product
        product = Product.from_dict(data)
        product.id = str(uuid.uuid4())
        
        # Handle production_date if provided
        if 'production_date' in data and data['production_date']:
            try:
                product.production_date = datetime.fromisoformat(data['production_date']).date()
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid production_date format. Use YYYY-MM-DD'
                }), 400
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': product.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@products_bp.route('/products/<product_id>', methods=['PUT'])
def update_product(product_id):
    """Update an existing product."""
    try:
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({
                'success': False,
                'error': 'Product not found'
            }), 404
        
        data = request.get_json()
        
        # Update product fields
        for key, value in data.items():
            if hasattr(product, key) and key not in ['id', 'created_at']:
                if key == 'production_date' and value:
                    try:
                        product.production_date = datetime.fromisoformat(value).date()
                    except ValueError:
                        return jsonify({
                            'success': False,
                            'error': 'Invalid production_date format. Use YYYY-MM-DD'
                        }), 400
                else:
                    setattr(product, key, value)
        
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': product.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@products_bp.route('/products/<product_id>', methods=['DELETE'])
def delete_product(product_id):
    """Delete a product."""
    try:
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({
                'success': False,
                'error': 'Product not found'
            }), 404
        
        db.session.delete(product)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

