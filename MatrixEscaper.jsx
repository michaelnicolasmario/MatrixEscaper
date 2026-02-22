import { useState, useEffect, useCallback, useRef } from "react";

const FORTUNE500_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology" },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology" },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary" },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Technology" },
  { symbol: "META", name: "Meta Platforms", sector: "Technology" },
  { symbol: "BRK", name: "Berkshire Hathaway", sector: "Financials" },
  { symbol: "JPM", name: "JPMorgan Chase", sector: "Financials" },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare" },
  { symbol: "V", name: "Visa Inc.", sector: "Financials" },
  { symbol: "PG", name: "Procter & Gamble", sector: "Consumer Staples" },
  { symbol: "XOM", name: "ExxonMobil Corp.", sector: "Energy" },
  { symbol: "HD", name: "Home Depot Inc.", sector: "Consumer Discretionary" },
  { symbol: "CVX", name: "Chevron Corp.", sector: "Energy" },
  { symbol: "MRK", name: "Merck & Co.", sector: "Healthcare" },
  { symbol: "ABBV", name: "AbbVie Inc.", sector: "Healthcare" },
  { symbol: "KO", name: "Coca-Cola Co.", sector: "Consumer Staples" },
  { symbol: "PEP", name: "PepsiCo Inc.", sector: "Consumer Staples" },
  { symbol: "BAC", name: "Bank of America", sector: "Financials" },
  { symbol: "TMO", name: "Thermo Fisher", sector: "Healthcare" },
];

const BASE_PRICES = {
  AAPL: 189.5, MSFT: 415.2, GOOGL: 175.8, AMZN: 198.4, NVDA: 875.3,
  META: 512.6, BRK: 398.1, JPM: 198.7, JNJ: 152.3, V: 278.9,
  PG: 165.4, XOM: 112.8, HD: 375.2, CVX: 158.9, MRK: 128.4,
  ABBV: 172.6, KO: 61.8, PEP: 172.3, BAC: 38.9, TMO: 562.1
};

function generatePriceHistory(basePrice, days = 30) {
  const history = [];
  let price = basePrice * (0.85 + Math.random() * 0.1);
  for (let i = days; i >= 0; i--) {
    const change = (Math.random() - 0.48) * price * 0.02;
    price = Math.max(price + change, price * 0.5);
    history.push(parseFloat(price.toFixed(2)));
  }
  return history;
}

function calcRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return parseFloat((100 - 100 / (1 + rs)).toFixed(1));
}

function calcMACD(prices) {
  if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };
  const ema12 = calcEMA(prices, 12);
  const ema26 = calcEMA(prices, 26);
  const macdLine = ema12 - ema26;
  return {
    macd: parseFloat(macdLine.toFixed(2)),
    signal: parseFloat((macdLine * 0.9).toFixed(2)),
    histogram: parseFloat((macdLine * 0.1).toFixed(2))
  };
}

function calcEMA(prices, period) {
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

function calcBollingerBands(prices, period = 20) {
  const slice = prices.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / slice.length;
  const std = Math.sqrt(variance);
  return {
    upper: parseFloat((mean + 2 * std).toFixed(2)),
    middle: parseFloat(mean.toFixed(2)),
    lower: parseFloat((mean - 2 * std).toFixed(2))
  };
}

function generateSignal(prices, rsi, macd, bb) {
  const currentPrice = prices[prices.length - 1];
  let bullScore = 0, bearScore = 0;
  if (rsi < 30) bullScore += 2;
  else if (rsi < 45) bullScore += 1;
  else if (rsi > 70) bearScore += 2;
  else if (rsi > 55) bearScore += 1;
  if (macd.histogram > 0) bullScore += 1;
  else bearScore += 1;
  if (macd.macd > macd.signal) bullScore += 1;
  else bearScore += 1;
  if (currentPrice < bb.lower) bullScore += 2;
  else if (currentPrice > bb.upper) bearScore += 2;
  const trend = prices[prices.length - 1] > prices[prices.length - 5];
  if (trend) bullScore += 1; else bearScore += 1;
  if (bullScore > bearScore + 2) return { type: "BUY", strength: Math.min(100, 50 + bullScore * 8), color: "#00ff88" };
  if (bearScore > bullScore + 2) return { type: "SELL", strength: Math.min(100, 50 + bearScore * 8), color: "#ff4466" };
  return { type: "HOLD", strength: 50, color: "#ffaa00" };
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Exo+2:wght@300;400;600;700;900&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    background: #030810;
    color: #c8e6ff;
    font-family: 'Exo 2', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  .scanline {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 255, 136, 0.015) 2px,
      rgba(0, 255, 136, 0.015) 4px
    );
    pointer-events: none;
    z-index: 1000;
  }

  .grid-bg {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image:
      linear-gradient(rgba(0, 200, 255, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 200, 255, 0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  .app {
    position: relative;
    z-index: 1;
    max-width: 1600px;
    margin: 0 auto;
    padding: 20px;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 30px;
    border: 1px solid rgba(0, 200, 255, 0.2);
    background: rgba(0, 20, 40, 0.8);
    backdrop-filter: blur(10px);
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
  }

  .header::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00c8ff, #00ff88, transparent);
    animation: scanH 3s linear infinite;
  }

  @keyframes scanH {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .logo-icon {
    width: 48px;
    height: 48px;
    border: 2px solid #00c8ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Share Tech Mono', monospace;
    font-size: 18px;
    color: #00c8ff;
    position: relative;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 10px #00c8ff44; }
    50% { box-shadow: 0 0 25px #00c8ff88, 0 0 50px #00c8ff22; }
  }

  .logo h1 {
    font-size: 28px;
    font-weight: 900;
    letter-spacing: 4px;
    background: linear-gradient(135deg, #00c8ff, #00ff88);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-transform: uppercase;
  }

  .logo p {
    font-size: 11px;
    letter-spacing: 3px;
    color: #4a7a9b;
    text-transform: uppercase;
    font-family: 'Share Tech Mono', monospace;
  }

  .header-stats {
    display: flex;
    gap: 30px;
    align-items: center;
  }

  .stat-chip {
    text-align: center;
    padding: 8px 16px;
    border: 1px solid rgba(0, 200, 255, 0.2);
    background: rgba(0, 200, 255, 0.05);
  }

  .stat-chip .label {
    font-size: 10px;
    letter-spacing: 2px;
    color: #4a7a9b;
    text-transform: uppercase;
    font-family: 'Share Tech Mono', monospace;
  }

  .stat-chip .value {
    font-size: 20px;
    font-weight: 700;
    font-family: 'Share Tech Mono', monospace;
  }

  .live-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border: 1px solid #00ff88;
    background: rgba(0, 255, 136, 0.05);
    font-size: 11px;
    letter-spacing: 2px;
    color: #00ff88;
    font-family: 'Share Tech Mono', monospace;
  }

  .live-dot {
    width: 8px;
    height: 8px;
    background: #00ff88;
    border-radius: 50%;
    animation: blink 1s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.2; }
  }

  .portfolio-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }

  .portfolio-card {
    padding: 20px 24px;
    border: 1px solid rgba(0, 200, 255, 0.15);
    background: rgba(0, 15, 30, 0.9);
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s;
  }

  .portfolio-card:hover {
    border-color: rgba(0, 200, 255, 0.4);
  }

  .portfolio-card .p-label {
    font-size: 10px;
    letter-spacing: 3px;
    color: #4a7a9b;
    text-transform: uppercase;
    font-family: 'Share Tech Mono', monospace;
    margin-bottom: 8px;
  }

  .portfolio-card .p-value {
    font-size: 28px;
    font-weight: 700;
    font-family: 'Share Tech Mono', monospace;
    line-height: 1;
  }

  .portfolio-card .p-change {
    font-size: 12px;
    margin-top: 6px;
    font-family: 'Share Tech Mono', monospace;
  }

  .main-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 16px;
    align-items: start;
  }

  .panel {
    border: 1px solid rgba(0, 200, 255, 0.15);
    background: rgba(0, 15, 30, 0.9);
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid rgba(0, 200, 255, 0.1);
    background: rgba(0, 200, 255, 0.03);
  }

  .panel-title {
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #00c8ff;
    font-family: 'Share Tech Mono', monospace;
  }

  .stock-table {
    width: 100%;
    border-collapse: collapse;
  }

  .stock-table th {
    padding: 10px 16px;
    text-align: left;
    font-size: 10px;
    letter-spacing: 2px;
    color: #3a5a7a;
    text-transform: uppercase;
    font-family: 'Share Tech Mono', monospace;
    border-bottom: 1px solid rgba(0, 200, 255, 0.08);
    font-weight: 400;
  }

  .stock-table td {
    padding: 12px 16px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 13px;
    border-bottom: 1px solid rgba(0, 200, 255, 0.05);
    cursor: pointer;
    transition: background 0.2s;
  }

  .stock-table tr:hover td {
    background: rgba(0, 200, 255, 0.05);
  }

  .stock-table tr.selected td {
    background: rgba(0, 200, 255, 0.08);
    border-left: 2px solid #00c8ff;
  }

  .signal-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    font-size: 10px;
    letter-spacing: 2px;
    font-weight: 600;
    border: 1px solid;
  }

  .strength-bar-wrap {
    width: 60px;
    height: 4px;
    background: rgba(255,255,255,0.08);
    border-radius: 0;
    overflow: hidden;
  }

  .strength-bar {
    height: 100%;
    border-radius: 0;
    transition: width 0.5s ease;
  }

  .mini-chart {
    display: flex;
    align-items: flex-end;
    gap: 1px;
    height: 28px;
    width: 70px;
  }

  .mini-bar {
    flex: 1;
    border-radius: 0;
    min-height: 2px;
    transition: height 0.3s;
  }

  .right-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .detail-panel {
    border: 1px solid rgba(0, 200, 255, 0.15);
    background: rgba(0, 15, 30, 0.9);
  }

  .chart-area {
    padding: 20px;
    height: 180px;
    position: relative;
  }

  .chart-svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .indicators-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: rgba(0, 200, 255, 0.08);
    border-top: 1px solid rgba(0, 200, 255, 0.08);
  }

  .indicator-item {
    padding: 14px;
    background: rgba(0, 15, 30, 0.9);
    text-align: center;
  }

  .indicator-item .i-label {
    font-size: 9px;
    letter-spacing: 2px;
    color: #3a5a7a;
    text-transform: uppercase;
    font-family: 'Share Tech Mono', monospace;
    margin-bottom: 5px;
  }

  .indicator-item .i-value {
    font-size: 16px;
    font-weight: 700;
    font-family: 'Share Tech Mono', monospace;
  }

  .trade-panel {
    border: 1px solid rgba(0, 200, 255, 0.15);
    background: rgba(0, 15, 30, 0.9);
    padding: 20px;
  }

  .trade-input-group {
    margin-bottom: 14px;
  }

  .trade-input-group label {
    display: block;
    font-size: 10px;
    letter-spacing: 2px;
    color: #4a7a9b;
    text-transform: uppercase;
    font-family: 'Share Tech Mono', monospace;
    margin-bottom: 6px;
  }

  .trade-input {
    width: 100%;
    background: rgba(0, 200, 255, 0.05);
    border: 1px solid rgba(0, 200, 255, 0.2);
    color: #c8e6ff;
    padding: 10px 14px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }

  .trade-input:focus {
    border-color: #00c8ff;
  }

  .trade-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 16px;
  }

  .btn-buy {
    padding: 12px;
    background: rgba(0, 255, 136, 0.1);
    border: 1px solid #00ff88;
    color: #00ff88;
    font-family: 'Share Tech Mono', monospace;
    font-size: 13px;
    letter-spacing: 2px;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.2s;
  }

  .btn-buy:hover {
    background: rgba(0, 255, 136, 0.2);
    box-shadow: 0 0 15px rgba(0, 255, 136, 0.2);
  }

  .btn-sell {
    padding: 12px;
    background: rgba(255, 68, 102, 0.1);
    border: 1px solid #ff4466;
    color: #ff4466;
    font-family: 'Share Tech Mono', monospace;
    font-size: 13px;
    letter-spacing: 2px;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.2s;
  }

  .btn-sell:hover {
    background: rgba(255, 68, 102, 0.2);
    box-shadow: 0 0 15px rgba(255, 68, 102, 0.2);
  }

  .log-panel {
    border: 1px solid rgba(0, 200, 255, 0.15);
    background: rgba(0, 15, 30, 0.9);
    max-height: 200px;
    overflow-y: auto;
  }

  .log-entry {
    padding: 8px 16px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    border-bottom: 1px solid rgba(0, 200, 255, 0.05);
    display: flex;
    gap: 12px;
    align-items: center;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .log-time { color: #3a5a7a; }
  .log-buy { color: #00ff88; }
  .log-sell { color: #ff4466; }
  .log-info { color: #00c8ff; }

  .positions-list {
    max-height: 220px;
    overflow-y: auto;
  }

  .position-row {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(0, 200, 255, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px;
    transition: background 0.2s;
  }

  .position-row:hover {
    background: rgba(0, 200, 255, 0.04);
  }

  .disclaimer {
    padding: 12px 20px;
    background: rgba(255, 170, 0, 0.05);
    border: 1px solid rgba(255, 170, 0, 0.2);
    font-size: 11px;
    color: #8a6a00;
    font-family: 'Share Tech Mono', monospace;
    margin-top: 16px;
    letter-spacing: 0.5px;
    line-height: 1.6;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0, 200, 255, 0.2); }

  .ai-analysis {
    padding: 14px 16px;
    background: rgba(0, 200, 255, 0.03);
    border-top: 1px solid rgba(0, 200, 255, 0.08);
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    color: #5a8aaa;
    line-height: 1.7;
    min-height: 60px;
  }

  .ai-loading {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .ai-dot {
    width: 4px;
    height: 4px;
    background: #00c8ff;
    border-radius: 50%;
    animation: dotPulse 1.2s ease-in-out infinite;
  }

  .ai-dot:nth-child(2) { animation-delay: 0.2s; }
  .ai-dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes dotPulse {
    0%, 100% { opacity: 0.2; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
  }

  .top-picks {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    flex-wrap: wrap;
  }

  .pick-chip {
    padding: 5px 12px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 1px;
  }

  .pick-chip:hover {
    background: rgba(0, 255, 136, 0.1);
  }

  @media (max-width: 1100px) {
    .main-grid { grid-template-columns: 1fr; }
    .portfolio-bar { grid-template-columns: repeat(2, 1fr); }
  }
`;

function MiniChart({ prices, color }) {
  const recent = prices.slice(-12);
  const min = Math.min(...recent);
  const max = Math.max(...recent);
  const range = max - min || 1;
  return (
    <div className="mini-chart">
      {recent.map((p, i) => (
        <div
          key={i}
          className="mini-bar"
          style={{
            height: `${((p - min) / range) * 100}%`,
            background: color,
            opacity: 0.4 + (i / recent.length) * 0.6
          }}
        />
      ))}
    </div>
  );
}

function SparkLine({ prices, width = 300, height = 140 }) {
  if (!prices || prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const pad = 10;
  const pts = prices.map((p, i) => {
    const x = pad + (i / (prices.length - 1)) * (width - pad * 2);
    const y = pad + ((1 - (p - min) / range) * (height - pad * 2));
    return `${x},${y}`;
  }).join(" ");
  const lastY = pad + ((1 - (prices[prices.length - 1] - min) / range) * (height - pad * 2));
  const isUp = prices[prices.length - 1] >= prices[0];
  const color = isUp ? "#00ff88" : "#ff4466";
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="grd" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <polyline
        points={`${pad},${height - pad} ${pts} ${width - pad},${height - pad}`}
        fill="url(#grd)"
        stroke="none"
      />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx={parseFloat(pts.split(" ").pop().split(",")[0])} cy={lastY} r="3" fill={color} />
    </svg>
  );
}

export default function MatrixEscaper() {
  const [stocks, setStocks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [portfolio, setPortfolio] = useState({ cash: 100000, positions: {} });
  const [orderQty, setOrderQty] = useState(10);
  const [logs, setLogs] = useState([]);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const aiAbort = useRef(null);

  const initStocks = useCallback(() => {
    return FORTUNE500_STOCKS.map(s => {
      const base = BASE_PRICES[s.symbol];
      const history = generatePriceHistory(base);
      const current = history[history.length - 1];
      const prev = history[history.length - 2];
      const rsi = calcRSI(history);
      const macd = calcMACD(history);
      const bb = calcBollingerBands(history);
      const signal = generateSignal(history, rsi, macd, bb);
      return {
        ...s,
        price: current,
        prevPrice: prev,
        change: parseFloat(((current - prev) / prev * 100).toFixed(2)),
        history,
        rsi,
        macd,
        bb,
        signal
      };
    });
  }, []);

  useEffect(() => {
    const s = initStocks();
    setStocks(s);
    setSelected(s[0]);
    addLog("info", "MatrixEscaper initialized. Paper trading mode active.");
    addLog("info", `Starting capital: $100,000.00`);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prev => prev.map(s => {
        const change = (Math.random() - 0.49) * s.price * 0.008;
        const newPrice = parseFloat(Math.max(s.price + change, 1).toFixed(2));
        const newHistory = [...s.history.slice(1), newPrice];
        const rsi = calcRSI(newHistory);
        const macd = calcMACD(newHistory);
        const bb = calcBollingerBands(newHistory);
        const signal = generateSignal(newHistory, rsi, macd, bb);
        return {
          ...s,
          prevPrice: s.price,
          price: newPrice,
          change: parseFloat(((newPrice - s.price) / s.price * 100 + s.change * 0.7).toFixed(2)),
          history: newHistory,
          rsi,
          macd,
          bb,
          signal
        };
      }));
      setTick(t => t + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selected) {
      setStocks(prev => {
        const updated = prev.find(s => s.symbol === selected.symbol);
        if (updated) setSelected(updated);
        return prev;
      });
    }
  }, [tick]);

  const addLog = (type, msg) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLogs(prev => [{ type, msg, time }, ...prev].slice(0, 50));
  };

  const portfolioValue = () => {
    let val = portfolio.cash;
    Object.entries(portfolio.positions).forEach(([sym, pos]) => {
      const stock = stocks.find(s => s.symbol === sym);
      if (stock) val += pos.shares * stock.price;
    });
    return val;
  };

  const totalPnL = () => portfolioValue() - 100000;

  const handleBuy = () => {
    if (!selected) return;
    const cost = selected.price * orderQty;
    if (cost > portfolio.cash) {
      addLog("info", `Insufficient funds for ${orderQty} × ${selected.symbol}`);
      return;
    }
    setPortfolio(prev => {
      const pos = prev.positions[selected.symbol];
      const newPos = pos
        ? { shares: pos.shares + orderQty, avgCost: (pos.avgCost * pos.shares + selected.price * orderQty) / (pos.shares + orderQty) }
        : { shares: orderQty, avgCost: selected.price };
      return {
        cash: parseFloat((prev.cash - cost).toFixed(2)),
        positions: { ...prev.positions, [selected.symbol]: newPos }
      };
    });
    addLog("buy", `BUY ${orderQty} × ${selected.symbol} @ $${selected.price} = $${cost.toFixed(2)}`);
  };

  const handleSell = () => {
    if (!selected) return;
    const pos = portfolio.positions[selected.symbol];
    if (!pos || pos.shares < orderQty) {
      addLog("info", `Insufficient shares to sell ${orderQty} × ${selected.symbol}`);
      return;
    }
    const proceeds = selected.price * orderQty;
    setPortfolio(prev => {
      const newShares = prev.positions[selected.symbol].shares - orderQty;
      const newPositions = { ...prev.positions };
      if (newShares <= 0) delete newPositions[selected.symbol];
      else newPositions[selected.symbol] = { ...prev.positions[selected.symbol], shares: newShares };
      return { cash: parseFloat((prev.cash + proceeds).toFixed(2)), positions: newPositions };
    });
    const pnlPerShare = selected.price - (portfolio.positions[selected.symbol]?.avgCost || selected.price);
    addLog("sell", `SELL ${orderQty} × ${selected.symbol} @ $${selected.price} | PnL/share: ${pnlPerShare >= 0 ? '+' : ''}$${pnlPerShare.toFixed(2)}`);
  };

  const fetchAIAnalysis = async (stock) => {
    if (aiAbort.current) aiAbort.current = false;
    setAiLoading(true);
    setAiText("");
    const controller = { active: true };
    aiAbort.current = controller;
    try {
      const prompt = `You are a concise financial analyst. Analyze ${stock.symbol} (${stock.name}) with these indicators:
- Current Price: $${stock.price}
- RSI(14): ${stock.rsi}
- MACD: ${stock.macd.macd} | Signal: ${stock.macd.signal} | Histogram: ${stock.macd.histogram}
- Bollinger Bands: Upper $${stock.bb.upper} | Mid $${stock.bb.middle} | Lower $${stock.bb.lower}
- Signal: ${stock.signal.type} (strength: ${stock.signal.strength}%)
- Day Change: ${stock.change}%

Give a 2-sentence paper trading insight. Be specific about what the indicators suggest. Note this is simulated/educational.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      if (controller.active) {
        const text = data.content?.[0]?.text || "Analysis unavailable.";
        setAiText(text);
      }
    } catch (e) {
      if (controller.active) setAiText("Analysis engine offline. Check API connectivity.");
    }
    if (controller.active) setAiLoading(false);
  };

  const selectStock = (stock) => {
    setSelected(stock);
    fetchAIAnalysis(stock);
  };

  const pnl = totalPnL();
  const portVal = portfolioValue();
  const topBuys = stocks.filter(s => s.signal.type === "BUY").slice(0, 5);

  return (
    <>
      <style>{STYLES}</style>
      <div className="scanline" />
      <div className="grid-bg" />
      <div className="app">
        {/* Header */}
        <div className="header">
          <div className="logo">
            <div className="logo-icon">ME</div>
            <div>
              <h1>MatrixEscaper</h1>
              <p>Fortune 500 · AI Signal Engine · Paper Trading</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-chip">
              <div className="label">Portfolio</div>
              <div className="value" style={{ color: "#00c8ff" }}>${portVal.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            </div>
            <div className="stat-chip">
              <div className="label">Total P&L</div>
              <div className="value" style={{ color: pnl >= 0 ? "#00ff88" : "#ff4466" }}>
                {pnl >= 0 ? "+" : ""}${pnl.toFixed(0)}
              </div>
            </div>
            <div className="live-badge">
              <div className="live-dot" />
              PAPER LIVE
            </div>
          </div>
        </div>

        {/* Portfolio Bar */}
        <div className="portfolio-bar">
          <div className="portfolio-card">
            <div className="p-label">Cash Balance</div>
            <div className="p-value" style={{ color: "#00c8ff" }}>${portfolio.cash.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            <div className="p-change" style={{ color: "#4a7a9b" }}>Available to deploy</div>
          </div>
          <div className="portfolio-card">
            <div className="p-label">Positions Value</div>
            <div className="p-value" style={{ color: "#c8e6ff" }}>
              ${(portVal - portfolio.cash).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="p-change" style={{ color: "#4a7a9b" }}>{Object.keys(portfolio.positions).length} open positions</div>
          </div>
          <div className="portfolio-card">
            <div className="p-label">Unrealized P&L</div>
            <div className="p-value" style={{ color: pnl >= 0 ? "#00ff88" : "#ff4466" }}>
              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
            </div>
            <div className="p-change" style={{ color: pnl >= 0 ? "#00aa55" : "#aa2244" }}>
              {((pnl / 100000) * 100).toFixed(2)}% return
            </div>
          </div>
          <div className="portfolio-card">
            <div className="p-label">Active Signals</div>
            <div className="p-value" style={{ color: "#00ff88" }}>
              {stocks.filter(s => s.signal.type === "BUY").length} BUY
              <span style={{ color: "#4a7a9b", fontSize: 16 }}> · </span>
              <span style={{ color: "#ff4466" }}>{stocks.filter(s => s.signal.type === "SELL").length} SELL</span>
            </div>
            <div className="p-change" style={{ color: "#4a7a9b" }}>Live technical analysis</div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="main-grid">
          {/* Left: Stock Table */}
          <div>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Fortune 500 · Live Signals</span>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#3a5a7a" }}>
                  AUTO-REFRESH 3s
                </span>
              </div>
              {topBuys.length > 0 && (
                <div style={{ borderBottom: "1px solid rgba(0,200,255,0.08)" }}>
                  <div style={{ padding: "8px 16px 4px", fontSize: 10, letterSpacing: 2, color: "#3a5a7a", fontFamily: "'Share Tech Mono', monospace", textTransform: "uppercase" }}>
                    ◈ Top AI Picks
                  </div>
                  <div className="top-picks">
                    {topBuys.map(s => (
                      <div
                        key={s.symbol}
                        className="pick-chip"
                        style={{ borderColor: "#00ff88", color: "#00ff88" }}
                        onClick={() => selectStock(s)}
                      >
                        {s.symbol} +{s.signal.strength}%
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Price</th>
                    <th>Chg%</th>
                    <th>RSI</th>
                    <th>Signal</th>
                    <th>Strength</th>
                    <th>Chart</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map(s => (
                    <tr
                      key={s.symbol}
                      className={selected?.symbol === s.symbol ? "selected" : ""}
                      onClick={() => selectStock(s)}
                    >
                      <td>
                        <div style={{ fontWeight: 700, color: "#c8e6ff" }}>{s.symbol}</div>
                        <div style={{ fontSize: 10, color: "#3a5a7a", marginTop: 2 }}>{s.sector}</div>
                      </td>
                      <td style={{ color: "#c8e6ff" }}>${s.price.toFixed(2)}</td>
                      <td style={{ color: s.change >= 0 ? "#00ff88" : "#ff4466" }}>
                        {s.change >= 0 ? "▲" : "▼"}{Math.abs(s.change).toFixed(2)}%
                      </td>
                      <td style={{ color: s.rsi > 70 ? "#ff4466" : s.rsi < 30 ? "#00ff88" : "#c8e6ff" }}>
                        {s.rsi}
                      </td>
                      <td>
                        <span
                          className="signal-badge"
                          style={{ color: s.signal.color, borderColor: s.signal.color + "44", background: s.signal.color + "11" }}
                        >
                          {s.signal.type}
                        </span>
                      </td>
                      <td>
                        <div className="strength-bar-wrap">
                          <div className="strength-bar" style={{ width: `${s.signal.strength}%`, background: s.signal.color }} />
                        </div>
                      </td>
                      <td>
                        <MiniChart prices={s.history} color={s.signal.color} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Activity Log */}
            <div className="log-panel" style={{ marginTop: 16 }}>
              <div className="panel-header">
                <span className="panel-title">Activity Log</span>
              </div>
              {logs.map((l, i) => (
                <div key={i} className="log-entry">
                  <span className="log-time">{l.time}</span>
                  <span className={`log-${l.type}`}>
                    {l.type === "buy" ? "▲ " : l.type === "sell" ? "▼ " : "● "}
                    {l.msg}
                  </span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="log-entry"><span className="log-info">Awaiting activity...</span></div>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="right-panel">
            {selected && (
              <>
                <div className="detail-panel">
                  <div className="panel-header">
                    <span className="panel-title">{selected.symbol} · {selected.name}</span>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: selected.signal.color }}>
                      {selected.signal.type}
                    </span>
                  </div>
                  <div className="chart-area">
                    <SparkLine prices={selected.history} width={340} height={140} />
                  </div>
                  <div className="indicators-grid">
                    <div className="indicator-item">
                      <div className="i-label">RSI</div>
                      <div className="i-value" style={{ color: selected.rsi > 70 ? "#ff4466" : selected.rsi < 30 ? "#00ff88" : "#c8e6ff" }}>
                        {selected.rsi}
                      </div>
                    </div>
                    <div className="indicator-item">
                      <div className="i-label">MACD</div>
                      <div className="i-value" style={{ color: selected.macd.histogram > 0 ? "#00ff88" : "#ff4466" }}>
                        {selected.macd.macd}
                      </div>
                    </div>
                    <div className="indicator-item">
                      <div className="i-label">BB Width</div>
                      <div className="i-value" style={{ color: "#c8e6ff" }}>
                        {((selected.bb.upper - selected.bb.lower) / selected.bb.middle * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="ai-analysis">
                    {aiLoading ? (
                      <div className="ai-loading">
                        <span style={{ marginRight: 8, color: "#00c8ff" }}>AI ANALYSIS</span>
                        <div className="ai-dot" /><div className="ai-dot" /><div className="ai-dot" />
                      </div>
                    ) : (
                      <span style={{ color: "#7ab8d4" }}>
                        <span style={{ color: "#00c8ff88" }}>AI › </span>{aiText || "Click a stock for AI analysis."}
                      </span>
                    )}
                  </div>
                </div>

                {/* Trade Panel */}
                <div className="trade-panel">
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, letterSpacing: 3, color: "#00c8ff", marginBottom: 16, textTransform: "uppercase" }}>
                    Execute Paper Trade
                  </div>
                  <div className="trade-input-group">
                    <label>Instrument</label>
                    <div className="trade-input" style={{ cursor: "default" }}>
                      {selected.symbol} · ${selected.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="trade-input-group">
                    <label>Quantity (Shares)</label>
                    <input
                      type="number"
                      className="trade-input"
                      value={orderQty}
                      min={1}
                      onChange={e => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: "#4a7a9b", marginBottom: 4 }}>
                    Order Value: <span style={{ color: "#c8e6ff" }}>${(selected.price * orderQty).toFixed(2)}</span>
                  </div>
                  {portfolio.positions[selected.symbol] && (
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: "#4a7a9b", marginBottom: 4 }}>
                      Holding: <span style={{ color: "#00c8ff" }}>{portfolio.positions[selected.symbol].shares} shares</span> · Avg: ${portfolio.positions[selected.symbol].avgCost.toFixed(2)}
                    </div>
                  )}
                  <div className="trade-buttons">
                    <button className="btn-buy" onClick={handleBuy}>▲ BUY</button>
                    <button className="btn-sell" onClick={handleSell}>▼ SELL</button>
                  </div>
                </div>
              </>
            )}

            {/* Open Positions */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Open Positions</span>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#3a5a7a" }}>
                  {Object.keys(portfolio.positions).length} ACTIVE
                </span>
              </div>
              <div className="positions-list">
                {Object.entries(portfolio.positions).length === 0 ? (
                  <div style={{ padding: "20px 16px", fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: "#3a5a7a" }}>
                    No open positions
                  </div>
                ) : (
                  Object.entries(portfolio.positions).map(([sym, pos]) => {
                    const stock = stocks.find(s => s.symbol === sym);
                    if (!stock) return null;
                    const pnlPos = (stock.price - pos.avgCost) * pos.shares;
                    return (
                      <div key={sym} className="position-row" onClick={() => selectStock(stock)}>
                        <div>
                          <div style={{ color: "#c8e6ff", fontWeight: 700 }}>{sym}</div>
                          <div style={{ fontSize: 10, color: "#3a5a7a" }}>{pos.shares} shares @ ${pos.avgCost.toFixed(2)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: "#c8e6ff" }}>${(stock.price * pos.shares).toFixed(2)}</div>
                          <div style={{ fontSize: 11, color: pnlPos >= 0 ? "#00ff88" : "#ff4466" }}>
                            {pnlPos >= 0 ? "+" : ""}${pnlPos.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="disclaimer">
          ⚠ PAPER TRADING ONLY — All prices are simulated. No real money is involved. Past signal accuracy does not guarantee future performance. This tool is for educational purposes only and does not constitute financial advice. Real stock trading involves substantial risk of loss.
        </div>
      </div>
    </>
  );
}
