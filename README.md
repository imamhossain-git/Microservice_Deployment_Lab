# Microservice Deployment Lab

This project demonstrates a CI/CD pipeline for building and deploying a Dockerized microservice using GitHub Actions and remote server deployment.

## Features

- **Dockerized Application:** Easily build and run the microservice in any environment.
- **GitHub Actions CI/CD:** Automated build, push, and deployment pipeline.
- **Remote Deployment:** Uses SSH to deploy the latest image to your server.

## Workflow

1. **Build & Push Docker Image:**  
   On manual trigger, GitHub Actions builds the Docker image and pushes it to Docker Hub.

2. **Remote Deployment:**  
   After a successful build, the workflow connects to your server via SSH and runs a deployment script.

## Usage

### 1. Prerequisites

- Docker installed locally and on your server.
- A remote server accessible via SSH.
- Docker Hub account.
- GitHub repository secrets set:
  - `DOCKER_USERNAME`
  - `DOCKER_TOKEN`
  - `SERVER_IP`
  - `SERVER_USER`
  - `SERVER_SSH_KEY`

### 2. Manual Trigger

Go to the **Actions** tab in your GitHub repository, select the workflow, and click **Run workflow**.

### 3. Deployment Script

Ensure your server has a script (e.g., `manual-dployment.sh`) in `/home/ubuntu` that pulls and runs the new Docker image.

Example script:
```sh
#!/bin/bash
IMAGE="$1"
docker pull yourdockerusername/microservice_deployment_lab:$IMAGE
docker stop microservice_deployment_lab || true
docker rm microservice_deployment_lab || true
docker run -d --name microservice_deployment_lab yourdockerusername/microservice_deployment_lab:$IMAGE
```

## License

MIT