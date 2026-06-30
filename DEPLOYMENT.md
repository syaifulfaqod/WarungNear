# Deployment Guide - Jagoan Hosting VPS

This guide outlines the step-by-step process to deploy the **WarungNear** application to a Jagoan Hosting VPS (Ubuntu 20.04/22.04 LTS).

---

## Prerequisites

Before starting, ensure you have:
1. VPS SSH root credentials.
2. A Domain name pointed to your VPS IP address (DNS A Records: `yourdomain.com` and `api.yourdomain.com` or similar subdomain).

---

## 1. System Setup & Package Installations

Connect to your VPS via SSH and install system dependencies:

```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install Node.js (Version 20.x)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
node -v
npm -v

# Install git, nginx, and pm2 globally
sudo apt install -y git nginx
sudo npm install -y pm2 -g
```

---

## 2. PostgreSQL Database Setup

Install PostgreSQL and create the production database:

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to the postgres system user and log in to the database shell
sudo -i -u postgres psql
```

Inside the PostgreSQL terminal (`psql`), execute:

```sql
-- Create database user
CREATE USER warungnear_user WITH PASSWORD 'secure_password_here';

-- Create database
CREATE DATABASE warungnear_db OWNER warungnear_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE warungnear_db TO warungnear_user;

-- Exit shell
\q
```

---

## 3. Clone Repository & Install Dependencies

Clone the project into `/var/www/warungnear`:

```bash
# Create directory and set permissions
sudo mkdir -p /var/www/warungnear
sudo chown -R $USER:$USER /var/www/warungnear

# Clone repository
git clone https://github.com/syaifulfaqod/WarungNear.git /var/www/warungnear

# Navigate to project root
cd /var/www/warungnear

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

---

## 4. Environment Configurations (.env)

### A. Configure Backend Environment

Copy `.env.example` to `.env` inside the `backend` folder and populate it:

```bash
cd /var/www/warungnear/backend
cp .env.example .env
nano .env
```

Set the variables:
```ini
PORT=5000
DATABASE_URL="postgresql://warungnear_user:secure_password_here@localhost:5432/warungnear_db?schema=public"
JWT_SECRET="generate_a_secure_jwt_random_string_key"
FRONTEND_URL="https://yourdomain.com,http://yourdomain.com"
UPLOAD_DIR="/var/www/warungnear/backend/uploads"
```

### B. Configure Frontend Environment

Copy `.env.example` to `.env` inside the `frontend` folder and populate it:

```bash
cd /var/www/warungnear/frontend
cp .env.example .env
nano .env
```

Set the variables:
```ini
VITE_API_URL="https://api.yourdomain.com/api"
VITE_SOCKET_URL="https://api.yourdomain.com"
```

---

## 5. Database Seeding & Migration

With PostgreSQL active, deploy the migrations to setup the schema and seed the initial Admin account:

```bash
cd /var/www/warungnear/backend

# Generate Prisma Client
npx prisma generate

# Apply migrations to database
npx prisma migrate deploy

# Seed default admin user & subscription plans
npx prisma db seed
```

---

## 6. Build Frontend for Production

Compile Vite static assets:

```bash
cd /var/www/warungnear/frontend
npm run build
```

This compiles static assets into `/var/www/warungnear/frontend/dist`. Nginx will serve these files directly.

---

## 7. Setup PM2 Process Manager

PM2 will run the backend server in the background and automatically restart it on crashes or system reboots.

Run the ecosystem config from the project root:

```bash
cd /var/www/warungnear

# Start backend application
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 startup script on OS boot
pm2 startup
```

---

## 8. Configure Nginx Reverse Proxy & Static Hosting

Configure Nginx to serve the compiled frontend React app directly, and reverse proxy `/api` and Socket.IO requests to the Node.js backend.

Create a new Nginx block:

```bash
sudo nano /etc/nginx/sites-available/warungnear
```

Insert the configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Serve React Static Frontend files
    location / {
        root /var/www/warungnear/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # Reverse proxy backend requests
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve Uploaded Assets directly via Nginx for speed
    location /uploads/ {
        alias /var/www/warungnear/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}
```

Enable the site block and restart Nginx:

```bash
# Link to active sites
sudo ln -s /etc/nginx/sites-available/warungnear /etc/nginx/sites-enabled/

# Test configuration syntax
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 9. Secure with SSL Certbot (HTTPS)

Apply free Let's Encrypt SSL certificates using Certbot:

```bash
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Request and apply certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

Select option to redirect all HTTP traffic to HTTPS. Nginx is now fully configured!
