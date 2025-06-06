#!/bin/bash

# 🚀 Flight Inventory Management - Google Cloud Deployment Script
# This script automates the deployment process to Google Cloud

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=""
DB_PASSWORD=""
REGION="asia-southeast1"

echo -e "${BLUE}🚀 Flight Inventory Management - Google Cloud Deployment${NC}"
echo "=================================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud SDK is not installed. Please install it first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID from user if not set
if [ -z "$PROJECT_ID" ]; then
    echo -n "Enter your Google Cloud Project ID: "
    read PROJECT_ID
fi

# Get database password if not set
if [ -z "$DB_PASSWORD" ]; then
    echo -n "Enter a secure password for Cloud SQL (20+ characters): "
    read -s DB_PASSWORD
    echo
fi

print_info "Using Project ID: $PROJECT_ID"
print_info "Using Region: $REGION"

# Step 1: Set project and enable APIs
print_info "Step 1: Setting up Google Cloud project..."
gcloud config set project $PROJECT_ID

print_info "Enabling required APIs..."
gcloud services enable sqladmin.googleapis.com appengine.googleapis.com cloudbuild.googleapis.com

print_status "Project setup completed"

# Step 2: Create Cloud SQL instance
print_info "Step 2: Creating Cloud SQL instance..."
if gcloud sql instances describe flight-inventory-db --project=$PROJECT_ID &> /dev/null; then
    print_warning "Cloud SQL instance already exists, skipping creation"
else
    gcloud sql instances create flight-inventory-db \
        --database-version=MYSQL_8_0 \
        --tier=db-f1-micro \
        --region=$REGION \
        --storage-size=10GB \
        --storage-type=SSD \
        --backup-start-time=02:00 \
        --enable-bin-log \
        --maintenance-window-day=SUN \
        --maintenance-window-hour=03 \
        --project=$PROJECT_ID
    
    print_status "Cloud SQL instance created"
fi

# Set root password
print_info "Setting database root password..."
gcloud sql users set-password root \
    --host=% \
    --instance=flight-inventory-db \
    --password=$DB_PASSWORD \
    --project=$PROJECT_ID

# Create database
print_info "Creating application database..."
if gcloud sql databases describe flight_inventory --instance=flight-inventory-db --project=$PROJECT_ID &> /dev/null; then
    print_warning "Database already exists, skipping creation"
else
    gcloud sql databases create flight_inventory \
        --instance=flight-inventory-db \
        --project=$PROJECT_ID
    print_status "Database created"
fi

# Step 3: Upload and import schema
print_info "Step 3: Importing database schema..."
BUCKET_NAME="flight-inventory-$PROJECT_ID-sql"

# Create bucket if it doesn't exist
if gsutil ls -b gs://$BUCKET_NAME &> /dev/null; then
    print_warning "Storage bucket already exists"
else
    gsutil mb gs://$BUCKET_NAME
    print_status "Storage bucket created"
fi

# Upload schema
gsutil cp database/schema.sql gs://$BUCKET_NAME/
print_status "Schema uploaded to Cloud Storage"

# Import schema
gcloud sql import sql flight-inventory-db \
    gs://$BUCKET_NAME/schema.sql \
    --database=flight_inventory \
    --project=$PROJECT_ID

print_status "Database schema imported successfully"

# Step 4: Update configuration files
print_info "Step 4: Updating configuration files..."
DB_CONNECTION_NAME="$PROJECT_ID:$REGION:flight-inventory-db"

# Update app.yaml
sed -i.bak "s/your-project-id/$PROJECT_ID/g" backend/app.yaml
sed -i.bak "s/your-secure-password/$DB_PASSWORD/g" backend/app.yaml
sed -i.bak "s/asia-southeast1/$REGION/g" backend/app.yaml

print_status "Backend configuration updated"

# Update frontend config
sed -i.bak "s/your-project-id/$PROJECT_ID/g" frontend/config.js

print_status "Frontend configuration updated"

# Step 5: Deploy backend
print_info "Step 5: Deploying backend to App Engine..."
cd backend

# Install dependencies
npm install

# Deploy to App Engine
gcloud app deploy app.yaml \
    --version=v1 \
    --quiet \
    --promote \
    --stop-previous-versions \
    --project=$PROJECT_ID

cd ..
print_status "Backend deployed successfully"

# Step 6: Test deployment
print_info "Step 6: Testing deployment..."
BACKEND_URL="https://$PROJECT_ID.appspot.com"

print_info "Waiting for backend to be ready..."
sleep 30

# Test health endpoint
if curl -f "$BACKEND_URL/health" &> /dev/null; then
    print_status "Backend health check passed"
else
    print_warning "Backend health check failed, but deployment may still be successful"
fi

# Step 7: Display results
echo
echo "=================================================="
print_status "🎉 Deployment completed successfully!"
echo
print_info "📊 Your application URLs:"
echo "   Backend API: $BACKEND_URL"
echo "   Health Check: $BACKEND_URL/health"
echo "   Flight API: $BACKEND_URL/api/flights"
echo "   PNR API: $BACKEND_URL/api/pnr"
echo
print_info "📋 Next steps:"
echo "   1. Update your frontend to use the new API URL"
echo "   2. Test all API endpoints"
echo "   3. Deploy frontend to Firebase Hosting (optional)"
echo "   4. Set up monitoring and alerts"
echo
print_info "💰 Estimated monthly cost: $7-19 USD"
print_info "📚 Full documentation: deploy/setup-google-cloud.md"
echo
print_status "✨ Your Flight Inventory Management System is now live on Google Cloud!"

# Cleanup backup files
rm -f backend/app.yaml.bak frontend/config.js.bak

print_info "�� Cleanup completed" 