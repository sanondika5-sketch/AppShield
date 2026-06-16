import { EngineType } from '../types';

export interface AIAnalysisResult {
  engineType: EngineType;
  explanation: string;
}

export class GeminiService {
  private static getApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  /**
   * Uses Gemini API to analyze the target URL and determine the most appropriate security module
   */
  public static async analyzeUrl(url: string): Promise<AIAnalysisResult | null> {
    const apiKey = this.getApiKey();
    if (!apiKey || apiKey === 'your_key_here' || apiKey.trim() === '') {
      console.log('Gemini API key not configured. Falling back to heuristic classifier.');
      return null;
    }

    try {
      const prompt = `
You are a Cyber Security AI agent. Analyze the following target URL and decide which of the three security command modules should be provisioned:
1. "malware" (For raw APIs, data uploads, webhook destinations, backend endpoints, code files, or endpoints vulnerable to file alterations, webshells, or process execution anomalies).
2. "spyware" (For social media, input forms, messaging, personal blogs, contact pages, or endpoints dealing with user PII (Personal Identifiable Information), credentials, or prone to data exfiltration and buffer logging hooks).
3. "trojan" (For standard consumer portals, lookalike domains, potential phishing pages, domains needing SSL/TLS root chain verification, or reputation audits).

Respond ONLY with a JSON object in this exact format:
{
  "engineType": "malware" | "spyware" | "trojan",
  "explanation": "A one-sentence security rationale explaining the threat profile of this target URL."
}

Target URL: "${url}"
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API responded with status ${response.status}`);
      }

      const data: any = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('Invalid response structure from Gemini API');
      }

      const result = JSON.parse(text.trim()) as AIAnalysisResult;
      return result;
    } catch (err) {
      console.error('Error in Gemini URL analysis:', err);
      return null;
    }
  }
}
