/* Waiter tablet app, 8-10" tablet, portrait
   Floor + active ticket management. */
const { useState } = React;

function WaiterApp() {
  const [view, setView] = useState('tables'); // tables | ticket
  const [selectedTable, setSelectedTable] = useState(null);

  return (
    <div style={{
      width: 480, height: 780, background:'var(--gradient-page)',
      border: '10px solid #1a1a20', borderRadius: 36,
      boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 0 0 2px #2a2a30',
      display:'flex', flexDirection:'column', overflow:'hidden', position:'relative',
      fontFamily:'var(--font-sans)',
    }}>
      <div style={{padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--border-subtle)'}}>
        <div style={{display:'flex', alignItems:'center', gap: 10}}>
          <img src="assets/logo-mark.svg" style={{width: 26, height: 26}}/>
          <div>
            <div style={{fontSize: 15, fontWeight: 700}}>Garson</div>
            <div style={{fontSize: 10, color:'var(--text-muted)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em'}}>Mehmet A. · Vardiya 2</div>
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap: 6, padding:'6px 12px', borderRadius: 999, background:'var(--success-bg)', color:'var(--success)', fontSize: 11, fontWeight: 600}}>
          <span className="pulse-dot"/> CANLI
        </div>
      </div>

      {view === 'tables' ? (
        <TablesView onSelect={(t) => { setSelectedTable(t); setView('ticket'); }}/>
      ) : (
        <TicketView table={selectedTable} onBack={() => setView('tables')}/>
      )}

      {/* Bottom tab */}
      <div style={{display:'flex', borderTop:'1px solid var(--border-subtle)', background:'rgba(10,14,26,0.5)'}}>
        {[['Masalar', '🍽', 'tables'], ['Siparişler', '📋', 'orders'], ['Menü', '📖', 'menu'], ['Profil', '👤', 'profile']].map(([label, icon, id]) => (
          <button key={id} onClick={() => id === 'tables' && setView('tables')} style={{
            flex: 1, padding:'14px 4px', background:'transparent', border: 0,
            color: (id === 'tables' && view === 'tables') ? 'var(--brand-500)' : 'var(--text-muted)',
            display:'flex', flexDirection:'column', alignItems:'center', gap: 4, cursor:'pointer',
          }}>
            <span style={{fontSize: 18}}>{icon}</span>
            <span style={{fontSize: 10, fontWeight: 600}}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TablesView({ onSelect }) {
  const tables = [
    { n: 1, state: 'served', amount: 340 },
    { n: 3, state: 'preparing', amount: 520, alert: true },
    { n: 5, state: 'preparing', amount: 230 },
    { n: 7, state: 'ready', amount: 875, alert: true },
    { n: 9, state: 'preparing', amount: 1340 },
    { n: 11, state: 'served', amount: 180 },
    { n: 12, state: 'ready', amount: 405 },
    { n: 2, state: 'empty' },
    { n: 4, state: 'empty' },
    { n: 6, state: 'empty' },
    { n: 8, state: 'empty' },
    { n: 10, state: 'empty' },
  ];
  const colorMap = {
    empty: { bg: 'var(--bg-glass)', color: 'var(--text-muted)', label: 'Boş' },
    new: { bg: 'rgba(96,165,250,0.12)', color: 'var(--info)', label: 'Yeni' },
    preparing: { bg: 'rgba(251,191,36,0.1)', color: 'var(--warning)', label: 'Hazırlan.' },
    ready: { bg: 'rgba(74,222,128,0.12)', color: 'var(--success)', label: 'Hazır' },
    served: { bg: 'rgba(94,234,212,0.1)', color: 'var(--accent-500)', label: 'Servisde' },
  };
  return (
    <>
      <div style={{padding:'14px 20px', background:'rgba(255,107,61,0.08)', borderBottom:'1px solid rgba(255,107,61,0.2)', display:'flex', alignItems:'center', gap: 10}}>
        <span style={{fontSize: 18}}>🔔</span>
        <div style={{flex: 1, fontSize: 13}}>
          <strong style={{color:'var(--brand-500)'}}>Masa 7</strong> · siparişi hazır, servise geçilebilir
        </div>
      </div>
      <div style={{flex: 1, overflowY:'auto', padding: 16}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 12}}>
          {tables.sort((a,b) => a.n - b.n).map(t => {
            const c = colorMap[t.state];
            return (
              <button key={t.n} onClick={() => t.state !== 'empty' && onSelect(t)} style={{
                background: c.bg, border: `1px solid ${t.state === 'empty' ? 'var(--border-subtle)' : c.color}`,
                borderRadius: 16, padding: 12, cursor:'pointer', color:'inherit', fontFamily:'inherit',
                textAlign:'left', position:'relative', minHeight: 100,
              }}>
                {t.alert && <div style={{position:'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius:'50%', background:'var(--brand-500)', boxShadow:'0 0 8px var(--brand-500)'}}/>}
                <div style={{fontSize: 30, fontWeight: 800, letterSpacing:'-0.03em', lineHeight: 1}}>{t.n}</div>
                <div style={{fontSize: 10, color: c.color, fontWeight: 700, textTransform:'uppercase', letterSpacing:'0.08em', marginTop: 8}}>{c.label}</div>
                {t.amount && <div style={{fontSize: 13, fontWeight: 600, marginTop: 4, fontFamily:'var(--font-mono)'}}>{t.amount} ₺</div>}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function TicketView({ table, onBack }) {
  const items = [
    { name: 'Dana Köfte', qty: 2, note: 'az pişmiş', state: 'ready' },
    { name: 'Somon Fileto', qty: 1, state: 'ready' },
    { name: 'Ayran', qty: 2, state: 'served' },
    { name: 'Künefe', qty: 1, state: 'preparing' },
  ];
  return (
    <div style={{flex: 1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
      <div style={{padding:'14px 20px', display:'flex', alignItems:'center', gap: 12, borderBottom:'1px solid var(--border-subtle)'}}>
        <button onClick={onBack} style={{width: 36, height: 36, borderRadius: 10, background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', color:'var(--text-primary)', fontSize: 14, cursor:'pointer'}}>←</button>
        <div style={{flex: 1}}>
          <div style={{fontSize: 20, fontWeight: 700, letterSpacing:'-0.02em'}}>Masa {table.n}</div>
          <div style={{fontSize: 11, color:'var(--text-muted)'}}>4 kişilik · 18:39'da açıldı · 2 sipariş</div>
        </div>
        <div style={{fontSize: 20, fontWeight: 800, fontFamily:'var(--font-mono)', color:'var(--brand-500)'}}>{table.amount} ₺</div>
      </div>
      <div style={{flex: 1, overflowY:'auto', padding: 16, display:'flex', flexDirection:'column', gap: 10}}>
        {items.map((it, i) => (
          <div key={i} style={{background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius: 14, padding: 14, display:'flex', gap: 12, alignItems:'center'}}>
            <div style={{
              minWidth: 32, height: 32, borderRadius: 10, background:'rgba(255,107,61,0.12)',
              color:'var(--brand-500)', fontSize: 14, fontWeight: 700,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>{it.qty}×</div>
            <div style={{flex: 1}}>
              <div style={{fontSize: 14, fontWeight: 600}}>{it.name}</div>
              {it.note && <div style={{fontSize: 11, color:'var(--warning)', fontStyle:'italic', marginTop: 2}}>↳ {it.note}</div>}
            </div>
            <div className="badge" style={{
              background: it.state === 'ready' ? 'var(--success-bg)' : it.state === 'served' ? 'rgba(94,234,212,0.12)' : 'var(--warning-bg)',
              color: it.state === 'ready' ? 'var(--success)' : it.state === 'served' ? 'var(--accent-500)' : 'var(--warning)',
            }}>{it.state === 'ready' ? 'Hazır' : it.state === 'served' ? 'Servisde' : 'Hazırlan.'}</div>
          </div>
        ))}
      </div>
      <div style={{padding: 16, borderTop:'1px solid var(--border-subtle)', display:'flex', gap: 10}}>
        <button className="btn btn-secondary btn-md" style={{flex: 1}}>+ Sipariş ekle</button>
        <button className="btn btn-primary btn-md" style={{flex: 1}}>Servis edildi ✓</button>
      </div>
    </div>
  );
}

window.WaiterApp = WaiterApp;
