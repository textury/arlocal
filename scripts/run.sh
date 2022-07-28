#!/bin/sh
DEPLOY_ENV=$1

HEAD=$(git rev-parse HEAD)
CONTAINER_NAME=$(grep CONTAINER_NAME .env.${DEPLOY_ENV} | cut -d '=' -f2)
ARTIFACT_REPO_NAME=$(grep ARTIFACT_REPO_NAME .env.${DEPLOY_ENV} | cut -d '=' -f2)
PROJECT_ID=$(grep PROJECT_ID .env.${DEPLOY_ENV} | cut -d '=' -f2)

echo "HEAD: $HEAD"

docker run us-central1-docker.pkg.dev/$ARTIFACT_REPO_NAME/nameless/$CONTAINER_NAME:$HEAD reaper -e --gcpProject $PROJECT_ID -e --storageFolder $STORAGE_FOLDER