# 🚀 CI/CD Monitoring Dashboard (PipelineIQ)

A real-time DevOps dashboard that provides complete visibility into the CI/CD pipeline — from code push to deployment — with live updates, metrics, and alerts.

It acts like a control tower for software delivery, helping developers and teams monitor, analyze, and respond to pipeline activity in real time.

---

![Dashboard Screenshot](./frontend/public/dashboard.png)

## 🧠 Project Overview

This project tracks and visualizes the entire software delivery lifecycle:

- Code integration (CI)
- Automated testing
- Build and packaging
- Deployment (CD)
- Monitoring and alerting

The goal is to eliminate guesswork and provide a clear, real-time view of system health and pipeline performance.

---

## 🎯 Purpose

Modern DevOps tools are powerful but often fragmented. This project brings together core concepts into a unified dashboard that demonstrates:

- Real-time pipeline monitoring
- CI/CD workflow understanding
- System observability
- Full-stack development skills

---

## ⚙️ Features

### 🔄 Real-Time Pipeline Status
- Track pipeline stages: Pending, Running, Passed, Failed
- Live updates using WebSockets

### 📊 Metrics Dashboard
- Build Success Rate
- Deployment Frequency
- Average Deployment Time
- Mean Time to Recovery (MTTR)

### 📜 Pipeline History
- View past pipeline runs
- Includes timestamps, duration, and status

### 🚨 Alerts System
- Detects failures and anomalies
- Severity-based alerts (Critical, Warning, Info)

### 🎨 Responsive UI
- Clean and intuitive design
- Works on desktop and mobile
- Color-coded status indicators

---

## 🏗️ Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Recharts / Chart.js
- WebSockets

### Backend
- Node.js
- Express.js
- PostgreSQL
- Redis

### DevOps & Tools
- GitHub Actions
- Docker
- Jenkins
- Prometheus
- Grafana

---

## 🔄 Workflow

1. Developer pushes code to repository
2. CI/CD pipeline is triggered
3. Automated tests are executed
4. Build is created and deployed
5. Dashboard receives real-time updates
6. Metrics are calculated and displayed
7. Alerts are triggered if issues occur

---

## 📁 Project Structure

cicd-dashboard/
├── frontend/              # React dashboard UI
├── backend/               # Node.js API & WebSocket server
├── database/              # PostgreSQL schema & migrations
├── .github/workflows/     # CI/CD pipelines
└── README.md

---

## 🚀 Getting Started

### Clone the Repository
git clone https://github.com/your-username/PipelineIQ.git
cd PipelineIQ

### Setup Backend
cd backend
npm install
node server.js

### Setup Frontend
cd frontend
npm install
npm run dev

### Open in Browser
http://localhost:3000

---

## 🧪 Example Scenario

When a developer pushes new code:

- Pipeline starts automatically
- Dashboard shows live status updates
- Metrics update instantly
- Alerts trigger if failures occur

---

## 📈 What This Project Demonstrates

- CI/CD pipeline understanding
- Real-time system design using WebSockets
- Full-stack development (React + Node.js)
- Monitoring and metrics tracking
- DevOps tool integration

---

## ⚠️ Lessons Learned

- Real-time systems require event-driven architecture
- WebSockets are more efficient than polling
- Clean project structure improves scalability
- Integration is more complex than individual tools

---

## 🔮 Future Improvements

- Slack / Email alert integration
- Deployment rollback functionality
- Multi-repository support
- Authentication and user roles
- Advanced analytics and reporting

---

## 👤 Author

Sunil Sharma  
DevOps & Full Stack Learner

---

## ⭐ Final Note

This project bridges the gap between DevOps theory and real-world implementation by providing a complete, visual pipeline monitoring system.
