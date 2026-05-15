const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchProviders(): Promise<Record<string, { name: string; models: string[]; requires_api_key: string }>> {
  const res = await fetch(`${API_BASE}/api/config/providers`);
  if (!res.ok) throw new Error('Failed to fetch providers');
  return res.json();
}

export async function fetchApiKeyStatus(): Promise<{ keys: Record<string, boolean>; any_llm_key: boolean; any_data_key: boolean }> {
  const res = await fetch(`${API_BASE}/api/config/api-keys`);
  if (!res.ok) throw new Error('Failed to fetch API key status');
  return res.json();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export interface StartAnalysisResponse {
  analysis_id: string;
  status: string;
}

export async function startAnalysis(params: {
  stock_symbol: string;
  market_type: string;
  analysis_date: string;
  analysts: string[];
  research_depth: number;
  llm_provider: string;
  llm_model: string;
  custom_prompt?: string;
}): Promise<StartAnalysisResponse> {
  const res = await fetch(`${API_BASE}/api/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Failed to start analysis');
  }
  return res.json();
}

export function subscribeToProgress(
  analysisId: string,
  onUpdate: (data: { id: string; status: string; progress: number; current_step: string; message: string; error?: string | null }) => void,
  onComplete: () => void,
  onError: (error: string) => void,
): AbortController {
  const controller = new AbortController();

  fetch(`${API_BASE}/api/analysis/${analysisId}/stream`, {
    signal: controller.signal,
    headers: { Accept: 'text/event-stream' },
  })
    .then(async (response) => {
      if (!response.ok) throw new Error('Stream connection failed');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.status === 'heartbeat') continue;
              onUpdate(data);
              if (data.status === 'completed') {
                onComplete();
                return;
              }
              if (data.status === 'failed') {
                onError(data.error || 'Analysis failed');
                return;
              }
            } catch {
              // Skip parse errors
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError(err.message);
      }
    });

  return controller;
}

export async function fetchResults(analysisId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/analysis/${analysisId}/results`);
  if (!res.ok) throw new Error('Failed to fetch results');
  return res.json();
}

export function getReportUrl(analysisId: string, format: string = 'md'): string {
  return `${API_BASE}/api/analysis/${analysisId}/report?format=${format}`;
}
