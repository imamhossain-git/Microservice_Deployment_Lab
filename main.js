import './style.css'
import { WebContainer } from '@webcontainer/api';
import { labFiles } from './lab-files';

/** @type {import('@webcontainer/api').WebContainer}  */
let webcontainerInstance;

// Lab state management
let currentStep = 0;
let labProgress = {
  completedSteps: [],
  currentLab: 'microservice-basics'
};

// Lab steps configuration
const labSteps = [
  {
    id: 'setup',
    title: 'DevOps Environment Setup',
    description: 'Set up your deployment pipeline and infrastructure tools',
    tasks: ['Initialize Git repository', 'Configure CI/CD pipeline', 'Set up Docker environment', 'Install kubectl and helm']
  },
  {
    id: 'containerization',
    title: 'Containerization Strategy',
    description: 'Build production-ready containers with multi-stage builds',
    tasks: ['Write optimized Dockerfile', 'Implement security scanning', 'Create container registry workflow', 'Set up image versioning']
  },
  {
    id: 'local-deployment',
    title: 'Local Deployment with Docker Compose',
    description: 'Deploy multi-service architecture locally',
    tasks: ['Configure service mesh', 'Set up monitoring stack', 'Implement service discovery', 'Configure load balancing']
  },
  {
    id: 'kubernetes-deploy',
    title: 'Kubernetes Deployment',
    description: 'Deploy microservices to Kubernetes cluster',
    tasks: ['Create K8s manifests', 'Configure ingress', 'Set up persistent volumes', 'Implement rolling updates']
  },
  {
    id: 'cicd-pipeline',
    title: 'CI/CD Pipeline Implementation',
    description: 'Automate build, test, and deployment processes',
    tasks: ['Configure GitHub Actions', 'Set up automated testing', 'Implement blue-green deployment', 'Configure rollback strategy']
  },
  {
    id: 'production-ops',
    title: 'Production Operations',
    description: 'Monitor, scale, and maintain production deployments',
    tasks: ['Set up Prometheus monitoring', 'Configure alerting', 'Implement auto-scaling', 'Practice incident response']
  }
];

window.addEventListener('load', async () => {
  initializeUI();
  
  // Initialize WebContainer
  webcontainerInstance = await WebContainer.boot();
  await webcontainerInstance.mount(labFiles);
  
  // Start the lab environment
  await setupLabEnvironment();
  
  // Initialize first step
  loadStep(0);
});

function initializeUI() {
  document.querySelector('#app').innerHTML = `
    <div class="lab-container">
      <!-- Header -->
      <header class="lab-header">
        <div class="header-content">
          <h1><i class="fas fa-cogs"></i> DevOps Microservice Deployment Lab</h1>
          <p>Production-Ready Deployment Practices for DevOps Engineers</p>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <div class="lab-content">
        <!-- Sidebar Navigation -->
        <nav class="lab-sidebar">
          <h3><i class="fas fa-list-ol"></i> Lab Steps</h3>
          <ul class="step-list">
            ${labSteps.map((step, index) => `
              <li class="step-item ${index === 0 ? 'active' : ''}" data-step="${index}">
                <div class="step-number">${index + 1}</div>
                <div class="step-info">
                  <h4>${step.title}</h4>
                  <p>${step.description}</p>
                </div>
                <div class="step-status">
                  <i class="fas fa-circle"></i>
                </div>
              </li>
            `).join('')}
          </ul>
        </nav>

        <!-- Main Lab Area -->
        <main class="lab-main">
          <!-- Instructions Panel -->
          <div class="instructions-panel">
            <div class="panel-header">
              <h2 id="current-step-title">Loading...</h2>
              <div class="step-counter">
                <span id="current-step-number">1</span> / ${labSteps.length}
              </div>
            </div>
            <div class="panel-content">
              <div id="step-description">Loading step...</div>
              <div class="task-list">
                <h4><i class="fas fa-tasks"></i> Tasks to Complete:</h4>
                <ul id="task-items"></ul>
              </div>
              <div class="step-actions">
                <button id="prev-step" class="btn btn-secondary" disabled>
                  <i class="fas fa-arrow-left"></i> Previous
                </button>
                <button id="next-step" class="btn btn-primary">
                  Next <i class="fas fa-arrow-right"></i>
                </button>
                <button id="check-step" class="btn btn-success">
                  <i class="fas fa-check"></i> Check Progress
                </button>
              </div>
            </div>
          </div>

          <!-- Code Editor -->
          <div class="editor-panel">
            <div class="panel-header">
              <h3><i class="fas fa-code"></i> Code Editor</h3>
              <div class="file-tabs">
                <button class="tab active" data-file="app.js">app.js</button>
                <button class="tab" data-file="Dockerfile">Dockerfile</button>
                <button class="tab" data-file="docker-compose.yml">docker-compose.yml</button>
              </div>
            </div>
            <div class="editor-content">
              <textarea id="code-editor" placeholder="Your code will appear here..."></textarea>
            </div>
          </div>

          <!-- Terminal -->
          <div class="terminal-panel">
            <div class="panel-header">
             <h3><i class="fas fa-terminal"></i> DevOps Shell</h3>
             <div class="terminal-controls">
               <button id="clear-terminal" class="btn btn-sm">Clear</button>
               <button id="new-session" class="btn btn-sm">New Session</button>
               <select id="shell-type" class="shell-select">
                 <option value="bash">bash</option>
                 <option value="zsh">zsh</option>
                 <option value="sh">sh</option>
               </select>
             </div>
            </div>
            <div class="terminal-content">
              <div id="terminal-output"></div>
              <div class="terminal-input">
               <span class="prompt">devops@lab:~/microservice$ </span>
                <input type="text" id="terminal-input" placeholder="Enter command...">
              </div>
            </div>
          </div>

          <!-- Preview -->
          <div class="preview-panel">
            <div class="panel-header">
             <h3><i class="fas fa-chart-line"></i> Deployment Dashboard</h3>
              <div class="preview-controls">
               <button id="refresh-dashboard" class="btn btn-sm">
                 <i class="fas fa-sync"></i> Refresh
               </button>
               <button id="view-logs" class="btn btn-sm">
                 <i class="fas fa-file-alt"></i> Logs
               </button>
               <button id="view-metrics" class="btn btn-sm">
                 <i class="fas fa-chart-bar"></i> Metrics
                </button>
              </div>
            </div>
            <div class="preview-content">
              <iframe id="service-preview" src="about:blank"></iframe>
            </div>
          </div>
        </main>
             <div id="deployment-dashboard">
               <div class="dashboard-grid">
                 <div class="metric-card">
                   <h4>Services Status</h4>
                   <div id="services-status">Loading...</div>
                 </div>
                 <div class="metric-card">
                   <h4>Container Health</h4>
                   <div id="container-health">Loading...</div>
                 </div>
                 <div class="metric-card">
                   <h4>Resource Usage</h4>
                   <div id="resource-usage">Loading...</div>
                 </div>
                 <div class="metric-card">
                   <h4>Recent Deployments</h4>
                   <div id="recent-deployments">Loading...</div>
                 </div>
               </div>
             </div>

      <!-- Help Modal -->
      <div id="help-modal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3><i class="fas fa-question-circle"></i> Lab Help</h3>
            <button class="close-modal">&times;</button>
          </div>
          <div class="modal-body">
            <h4>How to use this lab:</h4>
            <ul>
              <li>Follow the step-by-step instructions in the left panel</li>
              <li>Write code in the editor panel</li>
              <li>Run commands in the terminal</li>
              <li>Check your progress with the "Check Progress" button</li>
              <li>Preview your running services in the preview panel</li>
            </ul>
            <h4>Keyboard Shortcuts:</h4>
            <ul>
              <li><kbd>Ctrl + Enter</kbd> - Run terminal command</li>
              <li><kbd>Ctrl + S</kbd> - Save current file</li>
              <li><kbd>F5</kbd> - Refresh preview</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Step navigation
  document.getElementById('next-step').addEventListener('click', () => {
    if (currentStep < labSteps.length - 1) {
      loadStep(currentStep + 1);
    }
  });

  document.getElementById('prev-step').addEventListener('click', () => {
    if (currentStep > 0) {
      loadStep(currentStep - 1);
    }
  });

  // Step sidebar clicks
  document.querySelectorAll('.step-item').forEach((item, index) => {
    item.addEventListener('click', () => loadStep(index));
  });

  // Terminal input
  const terminalInput = document.getElementById('terminal-input');
  terminalInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      const command = e.target.value.trim();
      if (command) {
        await executeCommand(command);
        e.target.value = '';
      }
    }
  });

  // File tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const fileName = e.target.dataset.file;
      switchFile(fileName);
    });
  });

  // Check progress
  document.getElementById('check-step').addEventListener('click', checkStepProgress);

  // Clear terminal
  document.getElementById('clear-terminal').addEventListener('click', () => {
    document.getElementById('terminal-output').innerHTML = '';
  });

  // Refresh preview
  document.getElementById('refresh-preview').addEventListener('click', refreshPreview);

  // Code editor auto-save
  const codeEditor = document.getElementById('code-editor');
  codeEditor.addEventListener('input', debounce(saveCurrentFile, 1000));
}

function loadStep(stepIndex) {
  currentStep = stepIndex;
  const step = labSteps[stepIndex];
  
  // Update UI
  document.getElementById('current-step-title').textContent = step.title;
  document.getElementById('current-step-number').textContent = stepIndex + 1;
  document.getElementById('step-description').innerHTML = getStepInstructions(step.id);
  
  // Update task list
  const taskList = document.getElementById('task-items');
  taskList.innerHTML = step.tasks.map(task => `
    <li class="task-item">
      <i class="fas fa-circle task-status"></i>
      <span>${task}</span>
    </li>
  `).join('');
  
  // Update navigation buttons
  document.getElementById('prev-step').disabled = stepIndex === 0;
  document.getElementById('next-step').disabled = stepIndex === labSteps.length - 1;
  
  // Update sidebar
  document.querySelectorAll('.step-item').forEach((item, index) => {
    item.classList.toggle('active', index === stepIndex);
    if (index < stepIndex) {
      item.classList.add('completed');
    } else {
      item.classList.remove('completed');
    }
  });
  
  // Update progress bar
  const progress = ((stepIndex + 1) / labSteps.length) * 100;
  document.querySelector('.progress-fill').style.width = `${progress}%`;
  
  // Load step-specific files
  loadStepFiles(step.id);
}

function getStepInstructions(stepId) {
  const instructions = {
    'setup': `
      <h4>🔧 DevOps Environment Setup</h4>
      <p>Set up your complete DevOps toolchain for microservice deployment. This includes version control, containerization, and orchestration tools.</p>
      <div class="instruction-block">
        <h5>DevOps Tools to Configure:</h5>
        <ul>
          <li>Git repository initialization and branching strategy</li>
          <li>Docker Engine and Docker Compose setup</li>
          <li>Kubernetes CLI (kubectl) configuration</li>
          <li>Helm package manager installation</li>
          <li>CI/CD pipeline prerequisites</li>
        </ul>
      </div>
      <div class="code-example">
        <h5>🛠️ Essential Commands:</h5>
        <pre><code># Initialize Git repository
git init
git remote add origin &lt;repository-url&gt;

# Verify Docker installation
docker --version
docker-compose --version

# Check Kubernetes tools
kubectl version --client
helm version

# Set up development environment
export KUBECONFIG=~/.kube/config</code></pre>
      </div>
    `,
    'containerization': `
      <h4>🐳 Production Containerization Strategy</h4>
      <p>Learn advanced Docker techniques for building secure, optimized containers suitable for production deployment.</p>
      <div class="instruction-block">
        <h5>Advanced Docker Concepts:</h5>
        <ul>
          <li>Multi-stage builds for optimization</li>
          <li>Security scanning and vulnerability assessment</li>
          <li>Container registry management</li>
          <li>Image versioning and tagging strategies</li>
          <li>Distroless and minimal base images</li>
        </ul>
      </div>
      <div class="code-example">
        <h5>🔒 Production Dockerfile Example:</h5>
        <pre><code># Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM gcr.io/distroless/nodejs18-debian11
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
USER 1001
CMD ["app.js"]</code></pre>
      </div>
    `,
    'local-deployment': `
      <h4>🏗️ Local Multi-Service Deployment</h4>
      <p>Deploy a complete microservice architecture locally using Docker Compose with service mesh, monitoring, and load balancing.</p>
      <div class="instruction-block">
        <h5>Infrastructure Components:</h5>
        <ul>
          <li>Service mesh with Envoy proxy</li>
          <li>Prometheus + Grafana monitoring stack</li>
          <li>ELK stack for centralized logging</li>
          <li>Redis cluster for caching</li>
          <li>PostgreSQL with replication</li>
        </ul>
      </div>
      <div class="code-example">
        <h5>🚀 Deploy Complete Stack:</h5>
        <pre><code># Deploy all services
docker-compose up -d

# Scale specific services
docker-compose up --scale user-service=3

# Monitor service health
docker-compose ps
docker-compose logs -f user-service

# Check resource usage
docker stats</code></pre>
      </div>
    `,
    'kubernetes-deploy': `
      <h4>☸️ Kubernetes Production Deployment</h4>
      <p>Deploy your microservices to a Kubernetes cluster with proper resource management, ingress, and persistent storage.</p>
      <div class="instruction-block">
        <h5>Kubernetes Resources:</h5>
        <ul>
          <li>Deployments with rolling update strategy</li>
          <li>Services and ingress controllers</li>
          <li>ConfigMaps and Secrets management</li>
          <li>Persistent Volume Claims</li>
          <li>Horizontal Pod Autoscaler (HPA)</li>
        </ul>
      </div>
      <div class="code-example">
        <h5>🎯 Kubernetes Deployment Commands:</h5>
        <pre><code># Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get deployments
kubectl get pods -o wide

# Configure ingress
kubectl apply -f ingress.yaml

# Set up autoscaling
kubectl autoscale deployment user-service --cpu-percent=70 --min=2 --max=10</code></pre>
      </div>
    `,
    'cicd-pipeline': `
      <h4>🔄 CI/CD Pipeline Implementation</h4>
      <p>Build a complete CI/CD pipeline with automated testing, security scanning, and deployment strategies.</p>
      <div class="instruction-block">
        <h5>Pipeline Stages:</h5>
        <ul>
          <li>Automated testing (unit, integration, e2e)</li>
          <li>Security vulnerability scanning</li>
          <li>Container image building and scanning</li>
          <li>Blue-green deployment strategy</li>
          <li>Automated rollback on failure</li>
        </ul>
      </div>
      <div class="code-example">
        <h5>🚀 GitHub Actions Pipeline:</h5>
        <pre><code># Trigger deployment
git push origin main

# Monitor pipeline
gh workflow list
gh run list

# Manual deployment
gh workflow run deploy.yml

# Rollback if needed
kubectl rollout undo deployment/user-service</code></pre>
      </div>
    `,
    'production-ops': `
      <h4>🎯 Production Operations & SRE</h4>
      <p>Master production operations including monitoring, alerting, incident response, and performance optimization.</p>
      <div class="instruction-block">
        <h5>Production Operations:</h5>
        <ul>
          <li>Prometheus metrics and alerting rules</li>
          <li>Grafana dashboards and visualization</li>
          <li>Log aggregation and analysis</li>
          <li>Performance monitoring and optimization</li>
          <li>Incident response and post-mortems</li>
        </ul>
      </div>
      <div class="code-example">
        <h5>📊 Production Monitoring Commands:</h5>
        <pre><code># Check cluster health
kubectl top nodes
kubectl top pods

# View application logs
kubectl logs -f deployment/user-service

# Monitor metrics
curl http://prometheus:9090/metrics

# Scale based on load
kubectl scale deployment user-service --replicas=5</code></pre>
      </div>
    `
  };
  
  return instructions[stepId] || '<p>Step instructions loading...</p>';
}

async function setupLabEnvironment() {
  // Install dependencies
  addTerminalOutput('🚀 Setting up lab environment...');
  
  const installProcess = await webcontainerInstance.spawn('npm', ['install']);
  installProcess.output.pipeTo(new WritableStream({
    write(data) {
      addTerminalOutput(data);
    }
  }));
  
  await installProcess.exit;
  addTerminalOutput('✅ Environment setup complete!');
}

function loadStepFiles(stepId) {
  const stepFiles = {
    'setup': {
      'app.js': `// Welcome to the Microservice Lab!
// This is where you'll build your first microservice

console.log('🚀 Starting microservice development...');

// TODO: Initialize Express application
// TODO: Add basic middleware
// TODO: Create your first endpoint`,
      'Dockerfile': `# TODO: Create Dockerfile for your microservice
# Start with a Node.js base image
# Copy your application code
# Install dependencies
# Expose the port
# Define the startup command`,
      'docker-compose.yml': `# TODO: Define your microservice architecture
# Add services for:
# - Your application
# - Database
# - Any other dependencies`
    },
    'create-service': {
      'app.js': `const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// TODO: Add health check endpoint
// TODO: Add user management endpoints
// TODO: Add error handling middleware

app.listen(PORT, () => {
  console.log(\`🚀 User service running on port \${PORT}\`);
});`,
      'Dockerfile': `FROM node:18-alpine

# TODO: Complete the Dockerfile
# Set working directory
# Copy package files
# Install dependencies
# Copy source code
# Expose port
# Start the application`,
      'docker-compose.yml': `version: '3.8'

services:
  user-service:
    build: .
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=development
    # TODO: Add more configuration`
    }
    // Add more step files as needed
  };
  
  const files = stepFiles[stepId] || stepFiles['setup'];
  
  // Load the first file into editor
  const firstFile = Object.keys(files)[0];
  document.getElementById('code-editor').value = files[firstFile];
  
  // Update active tab
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.file === firstFile);
  });
}

function switchFile(fileName) {
  // Update active tab
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.file === fileName);
  });
  
  // Load file content (this would normally load from the file system)
  // For demo purposes, we'll show placeholder content
  const editor = document.getElementById('code-editor');
  editor.value = `// ${fileName}\n// File content will be loaded here...`;
}

async function executeCommand(command) {
  addTerminalOutput(`devops@lab:~/microservice$ ${command}`);
  
  try {
    // Enhanced command handling for DevOps tools
    let processCommand = command;
    let args = [];
    
    // Handle common DevOps commands
    if (command.startsWith('kubectl')) {
      // Simulate kubectl commands
      handleKubectlCommand(command);
      return;
    } else if (command.startsWith('docker')) {
      // Handle docker commands
      handleDockerCommand(command);
      return;
    } else if (command.startsWith('helm')) {
      // Handle helm commands
      handleHelmCommand(command);
      return;
    } else if (command.startsWith('git')) {
      // Handle git commands
      handleGitCommand(command);
      return;
    }
    
    const process = await webcontainerInstance.spawn('sh', ['-c', processCommand]);
    
    process.output.pipeTo(new WritableStream({
      write(data) {
        addTerminalOutput(data);
      }
    }));
    
    const exitCode = await process.exit;
    
    if (exitCode !== 0) {
      addTerminalOutput(`❌ Command failed with exit code ${exitCode}`);
    }
  } catch (error) {
    addTerminalOutput(`❌ Error: ${error.message}`);
  }
}

// Enhanced command handlers for DevOps tools
function handleKubectlCommand(command) {
  const commands = {
    'kubectl get pods': `NAME                            READY   STATUS    RESTARTS   AGE
user-service-7d4b8c8f9d-abc12   1/1     Running   0          2m
user-service-7d4b8c8f9d-def34   1/1     Running   0          2m
postgres-6b8f9c7d5e-ghi56      1/1     Running   0          5m
redis-5a7e8d6c4b-jkl78         1/1     Running   0          5m`,
    'kubectl get services': `NAME           TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
user-service   ClusterIP   10.96.123.45    <none>        3000/TCP   5m
postgres       ClusterIP   10.96.234.56    <none>        5432/TCP   5m
redis          ClusterIP   10.96.345.67    <none>        6379/TCP   5m`,
    'kubectl get deployments': `NAME           READY   UP-TO-DATE   AVAILABLE   AGE
user-service   2/2     2            2           5m
postgres       1/1     1            1           5m
redis          1/1     1            1           5m`
  };
  
  const output = commands[command] || `✅ Executed: ${command}`;
  addTerminalOutput(output);
}

function handleDockerCommand(command) {
  const commands = {
    'docker ps': `CONTAINER ID   IMAGE              COMMAND                  STATUS         PORTS                    NAMES
abc123def456   user-service:v1    "node app.js"            Up 2 minutes   0.0.0.0:3001->3000/tcp   user-service_1
def456ghi789   postgres:15        "docker-entrypoint.s…"   Up 5 minutes   0.0.0.0:5432->5432/tcp   postgres_1
ghi789jkl012   redis:7-alpine     "docker-entrypoint.s…"   Up 5 minutes   0.0.0.0:6379->6379/tcp   redis_1`,
    'docker images': `REPOSITORY       TAG       IMAGE ID       CREATED         SIZE
user-service     v1        abc123def456   2 minutes ago   145MB
user-service     latest    abc123def456   2 minutes ago   145MB
postgres         15        def456ghi789   2 weeks ago     379MB
redis            7-alpine  ghi789jkl012   3 weeks ago     32.3MB`,
    'docker-compose up -d': `Creating network "microservice_default" with the default driver
Creating postgres ... done
Creating redis    ... done
Creating user-service ... done
✅ All services started successfully!`
  };
  
  const output = commands[command] || `✅ Executed: ${command}`;
  addTerminalOutput(output);
}

function handleHelmCommand(command) {
  const commands = {
    'helm list': `NAME            NAMESPACE       REVISION        UPDATED                                 STATUS          CHART                   APP VERSION
microservice    default         1               2024-01-15 10:30:00.123456789 +0000 UTC deployed        microservice-0.1.0     1.0.0`,
    'helm status microservice': `NAME: microservice
LAST DEPLOYED: Mon Jan 15 10:30:00 2024
NAMESPACE: default
STATUS: deployed
REVISION: 1`
  };
  
  const output = commands[command] || `✅ Executed: ${command}`;
  addTerminalOutput(output);
}

function handleGitCommand(command) {
  const commands = {
    'git status': `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

        modified:   docker-compose.yml
        modified:   k8s/deployment.yaml

no changes added to commit (use "git add ." or "git commit -a")`,
    'git log --oneline': `a1b2c3d (HEAD -> main, origin/main) Add Kubernetes deployment manifests
e4f5g6h Update Docker Compose configuration
i7j8k9l Initial microservice implementation
m0n1o2p Add CI/CD pipeline configuration`
  };
  
  const output = commands[command] || `✅ Executed: ${command}`;
  addTerminalOutput(output);
}

function addTerminalOutput(text) {
  const output = document.getElementById('terminal-output');
  const line = document.createElement('div');
  line.textContent = text;
  line.className = 'terminal-line';
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

function checkStepProgress() {
  // This would normally check if the current step tasks are completed
  const currentStepData = labSteps[currentStep];
  addTerminalOutput(`🔍 Checking progress for: ${currentStepData.title}`);
  
  // Simulate progress check
  setTimeout(() => {
    const completed = Math.random() > 0.5; // Random for demo
    if (completed) {
      addTerminalOutput('✅ Step completed successfully!');
      markStepCompleted(currentStep);
    } else {
      addTerminalOutput('⚠️ Some tasks are still incomplete. Keep working!');
    }
  }, 1000);
}

function markStepCompleted(stepIndex) {
  labProgress.completedSteps.push(stepIndex);
  
  // Update UI
  const stepItem = document.querySelector(`[data-step="${stepIndex}"]`);
  stepItem.classList.add('completed');
  
  // Update task items
  document.querySelectorAll('.task-item .task-status').forEach(status => {
    status.className = 'fas fa-check-circle task-status completed';
  });
}

function refreshPreview() {
  const iframe = document.getElementById('service-preview');
  iframe.src = iframe.src; // Reload iframe
}

function saveCurrentFile() {
  const editor = document.getElementById('code-editor');
  const activeTab = document.querySelector('.tab.active');
  const fileName = activeTab?.dataset.file || 'app.js';
  
  // Save to WebContainer file system
  if (webcontainerInstance) {
    webcontainerInstance.fs.writeFile(`/${fileName}`, editor.value);
    addTerminalOutput(`💾 Saved ${fileName}`);
  }
}

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}