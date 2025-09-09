# Econetra DPP Platform - Installation Guide

## Overview

The Econetra Digital Product Passport (DPP) Platform is a comprehensive solution for creating, managing, and verifying Digital Product Passports for textile exports from Tiruppur, India to the EU. This guide will help you set up and deploy the complete platform.

## System Requirements

### Minimum Requirements
- **Operating System**: Ubuntu 20.04+ / macOS 10.15+ / Windows 10+
- **Node.js**: v18.0.0 or higher
- **Python**: v3.9.0 or higher
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 10GB free space
- **Network**: Stable internet connection for blockchain and IPFS operations

### Recommended Requirements
- **CPU**: 4+ cores
- **Memory**: 16GB RAM
- **Storage**: 50GB SSD
- **Network**: High-speed broadband connection

## Prerequisites

Before installation, ensure you have the following accounts and services set up:

1. **Supabase Account** (for database and authentication)
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon key

2. **IPFS Node** (for decentralized storage)
   - Install IPFS Desktop or use a hosted service
   - Alternative: Use Pinata, Infura, or similar IPFS gateway

3. **Polygon Network Access** (for blockchain operations)
   - Set up a wallet (MetaMask recommended)
   - Get some MATIC tokens for gas fees
   - Optional: Alchemy or Infura RPC endpoint

4. **Development Tools**
   - Git
   - Code editor (VS Code recommended)
   - Terminal/Command Prompt

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/econetra/dpp-platform.git
cd dpp-platform
```

### 2. Backend Setup

#### 2.1 Navigate to Backend Directory
```bash
cd dpp-backend
```

#### 2.2 Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### 2.3 Install Dependencies
```bash
pip install -r requirements.txt
```

#### 2.4 Environment Configuration
Create a `.env` file in the `dpp-backend` directory:

```env
# Database Configuration
DATABASE_URL=sqlite:///dpp_platform.db
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# Security
SECRET_KEY=your_secret_key_here
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# IPFS Configuration
IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/

# Blockchain Configuration
POLYGON_RPC_URL=https://polygon-rpc.com
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=deployed_contract_address

# Optional: External Services
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

#### 2.5 Initialize Database
```bash
python src/main.py
# This will create the database tables automatically
```

### 3. Frontend Setup

#### 3.1 Navigate to Frontend Directory
```bash
cd ../dpp-frontend
```

#### 3.2 Install Dependencies
```bash
npm install
# or
pnpm install
```

#### 3.3 Environment Configuration
Create a `.env` file in the `dpp-frontend` directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API Configuration
VITE_API_BASE_URL=http://localhost:5000

# Optional: IPFS Gateway
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

### 4. Blockchain Setup

#### 4.1 Navigate to Blockchain Directory
```bash
cd ../blockchain
```

#### 4.2 Install Dependencies
```bash
npm install
```

#### 4.3 Configure Hardhat
Update `hardhat.config.js` with your network settings:

```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    polygon: {
      url: "https://polygon-rpc.com",
      accounts: ["your_private_key_here"]
    },
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: ["your_private_key_here"]
    }
  }
};
```

#### 4.4 Deploy Smart Contracts
```bash
# Deploy to Mumbai testnet
npx hardhat run scripts/deploy.js --network mumbai

# Deploy to Polygon mainnet (production)
npx hardhat run scripts/deploy.js --network polygon
```

## Running the Application

### Development Mode

#### 1. Start Backend Server
```bash
cd dpp-backend
source venv/bin/activate
python src/main.py
```
The backend will be available at `http://localhost:5000`

#### 2. Start Frontend Development Server
```bash
cd dpp-frontend
npm run dev
# or
pnpm dev
```
The frontend will be available at `http://localhost:5173`

#### 3. Start IPFS Node (if running locally)
```bash
ipfs daemon
```

### Production Deployment

#### Option 1: Docker Deployment (Recommended)

1. **Build Docker Images**
```bash
# Backend
cd dpp-backend
docker build -t econetra-dpp-backend .

# Frontend
cd ../dpp-frontend
docker build -t econetra-dpp-frontend .
```

2. **Run with Docker Compose**
```bash
cd ..
docker-compose up -d
```

#### Option 2: Manual Deployment

1. **Backend Deployment**
```bash
cd dpp-backend
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 src.main:app
```

2. **Frontend Deployment**
```bash
cd dpp-frontend
npm run build
# Serve the dist/ directory with nginx or similar
```

## Configuration

### Database Setup

#### Supabase Configuration
1. Create the following tables in your Supabase project:

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'supplier',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    supplier_id UUID REFERENCES users(id),
    sku VARCHAR(100),
    gtin VARCHAR(50),
    material_composition JSONB,
    production_location VARCHAR(255),
    production_date DATE,
    weight DECIMAL,
    dimensions JSONB,
    color VARCHAR(100),
    size VARCHAR(100),
    care_instructions TEXT,
    certifications JSONB,
    sustainability_info JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Digital Product Passports table
CREATE TABLE digital_product_passports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    dpp_url VARCHAR(500),
    ipfs_cid VARCHAR(255),
    blockchain_hash VARCHAR(255),
    gs1_digital_link VARCHAR(500),
    epcis_events JSONB,
    json_ld_data JSONB,
    status VARCHAR(50) DEFAULT 'active',
    issued_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- QR Codes table
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dpp_id UUID REFERENCES digital_product_passports(id),
    qr_code_image_url TEXT,
    format VARCHAR(10) DEFAULT 'PNG',
    size INTEGER DEFAULT 10,
    generated_at TIMESTAMP DEFAULT NOW()
);
```

2. **Set up Row Level Security (RLS)**
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_product_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Create policies (example for users table)
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);
```

### Blockchain Configuration

1. **Deploy Smart Contracts**
   - Deploy the DPPRegistry contract to Polygon network
   - Update the contract address in your environment variables

2. **Set up Wallet**
   - Create a dedicated wallet for the platform
   - Fund it with MATIC tokens for gas fees
   - Keep the private key secure

### IPFS Configuration

1. **Local IPFS Node**
```bash
ipfs init
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST"]'
ipfs daemon
```

2. **Hosted IPFS Service** (Alternative)
   - Sign up for Pinata, Infura, or similar service
   - Update environment variables with API credentials

## Testing

### Backend Testing
```bash
cd dpp-backend
source venv/bin/activate
python -m pytest tests/
```

### Frontend Testing
```bash
cd dpp-frontend
npm run test
```

### Smart Contract Testing
```bash
cd blockchain
npx hardhat test
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify Supabase URL and key
   - Check network connectivity
   - Ensure RLS policies are correctly configured

2. **IPFS Connection Issues**
   - Verify IPFS daemon is running
   - Check firewall settings
   - Try using a hosted IPFS service

3. **Blockchain Connection Issues**
   - Verify RPC endpoint is accessible
   - Check wallet has sufficient MATIC balance
   - Ensure contract is deployed and address is correct

4. **CORS Issues**
   - Update CORS_ORIGINS in backend environment
   - Ensure frontend and backend URLs match

### Logs and Debugging

- Backend logs: Check console output or configure logging
- Frontend logs: Check browser developer console
- Blockchain logs: Use Hardhat console or block explorer

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use strong, unique secret keys
   - Rotate keys regularly

2. **Database Security**
   - Enable RLS on all tables
   - Use least-privilege access principles
   - Regular security audits

3. **Blockchain Security**
   - Keep private keys secure
   - Use hardware wallets for production
   - Monitor contract interactions

4. **GDPR Compliance**
   - Configure data retention policies
   - Implement consent management
   - Regular compliance audits

## Support

For technical support and questions:
- Email: support@econetra.com
- Documentation: [docs.econetra.com](https://docs.econetra.com)
- GitHub Issues: [github.com/econetra/dpp-platform/issues](https://github.com/econetra/dpp-platform/issues)

## License

This project is licensed under the MIT License. See the LICENSE file for details.

