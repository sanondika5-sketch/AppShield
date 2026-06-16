import express from 'express';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { EngineType, MonitoredApp, TelemetryEvent } from './types';
import { SecurityOrchestrator } from './orchestrator';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory store for Monitored Apps
let monitoredApps: MonitoredApp[] = [];

// Create HTTP Server
const server = http.createServer(app);

// Create WebSocket Server
const wss = new WebSocketServer({ server });

// Set of connected clients
const connectedClients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  connectedClients.add(ws);
  console.log(`WebSocket client connected. Total clients: ${connectedClients.size}`);

  ws.on('close', () => {
    connectedClients.delete(ws);
    console.log(`WebSocket client disconnected. Total clients: ${connectedClients.size}`);
  });
});

// Broadcast helper for streaming real-time telemetry
function broadcast(event: TelemetryEvent) {
  const message = JSON.stringify(event);
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// URL classifier helper
function autoClassifyUrl(urlStr: string): EngineType {
  try {
    const url = new URL(urlStr);
    
    // Pattern 1: Social platforms, forms, messaging endpoints -> Spyware Engine
    const spywareDomains = [
      /facebook\.com/i, /linkedin\.com/i, /twitter\.com/i, /instagram\.com/i,
      /contact/i, /register/i, /login/i, /profile/i
    ];
    if (spywareDomains.some(regex => regex.test(url.hostname) || regex.test(url.pathname))) {
      return 'spyware';
    }

    // Pattern 2: API endpoints, raw web services, Webhook targets -> Malware Engine
    const malwarePaths = [/api/i, /webhook/i, /upload/i, /v1/i, /v2/i];
    if (malwarePaths.some(regex => regex.test(url.pathname)) || url.hostname.startsWith('api.')) {
      return 'malware';
    }

    // Default: Web applications, static pages -> Trojan Engine (Verify Domain, SSL/TLS, Phishing)
    return 'trojan';
  } catch (error) {
    return 'trojan';
  }
}

// --- REST API ENDPOINTS ---

// Get all monitored apps
app.get('/api/shields', (req, res) => {
  return res.json(monitoredApps);
});

// Deploy new shield
app.post('/api/shields/deploy', async (req, res) => {
  const { targetUrl, name, engineSelection = 'auto' } = req.body;

  if (!targetUrl || !name) {
    return res.status(400).json({ success: false, message: 'Target URL and name are required.' });
  }

  // Determine engine
  let engineType: EngineType = 'trojan';
  if (engineSelection === 'auto') {
    engineType = autoClassifyUrl(targetUrl);
  } else if (['malware', 'spyware', 'trojan'].includes(engineSelection)) {
    engineType = engineSelection as EngineType;
  } else {
    return res.status(400).json({ success: false, message: 'Invalid engine type specified.' });
  }

  const newApp: MonitoredApp = {
    id: uuidv4(),
    name,
    targetUrl,
    engineType,
    status: 'provisioning',
    threatCount: 0,
    createdAt: new Date().toISOString()
  };

  monitoredApps.push(newApp);

  // Trigger async provisioning (like container startup)
  SecurityOrchestrator.provisionInstance(newApp.id, targetUrl, engineType, (event) => {
    // Increment threatCount if alert event is received
    if (event.type === 'alert') {
      const appRef = monitoredApps.find(a => a.id === event.appId);
      if (appRef) {
        appRef.threatCount += 1;
      }
    }
    // Stream event via websocket to frontend
    broadcast(event);
  })
  .then(() => {
    const appRef = monitoredApps.find(a => a.id === newApp.id);
    if (appRef) {
      appRef.status = 'active';
      // Broadcast activation message
      broadcast({
        appId: newApp.id,
        timestamp: Date.now(),
        type: 'log',
        level: 'info',
        message: `System activation completed. Dedicated ${engineType.toUpperCase()} security micro-engine deployed successfully.`
      });
    }
  })
  .catch((err) => {
    console.error(`Provisioning error for app ${newApp.id}:`, err);
    const appRef = monitoredApps.find(a => a.id === newApp.id);
    if (appRef) {
      appRef.status = 'error';
    }
  });

  return res.status(202).json({
    success: true,
    message: `Shield deployment sequence initiated for ${name}.`,
    app: newApp
  });
});

// Inject threat for manual validation
app.post('/api/shields/:id/inject-threat', (req, res) => {
  const { id } = req.params;
  const { specificType } = req.body;

  const appExists = monitoredApps.find(a => a.id === id);
  if (!appExists) {
    return res.status(404).json({ success: false, message: 'Shield instance not found.' });
  }

  const injected = SecurityOrchestrator.injectThreat(id, specificType);
  if (injected) {
    return res.json({ success: true, message: 'Synthetic threat vector successfully injected.' });
  } else {
    return res.status(400).json({ success: false, message: 'Engine instance is currently inactive.' });
  }
});

// Dismantle active shield
app.delete('/api/shields/:id', (req, res) => {
  const { id } = req.params;

  const appIndex = monitoredApps.findIndex(a => a.id === id);
  if (appIndex === -1) {
    return res.status(404).json({ success: false, message: 'Shield instance not found.' });
  }

  // Stop the running engine simulator instance
  SecurityOrchestrator.stopInstance(id);

  // Remove from database list
  const removedApp = monitoredApps[appIndex];
  monitoredApps = monitoredApps.filter(a => a.id !== id);

  console.log(`Dismantled shield for: ${removedApp.name} (${removedApp.targetUrl})`);
  return res.json({ success: true, message: `Shield dismantled successfully.` });
});

// Start the server
server.listen(port, () => {
  console.log(`AppShield Controller Server is running on port ${port}`);
});
