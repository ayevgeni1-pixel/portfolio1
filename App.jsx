import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Wallet, BarChart3 } from 'lucide-react';
import './style.css';
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

const portfolio = [
  { symbol: 'NVDA', name: 'Nvidia', qty: 400, avgCost: 118, currency: 'USD', sector: 'AI / Semiconductors', risk: 'High' },
  { symbol: 'AMDL', name: 'GraniteShares 2x AMD', qty: 200, avgCost: 12.5, currency: 'USD', sector: 'Leveraged ETF', risk: 'Very High' },
  { symbol: 'FNGU', name: 'MicroSectors FANG+ 3x', qty: 200, avgCost: 24.5, currency: 'USD', sector: 'Leveraged Big Tech', risk: 'Extreme' },
  { symbol: 'SCHD', name: 'Schwab US Dividend Equity ETF', qty: 100, avgCost: 78, currency: 'USD', sector: 'Dividend ETF', risk: 'Medium' },
  { symbol: 'SOXQ', name: 'Invesco PHLX Semiconductor ETF', qty: 160, avgCost: 42, currency: 'USD', sector: 'Semiconductors ETF', risk: 'High' },
  { symbol: 'KEREN_KASPIT', name: 'Keren Kaspit', qty: 26000, avgCost: 1, currency: 'ILS', sector: 'Cash / Money Market', risk: 'Low' },
];

const mockQuotes = {
  NVDA: { price: 155.25, dayChangePct: 2.35 },
  AMDL: { price: 15.10, dayChangePct: 4.80 },
  FNGU: { price: 25.20, dayChangePct: -1.90 },
  SCHD: { price: 81.70, dayChangePct: 0.35 },
  SOXQ: { price: 46.15, dayChangePct: 1.45 },
  KEREN_KASPIT: { price: 1.00, dayChangePct: 0.02 },
};

const history = [
  { date: 'Mon', value: 151200 },
  { date: 'Tue', value: 152100 },
  { date: 'Wed', value: 150900 },
  { date: 'Thu', value: 154300 },
  { date: 'Fri', value: 156850 },
];

function money(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function pct(value) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function App() {
  const [fxUsdIls] = useState(3.65);

  const rows = useMemo(() => {
    return portfolio.map(p => {
      const q = mockQuotes[p.symbol];
      const valueLocal = p.qty * q.price;
      const valueUsd = p.currency === 'ILS' ? valueLocal / fxUsdIls : valueLocal;
      const costLocal = p.qty * p.avgCost;
      const pnlLocal = valueLocal - costLocal;
      const pnlPct = costLocal === 0 ? 0 : (pnlLocal / costLocal) * 100;
      const dayPnlLocal = valueLocal * (q.dayChangePct / 100);
      const dayPnlUsd = p.currency === 'ILS' ? dayPnlLocal / fxUsdIls : dayPnlLocal;

      return {
        ...p,
        price: q.price,
        dayChangePct: q.dayChangePct,
        valueLocal,
        valueUsd,
        pnlLocal,
        pnlPct,
        dayPnlUsd,
      };
    });
  }, [fxUsdIls]);

  const totalUsd = rows.reduce((s, r) => s + r.valueUsd, 0);
  const dayPnlUsd = rows.reduce((s, r) => s + r.dayPnlUsd, 0);
  const dayPnlPct = (dayPnlUsd / totalUsd) * 100;

  const riskWarnings = rows.filter(r => ['Very High', 'Extreme'].includes(r.risk));
  const biggestPosition = [...rows].sort((a, b) => b.valueUsd - a.valueUsd)[0];
  const allocation = rows.map(r => ({ name: r.symbol, value: Math.round(r.valueUsd) }));

  return (
    <div className="app">
      <header>
        <div>
          <h1>Portfolio Tracker</h1>
          <p>Dashboard for US stocks, ETFs and Israeli cash funds</p>
        </div>
        <div className="fx">USD/ILS: {fxUsdIls}</div>
      </header>

      <section className="cards">
        <Card icon={<Wallet />} title="Total Portfolio" value={money(totalUsd)} />
        <Card
          icon={dayPnlUsd >= 0 ? <TrendingUp /> : <TrendingDown />}
          title="Today"
          value={`${money(dayPnlUsd)} (${pct(dayPnlPct)})`}
          className={dayPnlUsd >= 0 ? 'positive' : 'negative'}
        />
        <Card icon={<BarChart3 />} title="Largest Position" value={`${biggestPosition.symbol} / ${money(biggestPosition.valueUsd)}`} />
        <Card icon={<AlertTriangle />} title="High-Risk Positions" value={`${riskWarnings.length}`} className="warning" />
      </section>

      <section className="grid">
        <div className="panel wide">
          <h2>Portfolio Value</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={history}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(v) => money(v)} />
              <Line type="monotone" dataKey="value" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h2>Allocation</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={allocation} dataKey="value" nameKey="name" outerRadius={95} label />
              {allocation.map((_, i) => <Cell key={i} />)}
              <Tooltip formatter={(v) => money(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <h2>Positions</h2>
        <div className="table">
          <div className="tr head">
            <div>Asset</div>
            <div>Qty</div>
            <div>Price</div>
            <div>Value</div>
            <div>Day</div>
            <div>P/L</div>
            <div>Risk</div>
          </div>
          {rows.map(r => (
            <div className="tr" key={r.symbol}>
              <div>
                <b>{r.symbol}</b>
                <span>{r.name}</span>
              </div>
              <div>{r.qty.toLocaleString()}</div>
              <div>{money(r.price, r.currency)}</div>
              <div>{money(r.valueLocal, r.currency)}</div>
              <div className={r.dayChangePct >= 0 ? 'positiveText' : 'negativeText'}>{pct(r.dayChangePct)}</div>
              <div className={r.pnlLocal >= 0 ? 'positiveText' : 'negativeText'}>
                {money(r.pnlLocal, r.currency)} / {pct(r.pnlPct)}
              </div>
              <div><span className={`risk ${r.risk.replaceAll(' ', '').toLowerCase()}`}>{r.risk}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel ai">
        <h2>Daily AI Brief</h2>
        <p>
          Portfolio is {dayPnlUsd >= 0 ? 'up' : 'down'} today by <b>{money(dayPnlUsd)}</b>.
          Main driver is <b>{biggestPosition.symbol}</b>, which is also the largest concentration risk.
        </p>
        <p>
          Warning: leveraged products such as AMDL and FNGU can distort retirement planning.
          They are suitable only as small tactical positions, not as the core of a retirement portfolio.
        </p>
      </section>
    </div>
  );
}

function Card({ icon, title, value, className = '' }) {
  return (
    <div className={`card ${className}`}>
      <div className="icon">{icon}</div>
      <div>
        <p>{title}</p>
        <h3>{value}</h3>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
