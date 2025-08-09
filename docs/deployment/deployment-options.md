# Deployment Options

This guide covers various deployment options for Chat4, from local development to production environments.

## 🚀 Deployment Overview

Chat4 supports multiple deployment strategies to suit different needs:

- **Local Development**: For development and testing
- **Container Deployment**: Docker-based deployment
- **Cloud Platforms**: Vercel, Railway, etc.
- **Traditional Server**: PM2 or systemd-based deployment

## 🛠️ Prerequisites

Before deploying, ensure you have:

- **Node.js 18.0+** installed
- **npm or yarn** package manager
- **Git** for version control
- **Domain name** (for production deployment)
- **SSL certificate** (for production HTTPS)

## 📦 Build Preparation

### 1. Environment Setup

```bash
# Clone the repository
git clone https://github.com/your-username/chat4.git
cd chat4

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### 2. Build the Application

```bash
# Build for production
npm run build

# Generate database client
npm run db:generate

# Push database schema
npm run db:push
```

### 3. Environment Configuration

Create a production `.env` file:

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Database
DATABASE_URL=file:./db/custom.db

# AI Providers
ZAI_API_KEY=your_zai_key
OPENAI_API_KEY=your_openai_key

# Ollama (if using local models)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Security
JWT_SECRET=your_secure_jwt_secret
SESSION_SECRET=your_secure_session_secret

# Domain (for production)
DOMAIN=your-domain.com
HTTPS=true
```

## 🐳 Docker Deployment

### Quick Start

```bash
# Build and run with Docker Compose
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build
RUN npm run db:generate

FROM node:18-alpine AS runner

WORKDIR /app

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/db ./db

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set permissions
COPY --chown=nextjs:nodejs .next
COPY --chown=nextjs:nodejs db
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  chat4:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/db/custom.db
    volumes:
      - ./db:/app/db
      - ./storage:/app/storage
    restart: unless-stopped
    depends_on:
      - ollama

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped

  # Optional: Use PostgreSQL for production
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: chat4
      POSTGRES_USER: chat4
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  # Optional: Redis for caching
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  ollama_data:
  postgres_data:
  redis_data:
```

### Production Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "80:3000"
      - "443:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://chat4:password@postgres:5432/chat4
      - REDIS_URL=redis://redis:6379
      - DOMAIN=your-domain.com
      - HTTPS=true
    volumes:
      - ./storage:/app/storage
    restart: unless-stopped
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: chat4
      POSTGRES_USER: chat4
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

## ☁️ Cloud Platform Deployment

### Vercel Deployment

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Login to Vercel
```bash
vercel login
```

#### 3. Deploy
```bash
vercel --prod
```

#### 4. Environment Variables
```bash
# Set environment variables
vercel env add NODE_ENV production
vercel env add DATABASE_URL your_database_url
vercel env add ZAI_API_KEY your_zai_key
vercel env add OPENAI_API_KEY your_openai_key
```

#### 5. Custom Domain
```bash
# Add custom domain
vercel domains add your-domain.com
```

### Railway Deployment

#### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

#### 2. Login to Railway
```bash
railway login
```

#### 3. Initialize Project
```bash
railway init
```

#### 4. Deploy
```bash
railway up
```

#### 5. Environment Variables
Set environment variables in Railway dashboard.

### Heroku Deployment

#### 1. Install Heroku CLI
```bash
npm install -g heroku
```

#### 2. Login to Heroku
```bash
heroku login
```

#### 3. Create App
```bash
heroku create your-app-name
```

#### 4. Add Buildpack
```bash
heroku buildpacks:add heroku/nodejs
```

#### 5. Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set ZAI_API_KEY=your_zai_key
heroku config:set OPENAI_API_KEY=your_openai_key
```

#### 6. Deploy
```bash
git push heroku main
```

### AWS Elastic Beanstalk

#### 1. Install EB CLI
```bash
pip install awsebcli
```

#### 2. Initialize
```bash
eb init
```

#### 3. Create Environment
```bash
eb create production
```

#### 4. Deploy
```bash
eb deploy
```

### Google Cloud Run

#### 1. Build and Tag
```bash
# Build Docker image
docker build -t gcr.io/your-project/chat4:latest .

# Tag for GCP
docker tag gcr.io/your-project/chat4:latest gcr.io/your-project/chat4:v1
```

#### 2. Push to GCR
```bash
docker push gcr.io/your-project/chat4:latest
```

#### 3. Deploy to Cloud Run
```bash
gcloud run deploy --image gcr.io/your-project/chat4:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 🔧 Traditional Server Deployment

### PM2 Deployment

#### 1. Install PM2
```bash
npm install -g pm2
```

#### 2. Create PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'chat4',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
```

#### 3. Start Application
```bash
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup startup script
pm2 startup
```

#### 4. Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL configuration
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static files
    location /_next/static/ {
        alias /app/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy";
    }
}
```

### Systemd Service

#### 1. Create Service File
```bash
sudo nano /etc/systemd/system/chat4.service
```

#### 2. Service Configuration
```ini
[Unit]
Description=Chat4 Virtual Character Chatroom
After=network.target

[Service]
Type=simple
User=chat4
WorkingDirectory=/opt/chat4
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
SyslogIdentifier=chat4
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=0.0.0.0

[Install]
WantedBy=multi-user.target
```

#### 3. Enable and Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable chat4
sudo systemctl start chat4
```

## 📊 Monitoring and Logging

### Application Monitoring

#### Health Check
```bash
# Application health
curl http://localhost:3000/api/health

# PM2 monitoring
pm2 monit

# Docker health
docker-compose exec chat4 curl http://localhost:3000/api/health
```

#### Log Management
```bash
# PM2 logs
pm2 logs chat4

# Docker logs
docker-compose logs -f chat4

# Systemd logs
journalctl -u chat4 -f
```

### Performance Monitoring

#### PM2 Monitoring
```bash
# Install PM2 monitoring module
pm2 install pm2-web

# Start monitoring
pm2 web
```

#### Docker Monitoring
```bash
# Resource usage
docker stats

# Container logs
docker-compose logs -f chat4
```

#### Application Metrics
```bash
# Response time
curl -w "@{time_total}\n" -o /dev/null -s http://localhost:3000/api/health

# Memory usage
pm2 describe chat4
```

## 🔒 Security Considerations

### SSL/TLS

#### Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# FirewallD (CentOS)
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### Security Headers

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:; frame-src 'self';" always;
```

## 🔄 Updates and Maintenance

### Application Updates

#### Docker Updates
```bash
# Pull latest image
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

#### PM2 Updates
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Rebuild
npm run build

# Restart application
pm2 reload chat4
```

### Database Maintenance

#### SQLite
```bash
# Backup database
sqlite3 db/custom.db ".backup backup/custom_$(date +%Y%m%d).db"

# Vacuum database
sqlite3 db/custom.db "VACUUM;"

# Reindex database
sqlite3 db/custom.db "REINDEX;"
```

#### PostgreSQL
```bash
# Backup
pg_dump -h localhost -U chat4 chat4 > backup/chat4_$(date +%Y%m%d).sql

# Vacuum
psql -h localhost -U chat4 -d chat4 -c "VACUUM;"

# Reindex
psql -h localhost -U chat4 -d chat4 -c "REINDEX;"
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
sudo lsof -i :3000

# Kill process
sudo kill -9 PID
```

#### Database Connection Issues
```bash
# Check database file
ls -la db/custom.db

# Check database permissions
chmod 644 db/custom.db

# Reset database
npm run db:reset
```

#### Memory Issues
```bash
# Check memory usage
free -h

# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### Ollama Connection Issues
```bash
# Check Ollama service
curl http://localhost:11434/api/tags

# Restart Ollama
sudo systemctl restart ollama
```

### Performance Issues

#### Slow Response Times
```bash
# Check database performance
npm run test:performance

# Monitor resources
htop

# Check logs for errors
pm2 logs chat4
```

#### High Memory Usage
```bash
# Check memory usage
pm2 describe chat4

# Restart application
pm2 restart chat4

# Optimize database
npm run db:reset
```

## 📈 Scaling Strategies

### Horizontal Scaling

#### Load Balancer
```nginx
upstream chat4_backend {
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
    server 10.0.0.3:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://chat4_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat4
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chat4
  template:
    metadata:
      labels:
        app: chat4
    spec:
      containers:
      - name: chat4
        image: your-registry/chat4:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Vertical Scaling

#### Server Requirements
- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB+ recommended)
- **Storage**: 10GB+ SSD
- **Network**: 100Mbps+ bandwidth

#### Database Optimization
```sql
-- Add indexes
CREATE INDEX idx_characters_theme ON characters(theme);
CREATE INDEX idx_characters_active ON characters(isActive) WHERE isActive = true;
CREATE INDEX idx_messages_room ON messages(chatRoomId) WHERE chatRoomId IS NOT NULL;
```

---

Choose the deployment option that best suits your needs and infrastructure. For most users, Docker deployment provides the best balance of simplicity and reliability. For high-traffic applications, consider cloud platform deployment with proper scaling and monitoring.