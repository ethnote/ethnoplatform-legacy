#!/bin/bash
# Log in
# gcloud auth login

# Create project
gcloud projects create ethnote-production --name='Ethnote - Production'

# Set project as core project
gcloud config set project ethnote-production

# Enable billing
gcloud services enable cloudbilling.googleapis.com --project=ethnote-production

# Setup billing
gcloud beta billing projects link ethnote-production --billing-account 01CE37-254075-4044AF

# Create service account
gcloud iam service-accounts create service-account --display-name="Service Account" --project=ethnote-production

# Grant access to project
gcloud projects add-iam-policy-binding ethnote-production --member="serviceAccount:service-account@ethnote-production.iam.gserviceaccount.com" --role="roles/owner"

# Generate private key
gcloud iam service-accounts keys create delete-once-uploaded-ethnote-production.json --iam-account=service-account@ethnote-production.iam.gserviceaccount.com

# Enable Cloud Run Admin API
gcloud services enable run.googleapis.com

# Enable Cloud Scheduler API
gcloud services enable cloudscheduler.googleapis.com

# Enable Container Registry API
gcloud services enable artifactregistry.googleapis.com

# Add secrets to Github
# GCP_SA_KEY_STAGING ./delete-once-uploaded.json
