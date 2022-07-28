#!/bin/sh
DEPLOY_ENV=staging

HEAD=$(git rev-parse HEAD)
CONTAINER_NAME=$(grep CONTAINER_NAME .env.${DEPLOY_ENV} | cut -d '=' -f2)
ARTIFACT_REPO_NAME=$(grep ARTIFACT_REPO_NAME .env.${DEPLOY_ENV} | cut -d '=' -f2)
TAG_ROOT=us-central1-docker.pkg.dev/$ARTIFACT_REPO_NAME/nameless/$CONTAINER_NAME

echo "HEAD: $HEAD"

docker build . -t $TAG_ROOT:$HEAD -t $TAG_ROOT:latest