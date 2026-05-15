interface HeaderProps {
  onConfigClick: () => void;
  showConfig: boolean;
}

export default function Header({ onConfigClick, showConfig }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="app-title">TradingAgents-CN</h1>
        <span className="app-subtitle">Multi-Agent AI Stock Analysis</span>
      </div>
      <div className="header-right">
        <button
          className={`header-btn ${showConfig ? 'active' : ''}`}
          onClick={onConfigClick}
        >
          Settings
        </button>
      </div>
    </header>
  );
}
