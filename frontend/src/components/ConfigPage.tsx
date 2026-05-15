import { useState, useEffect } from 'react';
import { fetchApiKeyStatus, fetchProviders } from '../services/api';

interface ConfigPageProps {
  backendUrl: string;
  onBackendUrlChange: (url: string) => void;
  onClose: () => void;
}

export default function ConfigPage({ backendUrl, onBackendUrlChange, onClose }: ConfigPageProps) {
  const [apiKeys, setApiKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [urlInput, setUrlInput] = useState(backendUrl);

  useEffect(() => {
    Promise.all([
      fetchApiKeyStatus().catch(() => null),
      fetchProviders().catch(() => null),
    ]).then(([keyStatus]) => {
      if (keyStatus) setApiKeys(keyStatus.keys);
      setLoading(false);
    });
  }, []);

  const keyLabels: Record<string, string> = {
    DASHSCOPE_API_KEY: 'DashScope (Alibaba Qwen)',
    DEEPSEEK_API_KEY: 'DeepSeek',
    OPENAI_API_KEY: 'OpenAI',
    GOOGLE_API_KEY: 'Google Gemini',
    FINNHUB_API_KEY: 'FinnHub (US Stocks Data)',
    TUSHARE_TOKEN: 'Tushare (A-Share Data)',
  };

  return (
    <div className="config-overlay" onClick={onClose}>
      <div className="config-page" onClick={(e) => e.stopPropagation()}>
        <div className="config-header">
          <h2>Settings</h2>
          <button className="btn-close" onClick={onClose}>X</button>
        </div>

        <section className="config-section">
          <h3>Backend API URL</h3>
          <p className="config-desc">Set the URL of your TradingAgents-CN backend API.</p>
          <div className="url-input-row">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="http://localhost:8000"
            />
            <button
              className="btn-primary small"
              onClick={() => {
                onBackendUrlChange(urlInput);
                localStorage.setItem('backendUrl', urlInput);
              }}
            >
              Save
            </button>
          </div>
        </section>

        <section className="config-section">
          <h3>API Key Status</h3>
          <p className="config-desc">
            API keys are configured on the backend server via the .env file.
          </p>
          {loading ? (
            <p>Checking API keys...</p>
          ) : (
            <div className="key-status-list">
              {Object.entries(keyLabels).map(([key, label]) => (
                <div key={key} className="key-status-row">
                  <span className="key-name">{label}</span>
                  <span className={`key-status ${apiKeys[key] ? 'ok' : 'missing'}`}>
                    {apiKeys[key] ? 'Configured' : 'Missing'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="config-section">
          <h3>Deployment Instructions</h3>
          <div className="deploy-instructions">
            <h4>Backend (Railway)</h4>
            <ol>
              <li>Fork this project on GitHub</li>
              <li>Go to <a href="https://railway.app" target="_blank" rel="noreferrer">railway.app</a></li>
              <li>New Project → Deploy from GitHub repo</li>
              <li>Set environment variables (.env.example)</li>
              <li>Railway auto-detects railway.toml and Dockerfile.backend</li>
            </ol>

            <h4>Frontend (Cloudflare Pages)</h4>
            <ol>
              <li>Go to <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer">Cloudflare Dashboard</a></li>
              <li>Workers &amp; Pages → Create → Pages</li>
              <li>Connect your GitHub repo</li>
              <li>Build command: <code>cd frontend && npm install && npm run build</code></li>
              <li>Output directory: <code>frontend/dist</code></li>
              <li>Set <code>VITE_API_URL</code> to your Railway backend URL</li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
