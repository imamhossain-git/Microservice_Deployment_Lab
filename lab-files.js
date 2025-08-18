/** @satisfies {import('@webcontainer/api').FileSystemTree} */

export const labFiles = {
  // DevOps Configuration Files
  '.gitignore': {
    file: {
      contents: `# Dependencies
node_modules/
npm-debug.log*

# Environment variables
.env
.env.local
.env.production

# Docker
.dockerignore

# Kubernetes
*.kubeconfig

# Logs
logs/
*.log

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db`
    }
  },

  'Makefile': {
    file: {
      contents: `# DevOps Makefile for Microservice Deployment

.PHONY: help build test deploy clean

# Variables
IMAGE_NAME = user-service
IMAGE_TAG = v1.0.0
REGISTRY = your-registry.com
NAMESPACE = production

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \\033[36m%-15s\\033[0m %s\\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker image
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(IMAGE_NAME):latest

test: ## Run tests
	npm test
	docker run --rm $(IMAGE_NAME):$(IMAGE_TAG) npm test

push: ## Push image to registry
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)
	docker push $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

deploy-local: ## Deploy locally with Docker Compose
	docker-compose up -d

deploy-k8s: ## Deploy to Kubernetes
	kubectl apply -f k8s/
	kubectl rollout status deployment/$(IMAGE_NAME) -n $(NAMESPACE)

scale: ## Scale deployment
	kubectl scale deployment $(IMAGE_NAME) --replicas=3 -n $(NAMESPACE)

logs: ## View application logs
	kubectl logs -f deployment/$(IMAGE_NAME) -n $(NAMESPACE)

clean: ## Clean up resources
	docker-compose down
	docker rmi $(IMAGE_NAME):$(IMAGE_TAG) $(IMAGE_NAME):latest || true

monitor: ## Open monitoring dashboard
	kubectl port-forward svc/grafana 3000:3000 -n monitoring`
    }
  },

  // Kubernetes Manifests
  'k8s/namespace.yaml': {
    file: {
      contents: `apiVersion: v1
kind: Namespace
metadata:
  name: microservice
  labels:
    name: microservice
    environment: production`
    }
  },

  'k8s/deployment.yaml': {
    file: {
      contents: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: microservice
  labels:
    app: user-service
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
        version: v1
    spec:
      containers:
      - name: user-service
        image: user-service:v1.0.0
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
      imagePullSecrets:
      - name: registry-credentials`
    }
  },

  'k8s/service.yaml': {
    file: {
      contents: `apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: microservice
  labels:
    app: user-service
spec:
  selector:
    app: user-service
  ports:
  - name: http
    port: 80
    targetPort: 3000
    protocol: TCP
  type: ClusterIP`
    }
  },

  'k8s/ingress.yaml': {
    file: {
      contents: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: user-service-ingress
  namespace: microservice
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: api-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /api/users
        pathType: Prefix
        backend:
          service:
            name: user-service
            port:
              number: 80`
    }
  },

  'k8s/hpa.yaml': {
    file: {
      contents: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
  namespace: microservice
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max`
    }
  },

  // CI/CD Pipeline
  '.github/workflows/deploy.yml': {
    file: {
      contents: `name: Deploy Microservice

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: user-service

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run security audit
      run: npm audit --audit-level high

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: \${{ env.REGISTRY }}
        username: \${{ github.actor }}
        password: \${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: \${{ env.REGISTRY }}/\${{ github.repository }}/\${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: \${{ steps.meta.outputs.tags }}
        labels: \${{ steps.meta.outputs.labels }}
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: \${{ env.REGISTRY }}/\${{ github.repository }}/\${{ env.IMAGE_NAME }}:main
        format: 'sarif'
        output: 'trivy-results.sarif'

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure kubectl
      uses: azure/k8s-set-context@v1
      with:
        method: kubeconfig
        kubeconfig: \${{ secrets.KUBE_CONFIG }}
    
    - name: Deploy to Kubernetes
      run: |
        kubectl apply -f k8s/
        kubectl rollout status deployment/user-service -n microservice
    
    - name: Verify deployment
      run: |
        kubectl get pods -n microservice
        kubectl get services -n microservice`
    }
  },
  // Basic Node.js microservice structure
  'package.json': {
    file: {
      contents: `{
  "name": "microservice-lab",
  "version": "1.0.0",
  "description": "Hands-on microservice deployment lab",
  "main": "app.js",
  "type": "commonjs",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "test": "jest",
    "docker:build": "docker build -t microservice-lab .",
    "docker:run": "docker run -p 3000:3000 microservice-lab"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.2",
    "supertest": "^6.3.3"
  },
  "keywords": ["microservice", "docker", "nodejs", "express", "lab"],
  "author": "DevDive Lab",
  "license": "MIT"
}`
    }
  },
  
  'app.js': {
    file: {
      contents: `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory data store (for demo purposes)
let users = [
  { id: '1', name: 'John Doe', email: 'john@example.com', createdAt: new Date().toISOString() },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date().toISOString() }
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: users,
    count: users.length
  });
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  res.json({
    success: true,
    data: user
  });
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Name and email are required'
    });
  }
  
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  
  res.status(201).json({
    success: true,
    data: newUser
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Welcome to the Microservice Lab!',
    service: 'User Service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      users: '/api/users',
      userById: '/api/users/:id'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(\`🚀 User Service running on port \${PORT}\`);
  console.log(\`📊 Health check: http://localhost:\${PORT}/health\`);
  console.log(\`👥 Users API: http://localhost:\${PORT}/api/users\`);
});

module.exports = app;`
    }
  },
  
  'Dockerfile': {
    file: {
      contents: `# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S microservice -u 1001

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Change ownership of the app directory to the nodejs user
RUN chown -R microservice:nodejs /app

# Switch to the non-root user
USER microservice

# Expose the port the app runs on
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node healthcheck.js

# Define the command to run the application
CMD ["npm", "start"]`
    }
  },
  
  'docker-compose.yml': {
    file: {
      contents: `version: '3.8'

services:
  # User Service
  user-service:
    build: 
      context: .
      dockerfile: Dockerfile
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=microservices
      - DB_USER=postgres
      - DB_PASSWORD=password123
    depends_on:
      - postgres
      - redis
    networks:
      - microservice-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Database
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=microservices
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - microservice-network
    restart: unless-stopped

  # Redis for caching
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - microservice-network
    restart: unless-stopped

  # Load Balancer (Nginx)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - user-service
    networks:
      - microservice-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  microservice-network:
    driver: bridge`
    }
  },
  
  'healthcheck.js': {
    file: {
      contents: `const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();`
    }
  },
  
  'nginx.conf': {
    file: {
      contents: `events {
    worker_connections 1024;
}

http {
    upstream user_service {
        server user-service:3000;
    }

    server {
        listen 80;
        
        location / {
            proxy_pass http://user_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        location /health {
            access_log off;
            proxy_pass http://user_service/health;
        }
    }
}`
    }
  },
  
  'init.sql': {
    file: {
      contents: `-- Initialize database schema for microservices lab

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (name, email) VALUES 
    ('John Doe', 'john@example.com'),
    ('Jane Smith', 'jane@example.com'),
    ('Bob Johnson', 'bob@example.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO orders (user_id, product_name, quantity, price, status) VALUES 
    (1, 'Laptop', 1, 999.99, 'completed'),
    (2, 'Mouse', 2, 25.50, 'pending'),
    (1, 'Keyboard', 1, 75.00, 'shipped')
ON CONFLICT DO NOTHING;`
    }
  },
  
  '.env.example': {
    file: {
      contents: `# Environment Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=microservices
DB_USER=postgres
DB_PASSWORD=password123

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# API Configuration
API_VERSION=v1
API_PREFIX=/api

# Logging
LOG_LEVEL=info`
    }
  },
  
  'README.md': {
    file: {
      contents: `# 🚀 Microservice Deployment Lab

Welcome to the hands-on microservice deployment lab! This interactive environment will teach you how to build, containerize, and deploy microservices using modern DevOps practices.

## 🎯 Learning Objectives

By completing this lab, you will learn:

- ✅ How to structure a microservice application
- ✅ Building RESTful APIs with Node.js and Express
- ✅ Containerizing applications with Docker
- ✅ Orchestrating multiple services with Docker Compose
- ✅ Implementing health checks and monitoring
- ✅ Scaling services and load balancing
- ✅ Database integration and management
- ✅ Security best practices

## 📚 Lab Steps

### Step 1: Environment Setup
- Initialize project structure
- Install dependencies
- Configure development environment

### Step 2: Create Your First Microservice
- Build a Node.js service with Express
- Implement RESTful endpoints
- Add health checks and logging

### Step 3: Containerize the Service
- Write an optimized Dockerfile
- Build and test Docker images
- Implement security best practices

### Step 4: Service Orchestration
- Create docker-compose configuration
- Add database and caching services
- Configure service networking

### Step 5: Monitoring & Health Checks
- Implement comprehensive health checks
- Add metrics and logging
- Set up monitoring dashboards

### Step 6: Scaling & Load Balancing
- Scale services horizontally
- Configure load balancing
- Test auto-scaling policies

## 🛠️ Technologies Used

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Containerization**: Docker & Docker Compose
- **Load Balancer**: Nginx
- **Monitoring**: Built-in health checks

## 🚀 Quick Start

1. Follow the step-by-step instructions in the lab interface
2. Write code in the integrated editor
3. Test your services using the terminal
4. Monitor your progress with built-in checks

## 📖 API Documentation

### Health Check
\`\`\`
GET /health
\`\`\`

### Users API
\`\`\`
GET    /api/users     - List all users
POST   /api/users     - Create a new user
GET    /api/users/:id - Get user by ID
\`\`\`

## 🔧 Development Commands

\`\`\`bash
# Start the service
npm start

# Development mode with auto-reload
npm run dev

# Run tests
npm test

# Build Docker image
npm run docker:build

# Run Docker container
npm run docker:run

# Start all services with Docker Compose
docker-compose up -d

# Scale a service
docker-compose up --scale user-service=3
\`\`\`

## 🏗️ Architecture Overview

\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│    Nginx    │───▶│ User Service│
└─────────────┘    │Load Balancer│    │   (Node.js) │
                   └─────────────┘    └─────────────┘
                          │                   │
                          ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │    Redis    │    │ PostgreSQL  │
                   │   (Cache)   │    │ (Database)  │
                   └─────────────┘    └─────────────┘
\`\`\`

## 🎓 Best Practices Covered

- **Security**: Non-root containers, input validation, HTTPS
- **Performance**: Caching, connection pooling, optimization
- **Reliability**: Health checks, graceful shutdowns, retries
- **Observability**: Structured logging, metrics, monitoring
- **Scalability**: Horizontal scaling, load balancing

## 🤝 Contributing

This lab is designed for educational purposes. Feel free to experiment and modify the code to deepen your understanding!

## 📄 License

MIT License - Feel free to use this lab for educational purposes.

---

Happy learning! 🎉`
    }
  }
};