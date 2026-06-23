import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Terminal, 
  Trash2, 
  AlertTriangle, 
  Clock, 
  Play, 
  Globe, 
  Lock, 
  Eye, 
  Cpu, 
  Database,
  Network
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';

interface MonitoredApp {
  id: string;
  name: string;
  targetUrl: string;
  engineType: 'malware' | 'spyware' | 'trojan';
  status: 'provisioning' | 'active' | 'suspended' | 'error';
  threatCount: number;
  createdAt: string;
}

interface LogLine {
  id: string;
  timestamp: string;
  type: 'log' | 'alert' | 'metric';
  level: 'info' | 'warn' | 'error' | 'critical';
  message: string;
}

interface MetricHistoryItem {
  time: string;
  cpu: number;
  memory: number;
  traffic: number;
}

export default function App() {
  const [apps, setApps] = useState<MonitoredApp[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  
  // Form states
  const [targetUrl, setTargetUrl] = useState('');
  const [appName, setAppName] = useState('');
  const [engineSelection, setEngineSelection] = useState<'auto' | 'malware' | 'spyware' | 'trojan'>('auto');
  const [predictedEngine, setPredictedEngine] = useState<'malware' | 'spyware' | 'trojan'>('trojan');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Real-time feeds state mapped by App ID
  const [logs, setLogs] = useState<{ [appId: string]: LogLine[] }>({});
  const [metricsHistory, setMetricsHistory] = useState<{ [appId: string]: MetricHistoryItem[] }>({});
  const [wsConnected, setWsConnected] = useState(false);
  const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString());

  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Update System Time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Classify input URL automatically in real-time
  useEffect(() => {
    if (!targetUrl) {
      setPredictedEngine('trojan');
      return;
    }
    try {
      const url = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
      
      const spywareDomains = [
        /facebook\.com/i, /linkedin\.com/i, /twitter\.com/i, /instagram\.com/i,
        /contact/i, /register/i, /login/i, /profile/i
      ];
      if (spywareDomains.some(regex => regex.test(url.hostname) || regex.test(url.pathname))) {
        setPredictedEngine('spyware');
        return;
      }

      const malwarePaths = [/api/i, /webhook/i, /upload/i, /v1/i, /v2/i];
      if (malwarePaths.some(regex => regex.test(url.pathname)) || url.hostname.startsWith('api.')) {
        setPredictedEngine('malware');
        return;
      }

      setPredictedEngine('trojan');
    } catch {
      setPredictedEngine('trojan');
    }
  }, [targetUrl]);

  // Fetch initial shields
  useEffect(() => {
    fetchApps();
  }, []);

  // Connect WebSockets for telemetry logs
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Scroll to bottom of terminal container directly to prevent main page jumping
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [logs, selectedAppId]);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/shields');
      const data = await res.json();
      setApps(data);
      if (data.length > 0 && !selectedAppId) {
        setSelectedAppId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching shields list:', err);
    }
  };

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'ws://localhost:5000'
      : `${protocol}//${window.location.host}/api`;
    
    console.log(`Connecting WebSocket to: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setWsConnected(true);
      console.log('Telemetry channel connected.');
    };

    ws.onclose = () => {
      setWsConnected(false);
      console.log('Telemetry channel disconnected. Retrying...');
      setTimeout(connectWebSocket, 5000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onmessage = (event) => {
      const telemetry = JSON.parse(event.data);
      handleTelemetryMessage(telemetry);
    };

    wsRef.current = ws;
  };

  const handleTelemetryMessage = (event: any) => {
    const { appId, timestamp, type, level = 'info', message, metadata } = event;

    // 1. Process Logs
    const newLogLine: LogLine = {
      id: Math.random().toString(),
      timestamp: new Date(timestamp).toLocaleTimeString(),
      type,
      level,
      message
    };

    setLogs((prevLogs) => {
      const appLogs = prevLogs[appId] || [];
      return {
        ...prevLogs,
        [appId]: [...appLogs, newLogLine].slice(-80) // Keep last 80 lines
      };
    });

    // 2. Process Metrics (Resource graph)
    if (type === 'metric' && metadata) {
      const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const cpu = metadata.cpuUsage ? parseFloat(metadata.cpuUsage) : 0;
      const mem = metadata.memoryUsage ? parseFloat(metadata.memoryUsage) : 0;
      const traffic = metadata.outgoingTrafficBytes ? Math.round(metadata.outgoingTrafficBytes / 1024) : Math.floor(Math.random() * 5); // KB

      setMetricsHistory((prevHistory) => {
        const appHistory = prevHistory[appId] || [];
        const newItem: MetricHistoryItem = {
          time: timeStr,
          cpu: cpu || Math.floor(Math.random() * 10) + 5,
          memory: mem || Math.floor(Math.random() * 15) + 30,
          traffic: traffic
        };
        return {
          ...prevHistory,
          [appId]: [...appHistory, newItem].slice(-15) // Keep last 15 ticks
        };
      });
    }

    // 3. Increment threat counter if alert is logged
    if (type === 'alert') {
      setApps((prevApps) => 
        prevApps.map((a) => (a.id === appId ? { ...a, threatCount: a.threatCount + 1 } : a))
      );
    }
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl || !appName) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/shields/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          name: appName,
          engineSelection
        })
      });

      const result = await response.json();
      if (result.success) {
        setApps(prev => [...prev, result.app]);
        setSelectedAppId(result.app.id);
        
        // Reset fields
        setTargetUrl('');
        setAppName('');
        setEngineSelection('auto');

        // Add immediate custom provisioning log line
        const initLog: LogLine = {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          type: 'log',
          level: 'info',
          message: `Shield deployment request received. Deploying isolated security container...`
        };
        setLogs(prev => ({
          ...prev,
          [result.app.id]: [initLog]
        }));
      }
    } catch (err) {
      console.error('Failed to deploy shield:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismantle = async (id: string) => {
    try {
      const response = await fetch(`/api/shields/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        setApps(prev => prev.filter(a => a.id !== id));
        if (selectedAppId === id) {
          const remaining = apps.filter(a => a.id !== id);
          setSelectedAppId(remaining.length > 0 ? remaining[0].id : null);
        }
      }
    } catch (err) {
      console.error('Failed to dismantle shield:', err);
    }
  };

  const handleInjectThreat = async (specificType?: string) => {
    if (!selectedAppId) return;
    try {
      await fetch(`/api/shields/${selectedAppId}/inject-threat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specificType })
      });
    } catch (err) {
      console.error('Failed to inject test threat:', err);
    }
  };

  const activeApp = apps.find(a => a.id === selectedAppId);
  const activeLogs = selectedAppId ? logs[selectedAppId] || [] : [];
  const activeMetrics = selectedAppId ? metricsHistory[selectedAppId] || [] : [];

  const getEngineIcon = (type: 'malware' | 'spyware' | 'trojan') => {
    switch (type) {
      case 'malware': return <Database className="logo-icon" size={20} style={{ color: 'var(--color-amber)' }} />;
      case 'spyware': return <Eye className="logo-icon" size={20} style={{ color: 'var(--color-cyan)' }} />;
      case 'trojan': return <Globe className="logo-icon" size={20} style={{ color: 'var(--color-green)' }} />;
    }
  };

  const getThreatButtons = (type: 'malware' | 'spyware' | 'trojan') => {
    switch (type) {
      case 'malware':
        return (
          <>
            <button className="btn-threat" onClick={() => handleInjectThreat('MALICIOUS_UPLOAD_BLOCKED')}>Inject Webshell Upload</button>
            <button className="btn-threat" onClick={() => handleInjectThreat('UNAUTHORIZED_SPAWN_BLOCKED')}>Inject Execution Hook</button>
            <button className="btn-threat" onClick={() => handleInjectThreat('DOM_INTEGRITY_VIOLATION')}>Inject File Alteration</button>
          </>
        );
      case 'spyware':
        return (
          <>
            <button className="btn-threat" onClick={() => handleInjectThreat('DATA_EXFILTRATION_PREVENTED')}>Inject CC Leak Pattern</button>
            <button className="btn-threat" onClick={() => handleInjectThreat('KEYBOARD_HOOK_BLOCKED')}>Inject Keylogger Hook</button>
            <button className="btn-threat" onClick={() => handleInjectThreat('UNAUTHORIZED_SCOPE_REQUEST')}>Inject Scope Privilege Leak</button>
          </>
        );
      case 'trojan':
        return (
          <>
            <button className="btn-threat" onClick={() => handleInjectThreat('MITM_ATTACK_DETECTED')}>Inject MITM Fake Cert</button>
            <button className="btn-threat" onClick={() => handleInjectThreat('PHISHING_DOMAIN_MATCH')}>Inject Lookalike Phish</button>
            <button className="btn-threat" onClick={() => handleInjectThreat('DNS_HIJACK_DETECTED')}>Inject DNS Cache Spoof</button>
          </>
        );
    }
  };

  return (
    <div className="dashboard-container">
      {/* Premium Header */}
      <header className="cyber-header">
        <div className="logo-section">
          <Shield className="logo-icon animate-pulse" size={28} />
          <span className="logo-text">APPSHIELD</span>
          <span className="logo-tag">CORE COMMAND v1.0</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="pulsing-dot" style={{ backgroundColor: wsConnected ? 'var(--color-green)' : 'var(--color-red)' }}></span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {wsConnected ? 'LIVE STREAM CONNECTED' : 'STREAM DISCONNECTED'}
            </span>
          </div>
          <div className="sys-time">
            <Clock size={16} />
            <span>{systemTime}</span>
          </div>
        </div>
      </header>

      {/* Main Grid content */}
      <main className="dashboard-content">
        {/* Left Side Panel: Shield controller */}
        <section className="side-panel">
          <div className="cyber-card">
            <h2 className="panel-title">
              <Play size={18} style={{ color: 'var(--color-cyan)' }} />
              Provision Security Shield
            </h2>
            <form onSubmit={handleDeploy}>
              <div className="input-group">
                <label className="input-label">Application Endpoint URL</label>
                <input 
                  type="text" 
                  className="cyber-input" 
                  placeholder="e.g., https://api.myplatform.com"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Application Name</label>
                <input 
                  type="text" 
                  className="cyber-input" 
                  placeholder="e.g., Customer Billing Gateway"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Modular Security Module</label>
                <select 
                  className="cyber-select"
                  value={engineSelection}
                  onChange={(e: any) => setEngineSelection(e.target.value)}
                >
                  <option value="auto">Auto-Classify (URL Scan Mode)</option>
                  <option value="malware">Anti-Malware Engine</option>
                  <option value="spyware">Anti-Spyware Engine</option>
                  <option value="trojan">Anti-Trojan Engine</option>
                </select>
              </div>

              {/* URL Scanner Indicator */}
              {engineSelection === 'auto' && targetUrl && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-glass)',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  marginBottom: '1.25rem',
                  fontSize: '0.8rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>Auto-Assigned Shield:</span>
                  <span style={{
                    color: predictedEngine === 'malware' ? 'var(--color-amber)' : predictedEngine === 'spyware' ? 'var(--color-cyan)' : 'var(--color-green)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {predictedEngine}
                  </span>
                </div>
              )}

              <button type="submit" className="btn-cyber" disabled={isSubmitting}>
                <ShieldCheck size={18} />
                {isSubmitting ? 'Deploying Container...' : 'Deploy Shield'}
              </button>
            </form>
          </div>

          {/* Engine capabilities reference card */}
          <div className="cyber-card" style={{ flexGrow: 1 }}>
            <h2 className="panel-title">
              <Activity size={18} style={{ color: 'var(--color-cyan)' }} />
              Module Capabilities
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Database size={24} style={{ color: 'var(--color-amber)', flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontWeight: 'bold', color: 'var(--color-amber)' }}>Anti-Malware Shield</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                    Sandboxes files, prevents backdoor uploads, audits executable calls.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Eye size={24} style={{ color: 'var(--color-cyan)', flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontWeight: 'bold', color: 'var(--color-cyan)' }}>Anti-Spyware Shield</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                    Blocks PII data exfiltration, locks keyboard hooks, audits API token scope.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Globe size={24} style={{ color: 'var(--color-green)', flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontWeight: 'bold', color: 'var(--color-green)' }}>Anti-Trojan Shield</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                    Audits SSL/TLS root chains, intercepts homograph typos, blocks DNS hijacks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Active Panel: Monitoring Dashboard */}
        <section className="main-panel">
          <div>
            <h2 className="panel-title" style={{ borderBottom: 'none', marginBottom: '0.75rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--color-green)' }} />
              Active Monitored Applications ({apps.length})
            </h2>

            {apps.length === 0 ? (
              <div className="empty-state">
                <Shield className="empty-state-icon" size={48} />
                <h3 style={{ fontFamily: 'var(--font-cyber)', color: 'var(--text-muted)' }}>No Active Shields Deployed</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)', marginTop: '0.5rem', maxWidth: '380px' }}>
                  Provide an application endpoint in the controller panel to provision a dedicated security engine.
                </p>
              </div>
            ) : (
              <div className="shields-grid">
                {apps.map((app) => (
                  <div 
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`cyber-card shield-card ${selectedAppId === app.id ? 'active-selection' : ''}`}
                  >
                    <div className="shield-card-header">
                      <div>
                        <h3 className="shield-title">{app.name}</h3>
                        <p className="shield-url">{app.targetUrl}</p>
                      </div>
                      <span className={`shield-badge badge-${app.engineType}`}>
                        {app.engineType}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                      <div className="status-indicator">
                        <span className={`pulsing-dot`} style={{ 
                          backgroundColor: app.status === 'active' ? 'var(--color-green)' : app.status === 'provisioning' ? 'var(--color-amber)' : 'var(--color-red)'
                        }}></span>
                        <span className={`status-${app.status}`} style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                          {app.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: app.threatCount > 0 ? 'var(--color-red)' : 'var(--color-green)' }}>
                        <ShieldAlert size={14} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {app.threatCount} THREATS
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed live dashboard for selected app */}
          {activeApp && (
            <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {getEngineIcon(activeApp.engineType)}
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-cyber)', fontSize: '1.2rem', letterSpacing: '1px' }}>
                      {activeApp.name.toUpperCase()} COMMAND PANEL
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      UUID: {activeApp.id} | Engine: {activeApp.engineType.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div>
                  <button className="btn-action-danger" onClick={() => handleDismantle(activeApp.id)}>
                    Dismantle Shield
                  </button>
                </div>
              </div>

              {/* Dynamic status stats header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <div>
                  <span className="stat-item-label">Protection Mode</span>
                  <div className="stat-item-value" style={{ color: 'var(--color-cyan)', textTransform: 'uppercase' }}>{activeApp.engineType}</div>
                </div>
                <div>
                  <span className="stat-item-label">Threats Intercepted</span>
                  <div className={`stat-item-value threat-count ${activeApp.threatCount === 0 ? 'safe' : ''}`}>
                    {activeApp.threatCount}
                  </div>
                </div>
                <div>
                  <span className="stat-item-label">Runtime State</span>
                  <div className="stat-item-value" style={{ 
                    color: activeApp.status === 'active' ? 'var(--color-green)' : 'var(--color-amber)',
                    textTransform: 'uppercase' 
                  }}>
                    {activeApp.status}
                  </div>
                </div>
                <div>
                  <span className="stat-item-label">Active Connections</span>
                  <div className="stat-item-value" style={{ color: 'var(--text-primary)' }}>
                    {activeMetrics.length > 0 ? activeMetrics[activeMetrics.length - 1].traffic * 3 + 2 : 0}
                  </div>
                </div>
              </div>

              {/* Layout for Logs console & Metrics */}
              <div className="monitor-details-container">
                {/* Console terminal logs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Terminal size={16} /> Live Logs Telemetry
                    </h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>WS_STREAMING</span>
                  </div>
                  
                  <div className="terminal-console">
                    <div className="terminal-header">
                      <div className="terminal-dot-group">
                        <span className="terminal-dot"></span>
                        <span className="terminal-dot"></span>
                        <span className="terminal-dot"></span>
                      </div>
                      <span className="terminal-title">engine-shell // stdout</span>
                    </div>

                    <div ref={terminalBodyRef} className="terminal-body">
                      {activeLogs.length === 0 ? (
                        <div style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-mono)', textAlign: 'center', marginTop: '4rem' }}>
                          [WAITING] Awaiting telemetry stream startup...
                        </div>
                      ) : (
                        activeLogs.map((log) => (
                          <div key={log.id} className={`terminal-line ${log.level}`}>
                            <span style={{ color: 'var(--text-dark)', marginRight: '6px' }}>[{log.timestamp}]</span>
                            {log.message}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Performance charts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Cpu size={16} /> Engine Resource Telemetry
                    </h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>REFRESH: 3000ms</span>
                  </div>
                  
                  <div className="cyber-card" style={{ padding: '1rem', background: '#04060c', height: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {activeMetrics.length === 0 ? (
                      <div style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
                        [CALIBRATING] Collecting CPU & Memory analytics...
                      </div>
                    ) : (
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={activeMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-cyan)" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="var(--color-cyan)" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-amber)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="var(--color-amber)" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" stroke="var(--text-dark)" fontSize={9} />
                            <YAxis stroke="var(--text-dark)" fontSize={9} domain={[0, 100]} />
                            <Tooltip 
                              contentStyle={{ background: '#0a0e1c', borderColor: 'var(--border-glass)', borderRadius: '6px' }}
                              labelStyle={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                              itemStyle={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                            />
                            <Area type="monotone" dataKey="cpu" name="CPU Usage %" stroke="var(--color-cyan)" fillOpacity={1} fill="url(#colorCpu)" />
                            <Area type="monotone" dataKey="memory" name="Memory Usage %" stroke="var(--color-amber)" fillOpacity={1} fill="url(#colorMem)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Threat injection testing dashboard */}
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-red)' }}>
                  <ShieldAlert size={16} /> Synthetic Threat Injection Simulator
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Simulate dynamic exploit payloads to verify target protection and trigger threat blocking.
                </p>
                <div className="threat-grid">
                  {getThreatButtons(activeApp.engineType)}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
