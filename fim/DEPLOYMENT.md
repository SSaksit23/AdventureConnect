# 🚀 Flight Inventory Management - Cloud Deployment Guide

## Prerequisites

1. Install Google Cloud SDK
2. Create a Google Cloud Project
3. Enable required APIs:
   - Cloud SQL Admin API
   - Cloud Build API
   - App Engine API

## Step 1: Set Up Cloud SQL

1. Create a PostgreSQL instance:
```bash
gcloud sql instances create flight-inventory-db \
    --database-version=POSTGRES_14 \
    --tier=db-f1-micro \
    --region=asia-southeast1 \
    --root-password=YOUR_ROOT_PASSWORD
```

2. Create the database:
```bash
gcloud sql databases create flight_inventory \
    --instance=flight-inventory-db
```

3. Create a user:
```bash
gcloud sql users create flight_inventory_user \
    --instance=flight-inventory-db \
    --password=YOUR_USER_PASSWORD
```

## Step 2: Deploy Backend

1. Update environment variables:
```bash
# Edit backend/app.yaml
# Replace YOUR_CLOUD_SQL_CONNECTION_STRING with:
postgresql://flight_inventory_user:YOUR_USER_PASSWORD@/flight_inventory?host=/cloudsql/YOUR_PROJECT_ID:asia-southeast1:flight-inventory-db
```

2. Deploy to App Engine:
```bash
cd backend
gcloud app deploy
```

## Step 3: Deploy Frontend

1. Build the React app:
```bash
npm run build
```

2. Deploy to Cloud Storage:
```bash
# Create bucket
gsutil mb gs://flight-inventory-frontend

# Upload files
gsutil cp -r build/* gs://flight-inventory-frontend/

# Make bucket public
gsutil iam ch allUsers:objectViewer gs://flight-inventory-frontend

# Configure website
gsutil web set -m index.html -e index.html gs://flight-inventory-frontend
```

## Step 4: Set Up Domain (Optional)

1. Configure custom domain in App Engine
2. Set up SSL certificate
3. Configure DNS records

## Monitoring & Maintenance

1. View logs:
```bash
gcloud app logs tail
```

2. Monitor database:
```bash
gcloud sql instances describe flight-inventory-db
```

3. Scale resources:
```bash
gcloud app deploy --version=VERSION --no-promote
```

## Backup & Recovery

1. Create database backup:
```bash
gcloud sql backups create --instance=flight-inventory-db
```

2. Restore from backup:
```bash
gcloud sql backups restore BACKUP_ID --instance=flight-inventory-db
```

## Cost Optimization

- Use appropriate instance sizes
- Enable auto-scaling
- Monitor resource usage
- Set up budget alerts

## Security

1. Enable Cloud IAM
2. Set up service accounts
3. Configure firewall rules
4. Enable SSL/TLS
5. Regular security updates

## Support

For issues or questions:
1. Check Google Cloud Console
2. Review application logs
3. Contact Google Cloud Support 