export type EngineType = 'malware' | 'spyware' | 'trojan';

export type ShieldStatus = 'provisioning' | 'active' | 'suspended' | 'error';

export interface MonitoredApp {
  id: string;
  name: string;
  targetUrl: string;
  engineType: EngineType;
  status: ShieldStatus;
  threatCount: number;
  createdAt: string;
}

export interface TelemetryEvent {
  appId: string;
  timestamp: number;
  type: 'log' | 'alert' | 'metric';
  level?: 'info' | 'warn' | 'error' | 'critical';
  message: string;
  metadata?: {
    requestMethod?: string;
    requestPath?: string;
    statusCode?: number;
    responseTimeMs?: number;
    threatDetected?: boolean;
    threatType?: string;
    [key: string]: any;
  };
}
