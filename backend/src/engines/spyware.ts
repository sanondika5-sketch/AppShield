import { TelemetryEvent } from '../types';

export class SpywareEngine {
  private appId: string;
  private intervalId: NodeJS.Timeout | null = null;
  private onEventCallback: ((event: TelemetryEvent) => void) | null = null;

  constructor(appId: string) {
    this.appId = appId;
  }

  public start(onEvent: (event: TelemetryEvent) => void): void {
    this.onEventCallback = onEvent;

    const auditActions = [
      'PII scan: Encrypting user session keys in storage',
      'API audit: Accessing graph API user nodes (Scope: public_profile)',
      'Privacy Check: Scanning API request payloads for clear-text credentials',
      'Anti-Keylogger: Verifying input buffer hooks isolation state',
      'Traffic audit: Dynamic analysis of external analytics callbacks'
    ];

    this.intervalId = setInterval(() => {
      const action = auditActions[Math.floor(Math.random() * auditActions.length)];
      const latency = Math.floor(Math.random() * 30) + 5; // 5ms - 35ms

      this.emit({
        appId: this.appId,
        timestamp: Date.now(),
        type: 'log',
        level: 'info',
        message: `Privacy engine check: ${action} - Success (${latency}ms)`,
        metadata: { latencyMs: latency, module: 'PII_SHIELD' }
      });

      if (Math.random() > 0.7) {
        this.emit({
          appId: this.appId,
          timestamp: Date.now(),
          type: 'metric',
          message: 'Privacy and data protection telemetry',
          metadata: {
            piiRedactedCount: Math.floor(Math.random() * 5),
            bufferHookCount: 0,
            outgoingTrafficBytes: Math.floor(Math.random() * 10240) + 128
          }
        });
      }
    }, 3500);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public injectThreat(specificType?: string): void {
    const threats = [
      {
        alertType: 'DATA_EXFILTRATION_PREVENTED',
        message: 'Spyware Threat Blocked: High-risk outbound data payload matched credit card layout (Regex-Luhn check)!',
        level: 'critical' as const,
        meta: { targetUrl: 'https://exfiltrate-collect.ru/logs', blockedPayloadSize: '8.4KB', matchRegex: 'Luhn_CC_Pattern' }
      },
      {
        alertType: 'KEYBOARD_HOOK_BLOCKED',
        message: 'Spyware alert: Intercepted system hook request from unauthorized module on input buffer.',
        level: 'critical' as const,
        meta: { callerProcess: 'spy_agent.dll', systemCall: 'SetWindowsHookExW', action: 'BLOCK_DRIVER' }
      },
      {
        alertType: 'UNAUTHORIZED_SCOPE_REQUEST',
        message: 'Privacy Audit Warning: FB Graph API attempted access of unapproved scopes: [user_friends, user_location].',
        level: 'warn' as const,
        meta: { scopeRequested: 'user_friends', apiPlatform: 'Meta Graph API', action: 'STRIPPED_SCOPE' }
      }
    ];

    const threat = specificType 
      ? threats.find(t => t.alertType === specificType) || threats[0]
      : threats[Math.floor(Math.random() * threats.length)];

    this.emit({
      appId: this.appId,
      timestamp: Date.now(),
      type: 'alert',
      level: threat.level,
      message: threat.message,
      metadata: {
        threatDetected: true,
        threatType: threat.alertType,
        ...threat.meta
      }
    });
  }

  private emit(event: TelemetryEvent): void {
    if (this.onEventCallback) {
      this.onEventCallback(event);
    }
  }
}
