import { EngineType, TelemetryEvent } from './types';
import { MalwareEngine } from './engines/malware';
import { SpywareEngine } from './engines/spyware';
import { TrojanEngine } from './engines/trojan';

type AnyEngine = MalwareEngine | SpywareEngine | TrojanEngine;

class SecurityOrchestratorClass {
  private activeInstances = new Map<string, AnyEngine>();

  public async provisionInstance(
    appId: string,
    url: string,
    type: EngineType,
    onEvent: (event: TelemetryEvent) => void
  ): Promise<void> {
    // Stop if already running (re-deploy scenario)
    this.stopInstance(appId);

    // Simulate provisioning latency (spinning up Docker container / sandboxed pod)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    let engine: AnyEngine;

    switch (type) {
      case 'malware':
        engine = new MalwareEngine(appId);
        break;
      case 'spyware':
        engine = new SpywareEngine(appId);
        break;
      case 'trojan':
        engine = new TrojanEngine(appId);
        break;
      default:
        throw new Error(`Unsupported engine type: ${type}`);
    }

    engine.start(onEvent);
    this.activeInstances.set(appId, engine);
  }

  public stopInstance(appId: string): void {
    const engine = this.activeInstances.get(appId);
    if (engine) {
      engine.stop();
      this.activeInstances.delete(appId);
    }
  }

  public injectThreat(appId: string, specificType?: string): boolean {
    const engine = this.activeInstances.get(appId);
    if (engine) {
      engine.injectThreat(specificType);
      return true;
    }
    return false;
  }

  public isInstanceActive(appId: string): boolean {
    return this.activeInstances.has(appId);
  }
}

export const SecurityOrchestrator = new SecurityOrchestratorClass();
