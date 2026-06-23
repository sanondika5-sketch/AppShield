# AppShield 🛡️

**AppShield** is a premium, real-time Security Gateway and Orchestration Dashboard designed to monitor and defend application endpoints. It dynamically provisions modular security shields tailored to specific threat models, visualizes real-time performance telemetry, and simulates threat scenarios.

### 🌐 Live Demo
Here is the final live production URL hosted on Vercel: 👉 https://frontend-nine-rho-vrlpnl0iuk.vercel.app

ℹ️ How It Works:
Frontend (Vercel): Deployed to Vercel and points directly to the backend API/WebSocket address.
Backend (Local + Tunnel): Running on your machine (port 5000) and exposed via a stable, persistent localtunnel subdomain:
Backend URL: https://appshield-sanondika.loca.lt

---

## 🚀 Key Features

* **Dynamic Shield Provisioning**: Deploy dedicated, isolated protection modules for target endpoints:
  * 🛡️ **Anti-Malware Shield**: Sandboxes incoming files, blocks backdoor uploads, and monitors execution anomalies.
  * 👁️ **Anti-Spyware Shield**: Blocks PII exfiltration, locks keyboard hooks, and audits token permissions.
  * 🌐 **Anti-Trojan Shield**: Reviews SSL/TLS chains, audits domain reputation, and flags homograph/DNS hijacks.
* **Intelligent Auto-Classification**: Uses heuristics or **Google Gemini API** integration to automatically analyze endpoint URLs and recommend the correct security command module.
* **Real-time Telemetry Logs**: Streams system events and threat warnings instantly to an interactive terminal console using WebSockets.
* **Performance Visualizations**: Displays real-time CPU and Memory utilization analytics in customized interactive graphs.
* **Synthetic Threat Injection**: Simulate specific security exploit vectors (e.g., webshells, MITM fake certificates, credit card exfiltration leaks) to verify defense capabilities.
- **Docker Ready**: Fully containerized using Multi-stage Dockerfiles and orchestrated via Docker Compose.

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18 (TypeScript) via Vite
- **Styling**: Cyberpunk/Glassmorphic UI styled with CSS variables and custom animations
- **Visuals**: Lucide React (Icons) & Recharts (Telemetry Area Charts)

### Backend
- **Framework**: Express API (TypeScript) served via HTTP Node.js Server
- **WebSockets**: Real-time events broadcasted via `ws` library
- **AI Integrations**: Gemini API (v1beta API call using `fetch`)
- **Process Orchestration**: Simulated security container life-cycle management

---

## 💻 Quick Start & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Docker & Docker Compose (optional, for containerized run)

### Running Locally (Manual Build)

#### 1. Clone the Repository
```bash
git clone https://github.com/sanondika5-sketch/AppShield.git
cd AppShield
```

#### 2. Configure Environment Variables
Create a `.env` file inside the `backend` directory:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
```
> **Note**: If `GEMINI_API_KEY` is omitted or empty, AppShield will fall back to its offline heuristic URL classifier automatically.

#### 3. Setup and Run the Backend
```bash
cd backend
npm install
npm run dev
```
The API server will launch at `http://localhost:5000`.

#### 4. Setup and Run the Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the interactive dashboard.

---

## 🐳 Running with Docker

You can launch the complete ecosystem with a single command using Docker Compose:

```bash
docker-compose up --build
```

- **Frontend Application**: accessible at `http://localhost:3000`
- **Backend API Server**: accessible at `http://localhost:5000`

---

## 📂 Project Directory Structure

```text
appshield/
├── backend/
│   ├── src/
│   │   ├── engines/        # Security shield engines
│   │   ├── services/       # AI threat analysis services
│   │   ├── server.ts       # Express/WS controller entrypoint
│   │   ├── orchestrator.ts # Security gateway lifecycle manager
│   │   └── types.ts        # Common TS declarations
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx         # Interactive command dashboard
│   │   ├── main.tsx        # React client entrypoint
│   │   └── index.css       # Core styling & glassmorphic layout tokens
│   ├── Dockerfile
│   ├── vite.config.ts
│   └── package.json
└── docker-compose.yml      # Orchestrates client and controller
```
