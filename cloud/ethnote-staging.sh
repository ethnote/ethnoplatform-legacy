#!/bin/bash
# Log in
# gcloud auth login

# Create project
gcloud projects create ethnote-staging --name='Ethnote - Staging'

# Set project as core project
gcloud config set project ethnote-staging

# Enable billing
gcloud services enable cloudbilling.googleapis.com --project=ethnote-staging

# Setup billing
gcloud beta billing projects link ethnote-staging --billing-account 01CE37-254075-4044AF

# Create service account
gcloud iam service-accounts create service-account --display-name="Service Account" --project=ethnote-staging

# Grant access to project
gcloud projects add-iam-policy-binding ethnote-staging --member="serviceAccount:service-account@ethnote-staging.iam.gserviceaccount.com" --role="roles/owner"

# Generate private key
gcloud iam service-accounts keys create delete-once-uploaded-ethnote-staging.json --iam-account=service-account@ethnote-staging.iam.gserviceaccount.com

# Enable Cloud Run Admin API
gcloud services enable run.googleapis.com

# Enable Cloud Scheduler API
gcloud services enable cloudscheduler.googleapis.com

# Enable Container Registry API
gcloud services enable artifactregistry.googleapis.com

# Add secrets to Github
# GCP_SA_KEY_STAGING ./delete-once-uploaded.json
