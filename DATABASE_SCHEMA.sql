-- Econetra DPP Platform Database Schema
-- Compatible with PostgreSQL (Supabase) and SQLite

-- Enable UUID extension for PostgreSQL
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    company_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'supplier' CHECK (role IN ('admin', 'supplier', 'verifier')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    supplier_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sku VARCHAR(100),
    gtin VARCHAR(50),
    material_composition JSONB,
    production_location VARCHAR(255),
    production_date DATE,
    weight DECIMAL(10,3),
    dimensions JSONB,
    color VARCHAR(100),
    size VARCHAR(100),
    care_instructions TEXT,
    certifications JSONB,
    sustainability_info JSONB,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Digital Product Passports table
CREATE TABLE digital_product_passports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    dpp_url VARCHAR(500),
    ipfs_cid VARCHAR(255),
    blockchain_hash VARCHAR(255),
    gs1_digital_link VARCHAR(500),
    epcis_events JSONB DEFAULT '[]',
    json_ld_data JSONB,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QR Codes table
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dpp_id UUID REFERENCES digital_product_passports(id) ON DELETE CASCADE,
    qr_code_image_url TEXT,
    format VARCHAR(10) DEFAULT 'PNG' CHECK (format IN ('PNG', 'SVG', 'JPEG')),
    size INTEGER DEFAULT 10 CHECK (size > 0),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consent Management table (GDPR Compliance)
CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL,
    granted BOOLEAN NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    method VARCHAR(50) DEFAULT 'web_form'
);

-- Audit Logs table (Security and Compliance)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Processing Activities table (GDPR Transparency)
CREATE TABLE data_processing_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_name VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    legal_basis VARCHAR(100) NOT NULL,
    data_categories JSONB,
    retention_period VARCHAR(100),
    recipients JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blockchain Transactions table (Audit Trail)
CREATE TABLE blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dpp_id UUID REFERENCES digital_product_passports(id) ON DELETE CASCADE,
    transaction_hash VARCHAR(255) UNIQUE NOT NULL,
    block_number BIGINT,
    gas_used BIGINT,
    gas_price BIGINT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP
);

-- IPFS Pins table (Storage Management)
CREATE TABLE ipfs_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dpp_id UUID REFERENCES digital_product_passports(id) ON DELETE CASCADE,
    ipfs_cid VARCHAR(255) UNIQUE NOT NULL,
    pin_status VARCHAR(20) DEFAULT 'pinned' CHECK (pin_status IN ('pinned', 'unpinned', 'failed')),
    gateway_url VARCHAR(500),
    size_bytes BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verification Logs table (Public Verification Tracking)
CREATE TABLE verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dpp_id UUID REFERENCES digital_product_passports(id) ON DELETE CASCADE,
    verifier_ip INET,
    verification_method VARCHAR(50), -- 'qr_scan', 'manual_entry', 'api_call'
    verification_result JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_gtin ON products(gtin);
CREATE INDEX idx_products_status ON products(status);

CREATE INDEX idx_dpps_product_id ON digital_product_passports(product_id);
CREATE INDEX idx_dpps_blockchain_hash ON digital_product_passports(blockchain_hash);
CREATE INDEX idx_dpps_ipfs_cid ON digital_product_passports(ipfs_cid);
CREATE INDEX idx_dpps_status ON digital_product_passports(status);

CREATE INDEX idx_qr_codes_dpp_id ON qr_codes(dpp_id);

CREATE INDEX idx_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_consents_type ON user_consents(consent_type);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

CREATE INDEX idx_blockchain_tx_dpp_id ON blockchain_transactions(dpp_id);
CREATE INDEX idx_blockchain_tx_hash ON blockchain_transactions(transaction_hash);
CREATE INDEX idx_blockchain_tx_status ON blockchain_transactions(status);

CREATE INDEX idx_ipfs_pins_dpp_id ON ipfs_pins(dpp_id);
CREATE INDEX idx_ipfs_pins_cid ON ipfs_pins(ipfs_cid);

CREATE INDEX idx_verification_logs_dpp_id ON verification_logs(dpp_id);
CREATE INDEX idx_verification_logs_timestamp ON verification_logs(timestamp);

-- Row Level Security (RLS) Policies for Supabase
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_product_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_processing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipfs_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Products table policies
CREATE POLICY "Suppliers can view own products" ON products
    FOR SELECT USING (supplier_id = auth.uid());

CREATE POLICY "Suppliers can create products" ON products
    FOR INSERT WITH CHECK (supplier_id = auth.uid());

CREATE POLICY "Suppliers can update own products" ON products
    FOR UPDATE USING (supplier_id = auth.uid());

CREATE POLICY "Verifiers can view all products" ON products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('verifier', 'admin')
        )
    );

-- DPPs table policies
CREATE POLICY "Product owners can view DPPs" ON digital_product_passports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE id = product_id AND supplier_id = auth.uid()
        )
    );

CREATE POLICY "Public DPP verification access" ON digital_product_passports
    FOR SELECT USING (status = 'active');

CREATE POLICY "Product owners can create DPPs" ON digital_product_passports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM products 
            WHERE id = product_id AND supplier_id = auth.uid()
        )
    );

-- QR Codes table policies
CREATE POLICY "DPP owners can view QR codes" ON qr_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM digital_product_passports dpp
            JOIN products p ON dpp.product_id = p.id
            WHERE dpp.id = dpp_id AND p.supplier_id = auth.uid()
        )
    );

-- Consent table policies
CREATE POLICY "Users can view own consents" ON user_consents
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own consents" ON user_consents
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Audit logs policies (admin only)
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Verification logs (public read for transparency)
CREATE POLICY "Public verification log access" ON verification_logs
    FOR SELECT USING (true);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dpps_updated_at BEFORE UPDATE ON digital_product_passports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_activities_updated_at BEFORE UPDATE ON data_processing_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ipfs_pins_updated_at BEFORE UPDATE ON ipfs_pins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data processing activities
INSERT INTO data_processing_activities (activity_name, purpose, legal_basis, data_categories, retention_period, recipients) VALUES
('User Account Management', 'Provide user authentication and account services', 'Contract performance', '["identity_data", "contact_data"]', '2 years after account closure', '["internal_staff", "it_service_providers"]'),
('Digital Product Passport Creation', 'Create and manage Digital Product Passports for textile products', 'Contract performance', '["product_data", "supply_chain_data", "sustainability_data"]', '10 years (compliance requirement)', '["blockchain_network", "ipfs_network", "regulatory_authorities"]'),
('Compliance Monitoring', 'Monitor compliance with EU regulations and maintain audit trails', 'Legal obligation', '["audit_logs", "transaction_records", "verification_data"]', '7 years', '["regulatory_authorities", "compliance_auditors"]'),
('Service Improvement', 'Analyze usage patterns to improve platform functionality', 'Legitimate interest', '["usage_analytics", "performance_metrics"]', '2 years', '["analytics_service_providers"]'),
('Security Monitoring', 'Monitor for security threats and maintain system integrity', 'Legitimate interest', '["access_logs", "security_events", "ip_addresses"]', '1 year', '["security_service_providers"]');

-- Insert sample data (for development/testing)
-- Note: Remove or modify for production deployment

-- Sample users
INSERT INTO users (id, email, company_name, role, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@econetra.com', 'Econetra', 'admin', 'active'),
('550e8400-e29b-41d4-a716-446655440002', 'supplier@tiruppur.com', 'Tiruppur Textiles Ltd', 'supplier', 'active'),
('550e8400-e29b-41d4-a716-446655440003', 'verifier@eu-customs.eu', 'EU Customs Authority', 'verifier', 'active');

-- Sample products
INSERT INTO products (id, product_name, description, supplier_id, sku, gtin, material_composition, production_location, production_date, color, size, status) VALUES
('550e8400-e29b-41d4-a716-446655440011', 'Organic Cotton T-Shirt', 'Premium organic cotton t-shirt made in Tiruppur', '550e8400-e29b-41d4-a716-446655440002', 'CT-001', '1234567890123', '{"Organic Cotton": "95%", "Elastane": "5%"}', 'Tiruppur, Tamil Nadu, India', '2025-01-15', 'White', 'M', 'active'),
('550e8400-e29b-41d4-a716-446655440012', 'Sustainable Denim Jeans', 'Eco-friendly denim jeans with recycled materials', '550e8400-e29b-41d4-a716-446655440002', 'DJ-002', '1234567890124', '{"Organic Cotton": "80%", "Recycled Polyester": "18%", "Elastane": "2%"}', 'Tiruppur, Tamil Nadu, India', '2025-01-14', 'Blue', '32', 'active');

-- Sample DPPs
INSERT INTO digital_product_passports (id, product_id, dpp_url, ipfs_cid, blockchain_hash, gs1_digital_link, json_ld_data, status) VALUES
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440011', 'https://econetra.com/verify/550e8400-e29b-41d4-a716-446655440021', 'QmX1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9', '0x1234567890abcdef1234567890abcdef12345678', 'https://id.gs1.org/01/1234567890123/10/LOT123?linkType=gs1:pip', '{"@context": "https://test.uncefact.org/vocabulary/untp/dpp/0.5.0/", "@type": "DigitalProductPassport"}', 'active'),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440012', 'https://econetra.com/verify/550e8400-e29b-41d4-a716-446655440022', 'QmA4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A1B2C3D4E5', '0xabcdef1234567890abcdef1234567890abcdef12', 'https://id.gs1.org/01/1234567890124/10/LOT124?linkType=gs1:pip', '{"@context": "https://test.uncefact.org/vocabulary/untp/dpp/0.5.0/", "@type": "DigitalProductPassport"}', 'active');

-- Sample consents
INSERT INTO user_consents (user_id, consent_type, granted, ip_address, method) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'data_processing', true, '192.168.1.100', 'web_form'),
('550e8400-e29b-41d4-a716-446655440002', 'marketing', false, '192.168.1.100', 'web_form'),
('550e8400-e29b-41d4-a716-446655440003', 'data_processing', true, '192.168.1.101', 'web_form');

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts with role-based access control';
COMMENT ON TABLE products IS 'Textile products registered in the system';
COMMENT ON TABLE digital_product_passports IS 'Digital Product Passports with blockchain and IPFS integration';
COMMENT ON TABLE qr_codes IS 'QR codes generated for DPP verification';
COMMENT ON TABLE user_consents IS 'GDPR consent management records';
COMMENT ON TABLE audit_logs IS 'System audit trail for security and compliance';
COMMENT ON TABLE data_processing_activities IS 'GDPR data processing activity records';
COMMENT ON TABLE blockchain_transactions IS 'Blockchain transaction audit trail';
COMMENT ON TABLE ipfs_pins IS 'IPFS storage management records';
COMMENT ON TABLE verification_logs IS 'Public DPP verification activity logs';

