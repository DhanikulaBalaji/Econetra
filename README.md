# Econetra Digital Product Passport (DPP) Platform

A comprehensive Digital Product Passport issuance platform for textiles exported from Tiruppur, India to the EU, ensuring compliance with EU DPP delegated acts and data formats.

## Project Structure

```
econetra-dpp-platform/
├── dpp-frontend/          # Next.js frontend application
├── dpp-backend/           # Flask backend with Supabase integration
├── blockchain/            # Hardhat smart contracts for Polygon
├── docs/                  # Documentation and architecture
└── README.md             # This file
```

## Features

- **EU Compliance**: Supports JSON-LD, GS1 Digital Link, and EPCIS 2.0 data formats
- **Product Registration**: Register textile products with detailed metadata
- **DPP Generation**: Generate unique Digital Product Passports
- **IPFS Storage**: Decentralized storage for DPP metadata
- **Polygon Blockchain**: Immutable hash storage and verification
- **QR Code Generation**: Unique QR codes for each product
- **Role-Based Access**: Admin, supplier, and verifier roles
- **Public Verification**: Portal for scanning and viewing DPP details
- **GDPR Compliance**: Privacy and data protection features

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Flask, Supabase (PostgreSQL, Auth, APIs)
- **Blockchain**: Solidity, Hardhat, Polygon
- **Storage**: IPFS for metadata
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.8+
- Git

### Installation

1. Clone the repository
2. Set up the frontend:
   ```bash
   cd dpp-frontend
   npm install
   npm run dev
   ```

3. Set up the backend:
   ```bash
   cd dpp-backend
   source venv/bin/activate
   pip install -r requirements.txt
   python src/main.py
   ```

4. Set up blockchain:
   ```bash
   cd blockchain
   npm install
   npx hardhat compile
   ```

## Configuration

### Environment Variables

Create `.env` files in each component directory with the required configuration:

#### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

#### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
IPFS_API_URL=your_ipfs_node_url
POLYGON_RPC_URL=https://polygon-rpc.com/
```

#### Blockchain (.env)
```
PRIVATE_KEY=your_wallet_private_key
POLYGON_RPC_URL=https://polygon-rpc.com/
```

## Development

### Running the Development Environment

1. Start the backend server:
   ```bash
   cd dpp-backend
   source venv/bin/activate
   python src/main.py
   ```

2. Start the frontend development server:
   ```bash
   cd dpp-frontend
   npm run dev
   ```

3. Deploy smart contracts (optional):
   ```bash
   cd blockchain
   npx hardhat run scripts/deploy.js --network polygon
   ```

## API Documentation

The platform provides REST APIs for:

- Product management (`/api/products`)
- DPP issuance and verification (`/api/dpps`)
- QR code generation (`/api/qr_codes`)
- User authentication (via Supabase Auth)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.

