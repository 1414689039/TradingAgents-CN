interface ProgressDisplayProps {
  status: string;
  progress: number;
  currentStep: string;
  message: string;
  error?: string | null;
  onCancel: () => void;
}

export default function ProgressDisplay({
  status,
  progress,
  currentStep,
  message,
  error,
  onCancel,
}: ProgressDisplayProps) {
  const stepLabels: Record<string, string> = {
    initializing: 'Initializing',
    validating: 'Validating Stock Data',
    starting: 'Starting Analysis',
    analyzing: 'Running Analysis',
    formatting: 'Formatting Results',
    done: 'Complete',
  };

  return (
    <div className="progress-container">
      <div className="progress-header">
        <h3>
          {status === 'failed'
            ? 'Analysis Failed'
            : status === 'completed'
            ? 'Analysis Complete!'
            : 'Analysis in Progress'}
        </h3>
        {status === 'running' && (
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>

      <div className="progress-bar-wrapper">
        <div
          className={`progress-bar ${status === 'failed' ? 'error' : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="progress-info">
        <span className="progress-percent">{progress}%</span>
        <span className="progress-step">
          {stepLabels[currentStep] || currentStep}
        </span>
      </div>

      <p className="progress-message">{message}</p>

      {error && <div className="progress-error">{error}</div>}
    </div>
  );
}
