import { useState } from 'react';
import { MARKET_TYPES, ANALYST_OPTIONS } from '../types';

interface AnalysisFormProps {
  onSubmit: (params: {
    stock_symbol: string;
    market_type: string;
    analysis_date: string;
    analysts: string[];
    research_depth: number;
    custom_prompt: string;
  }) => void;
  disabled: boolean;
  defaultValues?: {
    stock_symbol?: string;
    market_type?: string;
    analysts?: string[];
    research_depth?: number;
  };
}

export default function AnalysisForm({ onSubmit, disabled, defaultValues }: AnalysisFormProps) {
  const [marketType, setMarketType] = useState(defaultValues?.market_type || 'A-shares');
  const [symbol, setSymbol] = useState(defaultValues?.stock_symbol || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [depth, setDepth] = useState(defaultValues?.research_depth || 3);
  const [analysts, setAnalysts] = useState<string[]>(defaultValues?.analysts || ['market', 'fundamentals']);
  const [customPrompt, setCustomPrompt] = useState('');

  const toggleAnalyst = (value: string) => {
    setAnalysts((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;
    onSubmit({
      stock_symbol: symbol.trim(),
      market_type: marketType,
      analysis_date: date,
      analysts,
      research_depth: depth,
      custom_prompt: customPrompt,
    });
  };

  const symbolPlaceholder = marketType === 'A-shares'
    ? '000001'
    : marketType === 'US Stocks'
    ? 'AAPL'
    : '0700.HK';

  const depthLabels: Record<number, string> = {
    1: 'Quick (2-4 min)',
    2: 'Basic (3-5 min)',
    3: 'Standard (5-10 min)',
    4: 'Deep (10-18 min)',
    5: 'Full (15-25 min)',
  };

  return (
    <form className="analysis-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="market">Market</label>
          <select
            id="market"
            value={marketType}
            onChange={(e) => setMarketType(e.target.value)}
            disabled={disabled}
          >
            {MARKET_TYPES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="form-group flex-2">
          <label htmlFor="symbol">Stock Symbol</label>
          <input
            id="symbol"
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder={symbolPlaceholder}
            disabled={disabled}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="date">Analysis Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="form-group">
        <label>
          Research Depth: <strong>{depthLabels[depth]}</strong>
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value))}
          disabled={disabled}
          className="depth-slider"
        />
        <div className="depth-labels">
          <span>1 - Quick</span>
          <span>3 - Standard</span>
          <span>5 - Full</span>
        </div>
      </div>

      <div className="form-group">
        <label>Analysts</label>
        <div className="analyst-options">
          {ANALYST_OPTIONS.map((opt) => (
            <label key={opt.value} className="analyst-chip">
              <input
                type="checkbox"
                checked={analysts.includes(opt.value)}
                onChange={() => toggleAnalyst(opt.value)}
                disabled={disabled}
              />
              <span className="chip-content">
                <strong>{opt.label}</strong>
                <small>{opt.desc}</small>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="customPrompt">Custom Instructions (optional)</label>
        <textarea
          id="customPrompt"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Additional analysis instructions..."
          disabled={disabled}
          rows={2}
        />
      </div>

      <button type="submit" className="btn-primary" disabled={disabled || !symbol.trim()}>
        {disabled ? 'Analysis Running...' : 'Start Analysis'}
      </button>
    </form>
  );
}
