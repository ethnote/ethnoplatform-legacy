# Host Ethnote Yourself

Ethnote is open source and you can host it yourself. This is a guide to help you get started.

Start by cloning the repository:

```bash
git clone git@github.com:ethnote/ethnote.git
```

Ethnote uses different cloud providers to store data and run the application. You will need to create accounts with the following providers:

- Google Cloud
- AWS
- PubNub
- Supabase (or another database provider)

## Google Cloud

To initialize a new Google Cloud project, run the following commmands:

```bash
# Login to your Google Cloud account
gcloud auth login

# Create project
gcloud projects create ethnote-clone --name='Ethnote - Clone'

 # Set the project
gcloud config set project ethnote-clone

# Enable billing
gcloud services enable cloudbilling.googleapis.com --project=ethnote-clone # Enable billing

# Setup billing
gcloud beta billing projects link ethnote-clone --billing-account xxxxxx-xxxxxx-xxxxxx

# Create service account
gcloud iam service-accounts create service-account --display-name="Service Account" --project=ethnote-clone

# Grant access to project
gcloud projects add-iam-policy-binding ethnote-clone --member="serviceAccount:service-account@ethnote-clone.iam.gserviceaccount.com" --role="roles/owner"

# Generate private key
gcloud iam service-accounts keys create delete-once-uploaded-ethnote-clone.json --iam-account=service-account@ethnote-clone.iam.gserviceaccount.com

# Enable Cloud Run Admin API
gcloud services enable run.googleapis.com

# Enable Artifact Registry API
gcloud services enable artifactregistry.googleapis.com
```

We will use the service account in the Github Action

### Google Artifact Registry

Ethnote uses Google Artifact Registry to store the Docker image.

### Google Cloud Run

Ethnote uses Google Cloud Run to run the Docker image.

## AWS

### S3

Ethnote uses S3 to store the data.

The bucket needs the following Cross-origin resource sharing (CORS):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedOrigins": ["*"], // Change this to your domain
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

Create a user to read and write to the s3 bucket with the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListObjectsInBucket",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": ["arn:aws:s3:::your-bucket"]
    },
    {
      "Sid": "AllObjectActions",
      "Effect": "Allow",
      "Action": "s3:*Object",
      "Resource": ["arn:aws:s3:::your-bucket/*"]
    }
  ]
}
```

### SES

Ethnote uses SES to send emails.

Create a IAM user with the following permission:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ses:SendRawEmail",
      "Resource": "*"
    }
  ]
}
```

## PubNub

Ethnote uses PubNub to send messages between devices in real time.

## Supabase

Ethnote uses Supabase to store the data. The type of database is PostgreSQL.

## Variables

Ethnote uses Github Actions to build and deploy the Docker image to Google Cloud Run.

The necessary variables are:

### Google Cloud

GCLOUD_SERVICE_ACCOUNT (from the step above)

### Supabase

DATABASE_URL (Supabase can be used to create a database)

### Nextjs

NEXT_SECRET (can be generated with `openssl rand -hex 64`)

NEXTAUTH_SECRET (can be generated with `openssl rand -hex 64`)

NEXTAUTH_URL (the url of the website)

### AWS

SERVER_AWS_REGION (the region of the S3 bucket)

SERVER_AWS_S3_BUCKET_NAME (the name of the S3 bucket)

SERVER_AWS_S3_ACCESS_KEY_ID (the access key of the S3 user)

SERVER_AWS_S3_SECRET_ACCESS_KEY (the secret access key of the S3 user)

SERVER_AWS_SES_ACCESS_KEY_ID (the access key of the SES user)

SERVER_AWS_SES_ACCESS_KEY_SECRET (the secret access key of the SES user)

### Pubnub

PUBNUB_SECRET_KEY (can be created in the PubNub dashboard)

### Public

NEXT_PUBLIC_PUBNUB_PUBLISH_KEY (can be created in the PubNub dashboard)

NEXT_PUBLIC_PUBNUB_SUBSCRIBE_KEY (can be created in the PubNub dashboard)

NEXT_PUBLIC_PUBNUB_USER_ID

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (can be created in the Google Cloud dashboard)

The secrets should be added to the Github repository.
