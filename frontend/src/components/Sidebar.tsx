import { PROVIDERS, PROVIDER_MODELS } from '../types';

interface SidebarProps {
  provider: string;
  model: string;
  onProviderChange: (p: string) => void;
  onModelChange: (m: string) => void;
}

export default function Sidebar({
  provider,
  model,
  onProviderChange,
  onModelChange,
}: SidebarProps) {
  return (
    <div className="sidebar">
      <h3>AI Model Configuration</h3>

      <label htmlFor="provider">LLM Provider</label>
      <select
        id="provider"
        value={provider}
        onChange={(e) => {
          onProviderChange(e.target.value);
          const models = PROVIDER_MODELS[e.target.value];
          if (models?.length) onModelChange(models[0]);
        }}
      >
        {Object.entries(PROVIDERS).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>

      <label htmlFor="model">Model</label>
      <select
        id="model"
        value={model}
        onChange={(e) => onModelChange(e.target.value)}
      >
        {(PROVIDER_MODELS[provider] || []).map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      <div className="sidebar-info">
        <h4>About</h4>
        <p>
          TradingAgents-CN uses multiple AI agents (market analyst, news analyst,
          bull/bear researchers, risk manager, and trader) to analyze stocks and
          produce investment recommendations.
        </p>
        <p className="sidebar-disclaimer">
          Results are AI-generated for reference only. Not financial advice.
        </p>
      </div>
    </div>
  );
}
