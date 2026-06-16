import { TelemetryEvent } from '../types';

export class TrojanEngine {
  private appId: string;
  private intervalId: NodeJS.Timeout | null = null;
  private onEventCallback: ((event: TelemetryEvent) => void) | null = null;

  constructor(appId: string) {
    this.appId = appId;
  }

  public start(onEvent: (event: TelemetryEvent) => void): void {
    this.onEventCallback = onEvent;

    const integrityChecks = [
      'SSL/TLS status: Certificate active and cryptographically signed (CA: Let\'s Encrypt)',
      'DNS cache audit: Endpoint domain matches upstream registrar zone',
      'Reputation verify: Cross-checking IP with global database (Spamhaus, Talos)',
      'Phishing heuristic: Domain syntax validation (no homograph characters found)',
      'Response integrity check: Verifying response headers (X-Frame-Options, CSP)'
    ];

    this.intervalId = setInterval(() => {
      const check = integrityChecks[Math.floor(Math.random() * integrityChecks.length)];
      const responseTime = Math.floor(Math.random() * 150) + 50; // 50ms - 200ms

      this.emit({
        appId: this.appId,
        timestamp: Date.now(),
        type: 'log',
        level: 'info',
        message: `Reputation Engine: ${check} (${responseTime}ms)`,
        metadata: { latencyMs: responseTime, module: 'INTEGRITY_SHIELD' }
      });

      if (Math.random() > 0.6) {
        this.emit({
          appId: this.appId,
          timestamp: Date.now(),
          type: 'metric',
          message: 'SSL and Reputation metrics',
          metadata: {
            certDaysRemaining: 245,
            dnsHijackAttempts: 0,
            domainReputationScore: 99 // out of 100
          }
        });
      }
    }, 4000);
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
        alertType: 'MITM_ATTACK_DETECTED',
        message: 'CRITICAL WARNING: SSL/TLS validation failed! Unrecognized self-signed certificate presented (MITM attempt suspected).',
        level: 'critical' as const,
        meta: { issuer: 'SuperProxy CA Ltd', signatureAlgorithm: 'md5WithRSAEncryption', certChainValid: false }
      },
      {
        alertType: 'PHISHING_DOMAIN_MATCH',
        message: 'Trojan threat blocked: Homograph phishing domain matched lookalike pattern: target contains Cyrillic characters.',
        level: 'critical' as const,
        meta: { spoofedDomain: 'gооgle.com', similarityRating: '98%', action: 'REDIRECT_TO_SANDBOX' }
      },
      {
        alertType: 'DNS_HIJACK_DETECTED',
        message: 'DNS security alert: Resolved IP does not match registrar records. Target points to high-risk residential block.',
        level: 'warn' as const,
        meta: { expectedIp: '142.250.190.46', resolvedIp: '185.220.101.4', location: 'Unknown/Tor Exit', action: 'BLOCK_DNS_RESPONSE' }
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
