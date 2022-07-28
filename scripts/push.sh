#!/bin/sh
DEPLOY_ENV=staging


# This does not deploy the local image tagged with "latest"
# as that should only be deployed by CI

HEAD=$(git rev-parse HEAD)
CONTAINER_NAME=$(grep CONTAINER_NAME .env.${DEPLOY_ENV} | cut -d '=' -f2)
ARTIFACT_REPO_NAME=$(grep ARTIFACT_REPO_NAME .env.${DEPLOY_ENV} | cut -d '=' -f2)

echo "HEAD: $HEAD"

docker push us-central1-docker.pkg.dev/$ARTIFACT_REPO_NAME/nameless/$CONTAINER_NAME:$HEAD