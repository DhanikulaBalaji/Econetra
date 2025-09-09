# Econetra DPP Platform - Deployment Guide

## Production Deployment Overview

This guide covers deploying the Econetra Digital Product Passport Platform to production environments. The platform consists of three main components:

1. **Frontend**: React/Next.js application
2. **Backend**: Flask API server
3. **Blockchain**: Smart contracts on Polygon network

## Prerequisites

### Infrastructure Requirements

- **Cloud Provider**: AWS, Google Cloud, Azure, or DigitalOcean
- **Database**: PostgreSQL (Supabase recommended)
- **Storage**: IPFS node or hosted service (Pinata, Infura)
- **Blockchain**: Polygon mainnet access
- **CDN**: CloudFlare or similar (recommended)
- **SSL Certificate**: Let's Encrypt or commercial certificate

### Domain and DNS

- Primary domain: `econetra.com`
- API subdomain: `api.econetra.com`
- Verification portal: `verify.econetra.com` (optional)

## Deployment Options

### Option 1: Docker Deployment (Recommended)

#### 1.1 Create Docker Files

**Frontend Dockerfile** (`dpp-frontend/Dockerfile`):
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Backend Dockerfile** (`dpp-backend/Dockerfile`):
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "src.main:app"]
```

#### 1.2 Docker Compose Configuration

**docker-compose.prod.yml**:
```yaml
version: '3.8'

services:
  frontend:
    build: ./dpp-frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/ssl/certs
    environment:
      - NODE_ENV=production
    depends_on:
      - backend

  backend:
    build: ./dpp-backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - SECRET_KEY=${SECRET_KEY}
      - POLYGON_RPC_URL=${POLYGON_RPC_URL}
      - PRIVATE_KEY=${PRIVATE_KEY}
      - CONTRACT_ADDRESS=${CONTRACT_ADDRESS}
    volumes:
      - ./logs:/app/logs

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - frontend
      - backend
```

#### 1.3 Deploy with Docker Compose

```bash
# Clone repository
git clone https://github.com/econetra/dpp-platform.git
cd dpp-platform

# Set environment variables
cp .env.example .env.production
# Edit .env.production with production values

# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Option 2: Cloud Platform Deployment

#### 2.1 AWS Deployment

**Using AWS ECS with Fargate**:

1. **Create ECR repositories**:
```bash
aws ecr create-repository --repository-name econetra-dpp-frontend
aws ecr create-repository --repository-name econetra-dpp-backend
```

2. **Build and push images**:
```bash
# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag images
docker build -t econetra-dpp-frontend ./dpp-frontend
docker tag econetra-dpp-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/econetra-dpp-frontend:latest

docker build -t econetra-dpp-backend ./dpp-backend
docker tag econetra-dpp-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/econetra-dpp-backend:latest

# Push images
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/econetra-dpp-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/econetra-dpp-backend:latest
```

3. **Create ECS task definitions and services**
4. **Set up Application Load Balancer**
5. **Configure Route 53 for DNS**

#### 2.2 Google Cloud Deployment

**Using Google Cloud Run**:

```bash
# Build and deploy backend
gcloud builds submit --tag gcr.io/PROJECT-ID/dpp-backend ./dpp-backend
gcloud run deploy dpp-backend --image gcr.io/PROJECT-ID/dpp-backend --platform managed --region us-central1

# Build and deploy frontend
gcloud builds submit --tag gcr.io/PROJECT-ID/dpp-frontend ./dpp-frontend
gcloud run deploy dpp-frontend --image gcr.io/PROJECT-ID/dpp-frontend --platform managed --region us-central1
```

#### 2.3 Azure Deployment

**Using Azure Container Instances**:

```bash
# Create resource group
az group create --name econetra-dpp --location eastus

# Create container registry
az acr create --resource-group econetra-dpp --name econetradpp --sku Basic

# Build and push images
az acr build --registry econetradpp --image dpp-backend ./dpp-backend
az acr build --registry econetradpp --image dpp-frontend ./dpp-frontend

# Deploy containers
az container create --resource-group econetra-dpp --name dpp-backend --image econetradpp.azurecr.io/dpp-backend:latest
az container create --resource-group econetra-dpp --name dpp-frontend --image econetradpp.azurecr.io/dpp-frontend:latest
```

## Database Setup

### Supabase Production Configuration

1. **Create Production Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create new project for production
   - Choose appropriate region (EU for GDPR compliance)

2. **Run Database Schema**:
```sql
-- Execute the DATABASE_SCHEMA.sql file
-- Remove sample data for production
```

3. **Configure Authentication**:
   - Set up email authentication
   - Configure OAuth providers if needed
   - Set up custom SMTP for emails

4. **Set up Row Level Security**:
   - Enable RLS on all tables
   - Test policies thoroughly
   - Monitor access patterns

### Database Backup Strategy

```bash
# Daily automated backups
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Weekly full backups with compression
pg_dump $DATABASE_URL | gzip > backup_weekly_$(date +%Y%m%d).sql.gz

# Retention policy: Keep daily for 30 days, weekly for 1 year
```

## Blockchain Deployment

### Smart Contract Deployment

1. **Prepare Deployment Wallet**:
```bash
# Create dedicated deployment wallet
# Fund with MATIC tokens for gas fees
# Store private key securely (use hardware wallet for production)
```

2. **Deploy to Polygon Mainnet**:
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network polygon
```

3. **Verify Contract**:
```bash
npx hardhat verify --network polygon <CONTRACT_ADDRESS>
```

4. **Update Environment Variables**:
```env
CONTRACT_ADDRESS=0x...
POLYGON_RPC_URL=https://polygon-rpc.com
PRIVATE_KEY=0x...  # Use secure key management
```

### Blockchain Monitoring

- Set up monitoring for contract interactions
- Monitor gas usage and optimize
- Set up alerts for failed transactions
- Regular security audits

## IPFS Configuration

### Option 1: Self-Hosted IPFS Node

```bash
# Install IPFS
wget https://dist.ipfs.io/go-ipfs/v0.17.0/go-ipfs_v0.17.0_linux-amd64.tar.gz
tar -xvzf go-ipfs_v0.17.0_linux-amd64.tar.gz
sudo mv go-ipfs/ipfs /usr/local/bin/

# Initialize and configure
ipfs init
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST"]'

# Create systemd service
sudo tee /etc/systemd/system/ipfs.service > /dev/null <<EOF
[Unit]
Description=IPFS daemon
After=network.target

[Service]
Type=notify
User=ipfs
Group=ipfs
StateDirectory=ipfs
Environment=IPFS_PATH=/var/lib/ipfs
ExecStart=/usr/local/bin/ipfs daemon --enable-gc
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable ipfs
sudo systemctl start ipfs
```

### Option 2: Hosted IPFS Service

**Pinata Configuration**:
```env
PINATA_API_KEY=your_api_key
PINATA_SECRET_KEY=your_secret_key
IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/
```

**Infura Configuration**:
```env
INFURA_PROJECT_ID=your_project_id
INFURA_PROJECT_SECRET=your_project_secret
IPFS_GATEWAY_URL=https://ipfs.infura.io/ipfs/
```

## Security Configuration

### SSL/TLS Setup

**Using Let's Encrypt with Certbot**:
```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d econetra.com -d api.econetra.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall Configuration

```bash
# UFW firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Environment Variables Security

```bash
# Use AWS Secrets Manager, Azure Key Vault, or similar
# Never store secrets in plain text files
# Rotate keys regularly
# Use different keys for different environments
```

## Monitoring and Logging

### Application Monitoring

**Using Prometheus and Grafana**:

1. **Install Prometheus**:
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'dpp-backend'
    static_configs:
      - targets: ['localhost:5000']
  
  - job_name: 'dpp-frontend'
    static_configs:
      - targets: ['localhost:3000']
```

2. **Set up Grafana Dashboards**:
   - API response times
   - Error rates
   - Database performance
   - Blockchain transaction status
   - IPFS pin status

### Log Management

**Using ELK Stack (Elasticsearch, Logstash, Kibana)**:

```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

### Health Checks

```bash
# Backend health check
curl -f http://localhost:5000/health || exit 1

# Frontend health check
curl -f http://localhost:3000 || exit 1

# Database health check
pg_isready -h localhost -p 5432 || exit 1

# IPFS health check
curl -f http://localhost:5001/api/v0/version || exit 1
```

## Performance Optimization

### Frontend Optimization

1. **Enable Gzip Compression**
2. **Use CDN for Static Assets**
3. **Implement Caching Headers**
4. **Optimize Images and Assets**
5. **Code Splitting and Lazy Loading**

### Backend Optimization

1. **Database Connection Pooling**
2. **Redis Caching**
3. **API Rate Limiting**
4. **Background Job Processing**
5. **Database Query Optimization**

### Infrastructure Optimization

1. **Load Balancing**
2. **Auto Scaling**
3. **Database Read Replicas**
4. **Content Delivery Network**
5. **Edge Computing**

## Backup and Disaster Recovery

### Backup Strategy

1. **Database Backups**:
   - Daily automated backups
   - Point-in-time recovery
   - Cross-region replication

2. **Application Backups**:
   - Code repository backups
   - Configuration backups
   - SSL certificate backups

3. **IPFS Data Backup**:
   - Pin important content to multiple nodes
   - Regular backup of pinned content list
   - Disaster recovery procedures

### Disaster Recovery Plan

1. **Recovery Time Objective (RTO)**: 4 hours
2. **Recovery Point Objective (RPO)**: 1 hour
3. **Backup Testing**: Monthly
4. **Failover Procedures**: Documented and tested
5. **Communication Plan**: Stakeholder notification

## Compliance and Security

### GDPR Compliance

1. **Data Processing Records**
2. **Consent Management**
3. **Data Subject Rights**
4. **Privacy Impact Assessments**
5. **Data Breach Procedures**

### Security Measures

1. **Regular Security Audits**
2. **Penetration Testing**
3. **Vulnerability Scanning**
4. **Security Incident Response**
5. **Staff Security Training**

## Maintenance and Updates

### Update Procedures

1. **Staging Environment Testing**
2. **Blue-Green Deployments**
3. **Database Migration Scripts**
4. **Rollback Procedures**
5. **Change Management Process**

### Monitoring and Alerting

1. **System Health Monitoring**
2. **Performance Metrics**
3. **Error Rate Monitoring**
4. **Security Event Monitoring**
5. **Business Metrics Tracking**

## Support and Documentation

### Operational Runbooks

1. **Deployment Procedures**
2. **Troubleshooting Guides**
3. **Emergency Procedures**
4. **Maintenance Schedules**
5. **Contact Information**

### Training and Knowledge Transfer

1. **Technical Documentation**
2. **User Manuals**
3. **API Documentation**
4. **Training Materials**
5. **Knowledge Base**

## Cost Optimization

### Infrastructure Costs

1. **Right-sizing Resources**
2. **Reserved Instances**
3. **Spot Instances for Non-Critical Workloads**
4. **Auto-scaling Policies**
5. **Regular Cost Reviews**

### Operational Costs

1. **Automated Operations**
2. **Efficient Resource Usage**
3. **Third-party Service Optimization**
4. **Regular Cost Analysis**
5. **Budget Monitoring and Alerts**

---

For additional support and questions regarding deployment, please contact:
- Technical Support: support@econetra.com
- DevOps Team: devops@econetra.com
- Emergency Contact: +1-XXX-XXX-XXXX

