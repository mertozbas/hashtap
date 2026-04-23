/* KDS, Kitchen Display System
   3 columns: Yeni / Hazırlanıyor / Hazır. Polling simulation + timing colors. */
const { useState, useEffect, useRef } = React;

const SEED_ORDERS = [
  { id: 'TR-2841', table: 7, state: 'kitchen_sent', fired: 30, items: [
    { name: 'Dana Köfte', qty: 2, note: 'az pişmiş' },
    { name: 'Ayran', qty: 2 },
    { name: 'Künefe', qty: 1 },
  ]},
  { id: 'TR-2839', table: 12, state: 'kitchen_sent', fired: 180, items: [
    { name: 'Somon Fileto', qty: 1 },
    { name: 'Mevsim Salata', qty: 1, note: 'sossuz' },
  ]},
  { id: 'TR-2837', table: 3, state: 'preparing', fired: 420, items: [
    { name: 'Tavuk Şiş', qty: 2 },
    { name: 'Humus', qty: 1 },
    { name: 'Türk Kahvesi', qty: 2, note: '1 orta şekerli, 1 sade' },
  ]},
  { id: 'TR-2834', table: 5, state: 'preparing', fired: 780, items: [
    { name: 'Vejetaryen Makarna', qty: 1 },
    { name: 'Portakal Suyu', qty: 1 },
  ]},
  { id: 'TR-2830', table: 9, state: 'preparing', fired: 1320, items: [
    { name: 'Dana Köfte', qty: 3 },
    { name: 'Közlenmiş Patlıcan', qty: 2 },
  ]},
  { id: 'TR-2828', table: 1, state: 'ready', fired: 600, ready: 60, items: [
    { name: 'Tiramisu', qty: 2 },
    { name: 'Türk Kahvesi', qty: 2 },
  ]},
];

function KDS({ embedded = false }) {
  const [orders, setOrders] = useState(SEED_ORDERS);
  const [tick, setTick] = useState(0);
  const [connected, setConnected] = useState(true);
  const newOrderRef = useRef(null);

  // Simulate timing
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const advance = (id) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      if (o.state === 'kitchen_sent') return {...o, state: 'preparing'};
      if (o.state === 'preparing') return {...o, state: 'ready', ready: 0};
      return {...o, state: 'served'};
    }).filter(o => o.state !== 'served'));
  };

  const recall = (id) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      if (o.state === 'ready') return {...o, state: 'preparing'};
      if (o.state === 'preparing') return {...o, state: 'kitchen_sent'};
      return o;
    }));
  };

  const cols = [
    { key: 'kitchen_sent', label: 'Yeni', color: 'var(--info)' },
    { key: 'preparing', label: 'Hazırlanıyor', color: 'var(--warning)' },
    { key: 'ready', label: 'Hazır', color: 'var(--success)' },
  ];

  const sizeStyle = embedded ? { width: 1280, height: 760 } : { width: '100vw', height: '100vh' };

  return (
    <div style={{
      ...sizeStyle,
      background: 'var(--gradient-page)', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', position: 'relative', color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center',
        borderBottom: '1px solid var(--border-subtle)', background: 'rgba(10,14,26,0.6)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{display:'flex', alignItems:'center', gap: 14}}>
          <img src="assets/logo-mark.svg" style={{width: 32, height: 32}}/>
          <div>
            <div style={{fontSize: 20, fontWeight: 700, letterSpacing:'-0.02em'}}>HashTap Mutfak</div>
            <div style={{fontSize: 11, color:'var(--text-muted)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em', marginTop: 2}}>Çırağan Restaurant · Ana mutfak</div>
          </div>
        </div>
        <div style={{display:'flex', gap: 24, alignItems:'center'}}>
          <Stat label="Bugün" value="147" sub="sipariş"/>
          <Stat label="Ort. hazırlık" value="8:42" sub="dk"/>
          <Stat label="Aktif" value={orders.length} sub="masada"/>
          <div style={{display:'flex', alignItems:'center', gap: 8, padding:'8px 14px', borderRadius: 999, background: connected? 'var(--success-bg)':'var(--danger-bg)', color: connected? 'var(--success)':'var(--danger)'}}>
            <span className="pulse-dot"/>
            <span style={{fontSize: 12, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em'}}>Canlı</span>
          </div>
          <div style={{fontSize: 14, color:'var(--text-secondary)', fontFamily:'var(--font-mono)'}}>
            {new Date().toLocaleTimeString('tr', {hour:'2-digit', minute:'2-digit'})}
          </div>
        </div>
      </div>

      {/* 3 columns */}
      <div style={{flex: 1, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 16, padding: 20, overflow:'hidden'}}>
        {cols.map(col => {
          const columnOrders = orders.filter(o => o.state === col.key);
          return (
            <div key={col.key} style={{display:'flex', flexDirection:'column', gap: 12, minHeight: 0}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 4px'}}>
                <div style={{display:'flex', alignItems:'center', gap: 10}}>
                  <div style={{width: 10, height: 10, borderRadius:'50%', background: col.color}}/>
                  <div style={{fontSize: 16, fontWeight: 700, textTransform:'uppercase', letterSpacing:'0.06em'}}>{col.label}</div>
                </div>
                <div style={{fontSize: 18, fontWeight: 700, color:'var(--text-secondary)', fontFamily:'var(--font-mono)'}}>{columnOrders.length}</div>
              </div>
              <div style={{flex: 1, overflowY:'auto', display:'flex', flexDirection:'column', gap: 12, paddingRight: 4}}>
                {columnOrders.map(o => (
                  <OrderCard key={o.id} order={o} tick={tick}
                    onAdvance={() => advance(o.id)} onRecall={() => recall(o.id)} colKey={col.key}/>
                ))}
                {columnOrders.length === 0 && (
                  <div style={{
                    flex: 1, display:'flex', alignItems:'center', justifyContent:'center',
                    minHeight: 200, border:'2px dashed var(--border-subtle)', borderRadius: 20,
                    color:'var(--text-muted)', fontSize: 13,
                  }}>,</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div style={{textAlign:'right'}}>
      <div style={{fontSize: 10, color:'var(--text-muted)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.1em'}}>{label}</div>
      <div style={{fontSize: 20, fontWeight: 700, letterSpacing:'-0.02em', fontFamily:'var(--font-mono)'}}>{value} <span style={{fontSize: 11, color:'var(--text-muted)', fontWeight: 500}}>{sub}</span></div>
    </div>
  );
}

function OrderCard({ order, tick, onAdvance, onRecall, colKey }) {
  const age = (order.fired || 0) + tick;
  const mins = Math.floor(age / 60);
  const secs = age % 60;
  const timeStr = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  const isWarn = mins >= 10 && mins < 20;
  const isDanger = mins >= 20 && colKey !== 'ready';

  const cta = colKey === 'kitchen_sent' ? 'Başla' : colKey === 'preparing' ? 'Hazır' : 'Servis Et';
  const ctaColor = colKey === 'ready' ? 'var(--success)' : 'var(--brand-500)';

  return (
    <div style={{
      background: 'var(--bg-glass)', backdropFilter:'blur(20px)',
      border: `1px solid ${isDanger? 'var(--danger)' : isWarn? 'var(--warning)' : 'var(--border-subtle)'}`,
      borderRadius: 16, padding: 16,
      boxShadow: isDanger ? '0 0 0 2px var(--danger-bg), 0 8px 32px rgba(248,113,113,0.2)' : 'none',
      animation: isDanger ? 'dangerPulse 2s ease-in-out infinite' : 'none',
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 12}}>
        <div>
          <div style={{fontSize: 34, fontWeight: 800, letterSpacing:'-0.03em', lineHeight: 1, display:'flex', alignItems:'baseline', gap: 8}}>
            <span style={{color:'var(--brand-500)'}}>M{order.table}</span>
            <span style={{fontSize: 13, color:'var(--text-muted)', fontFamily:'var(--font-mono)', fontWeight: 500}}>#{order.id}</span>
          </div>
        </div>
        <div style={{
          fontSize: 20, fontWeight: 700, fontFamily:'var(--font-mono)',
          padding: '6px 12px', borderRadius: 10,
          background: isDanger ? 'var(--danger-bg)' : isWarn ? 'var(--warning-bg)' : 'var(--bg-glass-strong)',
          color: isDanger ? 'var(--danger)' : isWarn ? 'var(--warning)' : 'var(--text-secondary)',
        }}>{timeStr}</div>
      </div>

      <div style={{display:'flex', flexDirection:'column', gap: 6, marginBottom: 14}}>
        {order.items.map((it, i) => (
          <div key={i} style={{display:'flex', gap: 10, alignItems:'flex-start', padding: '6px 0', borderBottom: i < order.items.length - 1 ? '1px solid var(--border-subtle)' : 'none'}}>
            <div style={{
              minWidth: 28, height: 28, borderRadius: 8, background:'rgba(255,107,61,0.12)',
              color: 'var(--brand-500)', fontSize: 14, fontWeight: 700,
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0,
            }}>{it.qty}×</div>
            <div style={{flex: 1}}>
              <div style={{fontSize: 15, fontWeight: 600, lineHeight: 1.3}}>{it.name}</div>
              {it.note && <div style={{fontSize: 12, color:'var(--warning)', marginTop: 2, fontStyle:'italic'}}>↳ {it.note}</div>}
            </div>
          </div>
        ))}
      </div>

      <div style={{display:'flex', gap: 8}}>
        {colKey !== 'kitchen_sent' && (
          <button onClick={onRecall} style={{
            width: 44, height: 44, borderRadius: 12, border: '1px solid var(--border-subtle)',
            background: 'var(--bg-glass)', color:'var(--text-secondary)', fontSize: 16, cursor:'pointer',
          }}>↶</button>
        )}
        <button onClick={onAdvance} className="btn btn-primary" style={{
          flex: 1, height: 44, background: ctaColor, boxShadow: `0 6px 16px ${ctaColor === 'var(--success)' ? 'rgba(74,222,128,0.3)' : 'var(--brand-glow)'}`,
        }}>{cta} →</button>
      </div>
      <style>{`
        @keyframes dangerPulse {
          0%,100%{box-shadow: 0 0 0 2px var(--danger-bg), 0 8px 32px rgba(248,113,113,0.2);}
          50%{box-shadow: 0 0 0 4px rgba(248,113,113,0.15), 0 8px 40px rgba(248,113,113,0.35);}
        }
      `}</style>
    </div>
  );
}

window.KDS = KDS;
