# 🚀 Google Cloud Deployment Guide
## Flight Inventory Management System

### **Prerequisites**
1. **Google Cloud Account** with billing enabled
2. **Google Cloud SDK** installed locally
3. **Node.js 18+** installed
4. **Git** for version control

---

## 📋 **Step-by-Step Deployment Process**

### **Phase 1: Google Cloud Setup**

#### 1.1 Create New Project
```bash
# Create new project
gcloud projects create flight-inventory-[your-unique-id] --name="Flight Inventory Management"

# Set as active project
gcloud config set project flight-inventory-[your-unique-id]

# Enable required APIs
gcloud services enable sqladmin.googleapis.com
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

#### 1.2 Create Cloud SQL Instance
```bash
# Create MySQL instance
gcloud sql instances create flight-inventory-db \
    --database-version=MYSQL_8_0 \
    --tier=db-f1-micro \
    --region=asia-southeast1 \
    --storage-size=10GB \
    --storage-type=SSD \
    --backup-start-time=02:00 \
    --enable-bin-log \
    --maintenance-window-day=SUN \
    --maintenance-window-hour=03

# Set root password
gcloud sql users set-password root \
    --host=% \
    --instance=flight-inventory-db \
    --password=[your-secure-password]

# Create application database
gcloud sql databases create flight_inventory \
    --instance=flight-inventory-db
```

#### 1.3 Import Database Schema
```bash
# Upload schema file to Cloud Storage (create bucket first)
gsutil mb gs://flight-inventory-[your-unique-id]-sql
gsutil cp database/schema.sql gs://flight-inventory-[your-unique-id]-sql/

# Import schema to Cloud SQL
gcloud sql import sql flight-inventory-db \
    gs://flight-inventory-[your-unique-id]-sql/schema.sql \
    --database=flight_inventory
```

---

### **Phase 2: Backend Deployment**

#### 2.1 Update Configuration Files
```bash
# Navigate to backend directory
cd backend

# Update app.yaml with your project details
# Replace placeholders:
# - your-project-id → flight-inventory-[your-unique-id]
# - your-secure-password → actual password
# - region → asia-southeast1
```

#### 2.2 Install Dependencies & Deploy
```bash
# Install backend dependencies
npm install

# Deploy to App Engine
gcloud app deploy app.yaml --version=v1

# Deploy with specific settings
gcloud app deploy --quiet --promote --stop-previous-versions
```

#### 2.3 Verify Backend Deployment
```bash
# Test health endpoint
curl https://flight-inventory-[your-unique-id].appspot.com/health

# Expected response:
# {"status":"OK","timestamp":"2024-01-XX...","environment":"production"}
```

---

### **Phase 3: Frontend Deployment**

#### 3.1 Update Frontend Configuration
```javascript
// Update frontend/config.js
const config = {
  API_BASE_URL: 'https://flight-inventory-[your-unique-id].appspot.com/api'
  // ... rest of config
};
```

#### 3.2 Deploy Frontend to Firebase Hosting (Alternative Option)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase in project root
firebase init hosting

# Configure firebase.json
{
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/**",
        "destination": "https://flight-inventory-[your-unique-id].appspot.com/api/**"
      }
    ]
  }
}

# Deploy to Firebase
firebase deploy --only hosting
```

---

### **Phase 4: Domain & SSL Setup**

#### 4.1 Custom Domain (Optional)
```bash
# Add custom domain to App Engine
gcloud app domain-mappings create flight-inventory.yourdomain.com \
    --certificate-management=AUTOMATIC

# Update DNS records as instructed by Google Cloud
```

#### 4.2 SSL Certificate
```bash
# SSL is automatically managed by Google Cloud for App Engine and Firebase
# No additional configuration needed
```

---

## 🔧 **Environment Variables & Security**

### Backend Environment Variables (.env)
```env
NODE_ENV=production
DB_HOST=/cloudsql/flight-inventory-[your-unique-id]:asia-southeast1:flight-inventory-db
DB_USER=root
DB_PASSWORD=[your-secure-password]
DB_NAME=flight_inventory
FRONTEND_URL=https://flight-inventory-[your-unique-id].web.app
```

### Security Best Practices
- ✅ Root password should be complex (20+ characters)
- ✅ Enable Cloud SQL SSL connections
- ✅ Use Cloud IAM for access control
- ✅ Regular database backups (configured automatically)
- ✅ Monitor with Cloud Logging

---

## 📊 **Database Connection & Testing**

### Connect to Cloud SQL (for debugging)
```bash
# Connect via Cloud SQL Proxy
cloud_sql_proxy -instances=flight-inventory-[your-unique-id]:asia-southeast1:flight-inventory-db=tcp:3306

# Connect with MySQL client
mysql -h 127.0.0.1 -u root -p flight_inventory
```

### Test API Endpoints
```bash
# Get all flights
curl https://flight-inventory-[your-unique-id].appspot.com/api/flights

# Get PNR data
curl https://flight-inventory-[your-unique-id].appspot.com/api/pnr

# Health check
curl https://flight-inventory-[your-unique-id].appspot.com/health
```

---

## 💰 **Cost Estimation (Monthly)**

| Service | Configuration | Estimated Cost |
|---------|---------------|----------------|
| Cloud SQL | db-f1-micro, 10GB | $7-12 USD |
| App Engine | F1 instance | $0-5 USD |
| Firebase Hosting | 1GB bandwidth | $0-2 USD |
| **Total** | **Small usage** | **$7-19 USD** |

---

## 🔄 **Backup & Maintenance**

### Automated Backups
```bash
# Backups are automatically configured
# Verify backup settings
gcloud sql instances describe flight-inventory-db

# Manual backup
gcloud sql backups create --instance=flight-inventory-db
```

### Update Deployment
```bash
# Update backend
cd backend
gcloud app deploy --version=v2

# Update frontend
firebase deploy --only hosting
```

---

## 🚨 **Troubleshooting**

### Common Issues

**Database Connection Failed**
```bash
# Check Cloud SQL status
gcloud sql instances list

# Check logs
gcloud app logs tail -s default
```

**App Engine Deployment Failed**
```bash
# Check build logs
gcloud builds list

# Describe specific build
gcloud builds describe [BUILD-ID]
```

**Frontend API Calls Failing**
- Verify CORS settings in backend
- Check API_BASE_URL in frontend config
- Ensure App Engine is running

---

## 📈 **Monitoring & Analytics**

### Enable Monitoring
```bash
# Enable Cloud Monitoring API
gcloud services enable monitoring.googleapis.com

# View metrics in Cloud Console:
# https://console.cloud.google.com/monitoring
```

### Performance Monitoring
- **Response Times**: Monitor API endpoint performance
- **Database Queries**: Optimize slow queries
- **Error Rates**: Track 4xx/5xx responses
- **Resource Usage**: CPU, Memory, Storage

---

## 🎯 **Production Checklist**

- [ ] ✅ Cloud SQL instance created and configured
- [ ] ✅ Database schema imported successfully  
- [ ] ✅ Backend deployed to App Engine
- [ ] ✅ Frontend deployed to Firebase/App Engine
- [ ] ✅ API endpoints responding correctly
- [ ] ✅ Database connections working
- [ ] ✅ SSL certificates configured
- [ ] ✅ Monitoring and logging enabled
- [ ] ✅ Backup strategy in place
- [ ] ✅ Cost monitoring setup

---

**🎊 Congratulations!** Your Flight Inventory Management System is now running on Google Cloud with centralized database access from anywhere in the world! 