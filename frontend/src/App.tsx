import { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AnalysisForm from './components/AnalysisForm';
import ProgressDisplay from './components/ProgressDisplay';
import ResultsDisplay from './components/ResultsDisplay';
import ConfigPage from './components/ConfigPage';
import {
  startAnalysis,
  subscribeToProgress,
  fetchResults,
  healthCheck,
} from './services/api';
import type { AnalysisProgress, AnalysisResult } from './types';
import './App.css';

type AppState = 'idle' | 'running' | 'completed' | 'failed' | 'error';

export default function App() {
  const [provider, setProvider] = useState(() => localStorage.getItem('llmProvider') || 'deepseek');
  const [model, setModel] = useState(() => localStorage.getItem('llmModel') || 'deepseek-chat');
  const [backendUrl, setBackendUrl] = useState(() => localStorage.getItem('backendUrl') || 'http://localhost:8000');
  const [showConfig, setShowConfig] = useState(false);
  const [appState, setAppState] = useState<AppState>('idle');
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const lastFormRef = useRef<{
    stock_symbol: string;
    market_type: string;
    analysts: string[];
    research_depth: number;
  } | null>(null);

  // Check backend connectivity on mount
  useEffect(() => {
    healthCheck().then(setBackendOnline);
  }, [backendUrl]);

  // Persist provider/model
  useEffect(() => {
    localStorage.setItem('llmProvider', provider);
  }, [provider]);
  useEffect(() => {
    localStorage.setItem('llmModel', model);
  }, [model]);

  const handleStartAnalysis = useCallback(
    async (params: {
      stock_symbol: string;
      market_type: string;
      analysis_date: string;
      analysts: string[];
      research_depth: number;
      custom_prompt: string;
    }) => {
      setAppState('running');
      setProgress({
        id: '',
        status: 'running',
        progress: 0,
        current_step: 'starting',
        message: 'Starting analysis...',
      });
      setResult(null);
      setErrorMessage(null);

      try {
        const { analysis_id } = await startAnalysis({
          ...params,
          llm_provider: provider,
          llm_model: model,
        });

        setAnalysisId(analysis_id);
        lastFormRef.current = {
          stock_symbol: params.stock_symbol,
          market_type: params.market_type,
          analysts: params.analysts,
          research_depth: params.research_depth,
        };

        const controller = subscribeToProgress(
          analysis_id,
          (data) => {
            setProgress({
              id: data.id,
              status: data.status as AnalysisProgress['status'],
              progress: data.progress,
              current_step: data.current_step,
              message: data.message,
              error: data.error,
            });
          },
          async () => {
            setAppState('completed');
            try {
              const res = await fetchResults(analysis_id);
              setResult(res);
            } catch {
              setErrorMessage('Failed to fetch results');
              setAppState('error');
            }
          },
          (error) => {
            setAppState('failed');
            setErrorMessage(error);
          },
        );

        abortRef.current = controller;
      } catch (err: any) {
        setAppState('error');
        setErrorMessage(err.message || 'Failed to start analysis');
      }
    },
    [provider, model, backendUrl],
  );

  const handleCancel = () => {
    abortRef.current?.abort();
    setAppState('idle');
    setProgress(null);
  };

  const handleReset = () => {
    setAppState('idle');
    setProgress(null);
    setResult(null);
    setErrorMessage(null);
    setAnalysisId(null);
  };

  return (
    <div className="app">
      <Header
        onConfigClick={() => setShowConfig(!showConfig)}
        showConfig={showConfig}
      />

      {showConfig && (
        <ConfigPage
          backendUrl={backendUrl}
          onBackendUrlChange={setBackendUrl}
          onClose={() => setShowConfig(false)}
        />
      )}

      <div className="app-body">
        <Sidebar
          provider={provider}
          model={model}
          onProviderChange={setProvider}
          onModelChange={setModel}
        />

        <main className="main-content">
          {backendOnline === false && (
            <div className="banner banner-warning">
              Backend API is not accessible at {backendUrl}. Make sure the server is running.
            </div>
          )}

          {appState === 'idle' && (
            <AnalysisForm
              onSubmit={handleStartAnalysis}
              disabled={false}
              defaultValues={lastFormRef.current || undefined}
            />
          )}

          {appState === 'running' && progress && (
            <>
              <AnalysisForm
                onSubmit={() => {}}
                disabled={true}
                defaultValues={lastFormRef.current || undefined}
              />
              <ProgressDisplay
                status={progress.status}
                progress={progress.progress}
                currentStep={progress.current_step}
                message={progress.message}
                error={progress.error}
                onCancel={handleCancel}
              />
            </>
          )}

          {(appState === 'completed' || appState === 'failed') && (
            <>
              {progress && (
                <ProgressDisplay
                  status={progress.status}
                  progress={progress.progress}
                  currentStep={progress.current_step}
                  message={progress.message}
                  error={progress.error}
                  onCancel={() => {}}
                />
              )}
              {result && <ResultsDisplay result={result} analysisId={analysisId!} />}
              {!result && errorMessage && (
                <div className="error-container">
                  <h3>Error</h3>
                  <p>{errorMessage}</p>
                </div>
              )}
              <button className="btn-primary" onClick={handleReset} style={{ marginTop: '1rem' }}>
                Run Another Analysis
              </button>
            </>
          )}

          {appState === 'error' && !progress && (
            <div className="error-container">
              <h3>Connection Error</h3>
              <p>{errorMessage || 'Failed to connect to backend'}</p>
              <button className="btn-primary" onClick={handleReset}>
                Try Again
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
