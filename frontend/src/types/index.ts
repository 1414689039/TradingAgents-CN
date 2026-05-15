export interface AnalysisParams {
  stock_symbol: string;
  market_type: string;
  analysis_date: string;
  analysts: string[];
  research_depth: number;
  llm_provider: string;
  llm_model: string;
  custom_prompt?: string;
}

export interface AnalysisProgress {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  current_step: string;
  message: string;
  error?: string | null;
}

export interface Decision {
  action: string;
  confidence: number;
  risk_score: number;
  target_price: number | null;
  reasoning: string;
}

export interface AnalysisResult {
  success: boolean;
  error: string | null;
  stock_symbol: string;
  analysis_date: string;
  analysts: string[];
  research_depth: number;
  llm_provider: string;
  llm_model: string;
  decision: Decision;
}

export interface ProviderInfo {
  name: string;
  models: string[];
  requires_api_key: string;
}

export interface ApiKeyStatus {
  keys: Record<string, boolean>;
  any_llm_key: boolean;
  any_data_key: boolean;
}

export const MARKET_TYPES = ['A-shares', 'US Stocks', 'Hong Kong Stocks'] as const;

export const ANALYST_OPTIONS = [
  { value: 'market', label: 'Market Analyst', desc: 'Technical analysis' },
  { value: 'social', label: 'Social Media Analyst', desc: 'Sentiment analysis' },
  { value: 'news', label: 'News Analyst', desc: 'News event analysis' },
  { value: 'fundamentals', label: 'Fundamentals Analyst', desc: 'Financial analysis' },
] as const;

export const PROVIDERS: Record<string, string> = {
  dashscope: 'Alibaba DashScope (Qwen)',
  deepseek: 'DeepSeek',
  openai: 'OpenAI',
  google: 'Google Gemini',
  openrouter: 'OpenRouter',
};

export const PROVIDER_MODELS: Record<string, string[]> = {
  dashscope: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-max-longcontext'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o4-mini'],
  google: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
  openrouter: ['openai/gpt-4o', 'anthropic/claude-sonnet-4', 'google/gemini-2.5-flash', 'deepseek/deepseek-chat'],
};
