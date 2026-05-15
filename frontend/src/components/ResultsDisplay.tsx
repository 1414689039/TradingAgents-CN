import type { AnalysisResult, Decision } from '../types';
import { getReportUrl } from '../services/api';

interface ResultsDisplayProps {
  result: AnalysisResult;
  analysisId: string;
}

function DecisionCard({ decision }: { decision: Decision }) {
  const actionColor =
    decision.action === 'BUY' || decision.action === '买入'
      ? '#10b981'
      : decision.action === 'SELL' || decision.action === '卖出'
      ? '#ef4444'
      : '#f59e0b';

  return (
    <div className="decision-card">
      <div className="decision-grid">
        <div className="decision-item">
          <span className="decision-label">Action</span>
          <span className="decision-value" style={{ color: actionColor, fontSize: '1.5rem' }}>
            {decision.action}
          </span>
        </div>
        <div className="decision-item">
          <span className="decision-label">Confidence</span>
          <span className="decision-value">
            {(Number(decision.confidence) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="decision-item">
          <span className="decision-label">Risk Score</span>
          <span className="decision-value">
            {(Number(decision.risk_score) * 100).toFixed(1)}%
          </span>
        </div>
        {decision.target_price != null && (
          <div className="decision-item">
            <span className="decision-label">Target Price</span>
            <span className="decision-value">{decision.target_price}</span>
          </div>
        )}
      </div>

      {decision.reasoning && (
        <details className="reasoning-details">
          <summary>AI Reasoning</summary>
          <div className="reasoning-content">
            {typeof decision.reasoning === 'string'
              ? decision.reasoning.split('\n').map((line, i) => <p key={i}>{line}</p>)
              : JSON.stringify(decision.reasoning, null, 2)}
          </div>
        </details>
      )}
    </div>
  );
}

export default function ResultsDisplay({ result, analysisId }: ResultsDisplayProps) {

  if (!result.success) {
    return (
      <div className="results-container error-container">
        <h3>Analysis Failed</h3>
        <p>{result.error || 'Unknown error occurred'}</p>
      </div>
    );
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <h2>Analysis Results: {result.stock_symbol}</h2>
        <span className="results-date">{result.analysis_date}</span>
      </div>

      <DecisionCard decision={result.decision} />

      <div className="results-meta">
        <span>Provider: {result.llm_provider} / {result.llm_model}</span>
        <span>Analysts: {result.analysts?.join(', ')}</span>
        <span>Depth: {result.research_depth}</span>
      </div>

      <div className="export-buttons">
        <a
          href={getReportUrl(analysisId, 'md')}
          className="btn-export"
          download
          target="_blank"
          rel="noreferrer"
        >
          Download Markdown Report
        </a>
        <a
          href={getReportUrl(analysisId, 'txt')}
          className="btn-export secondary"
          download
          target="_blank"
          rel="noreferrer"
        >
          Download Text Report
        </a>
      </div>

      <div className="risk-warning">
        <strong>Risk Disclaimer:</strong> This is AI-generated analysis for reference purposes only.
        It does not constitute financial advice. Investment involves risk. Always do your own research.
      </div>
    </div>
  );
}
