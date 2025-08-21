# 🌐 Microservice Deployment Lab

This project demonstrates a **CI/CD pipeline** for building and deploying a Dockerized Node JS Application using **GitHub Actions** and remote server deployment.

---

## ✨ Features

* 🐳 **Dockerized Application:** Easily build and run the microservice in any environment.
* ⚙️ **GitHub Actions CI/CD:** Automated build, push, and deployment pipeline.
* 🚀 **Remote Deployment:** Uses SSH to deploy the latest image to your server.

---

## 🔄 Workflow

### 1️⃣ Build & Push Docker Image

On manual trigger, GitHub Actions builds the Docker image and pushes it to Docker Hub.

```yaml
title: Build & Push Docker Image

- name: Checkout code
  uses: actions/checkout@v4

- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Log in to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKER_USERNAME }}
    password: ${{ secrets.DOCKER_TOKEN }}

- name: Build Docker image
  run: docker build -t ${{ secrets.DOCKER_USERNAME }}/microservice_deployment_lab:${{ github.sha }} .

- name: Push Docker image
  run: docker push ${{ secrets.DOCKER_USERNAME }}/microservice_deployment_lab:${{ github.sha }}
```

### 2️⃣ Remote Deployment

After a successful build, the workflow connects to your server via SSH and runs a deployment script.

```yaml
title: Remote Deployment

- name: Deploy to remote server
  uses: appleboy/ssh-action@v0.1.0
  with:
    host: ${{ secrets.SERVER_IP }}
    username: ${{ secrets.SERVER_USER }}
    key: ${{ secrets.SERVER_SSH_KEY }}
    script: |
      bash /home/ubuntu/manual-deployment.sh ${{ github.sha }}
```

---

## 🛠 Usage

### ✅ Prerequisites

* 🐳 Docker installed locally and on your server.
* 🌍 A remote server accessible via SSH.
* 🔑 Docker Hub account.
* 🔐 GitHub repository secrets set:

  * `DOCKER_USERNAME`
  * `DOCKER_TOKEN`
  * `SERVER_IP`
  * `SERVER_USER`
  * `SERVER_SSH_KEY`

### ▶️ Manual Trigger

Go to the **Actions** tab in your GitHub repository, select the workflow, and click **Run workflow**.

### 📜 Deployment Script

Ensure your server has a script (e.g., `manual-deployment.sh`) in `/home/ubuntu` that pulls and runs the new Docker image.

Example script:

```sh
#!/bin/bash

echo "🚀 Deploying Docker container..."
IMAGE_NAME=imam2000/microservice_deployment_lab:$1

docker rm -f microservice_deployment_lab || true

docker run -d \
  --name=microservice_deployment_lab \
  --restart=always \
  -p 80:4173 \
  $IMAGE_NAME

echo "✅ Deployment Done"
```

---

## 📄 License

MIT © YourName
