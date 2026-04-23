/* Cashier / Restaurant dashboard, Odoo backend görünümü, yönetim paneli
   Masaplanı + aktif siparişler + gün sonu özet */
const { useState, useEffect } = React;

const TABLES_INIT = [
  { n: 1, state: 'served', seats: 4, amount: 340, time: 12 },
  { n: 2, state: 'empty', seats: 2 },
  { n: 3, state: 'preparing', seats: 4, amount: 520, time: 8 },
  { n: 4, state: 'empty', seats: 6 },
  { n: 5, state: 'preparing', seats: 2, amount: 230, time: 14 },
  { n: 6, state: 'empty', seats: 4 },
  { n: 7, state: 'new', seats: 4, amount: 875, time: 2 },
  { n: 8, state: 'empty', seats: 2 },
  { n: 9, state: 'preparing', seats: 8, amount: 1340, time: 22 },
  { n: 10, state: 'empty', seats: 4 },
  { n: 11, state: 'served', seats: 2, amount: 180, time: 35 },
  { n: 12, state: 'new', seats: 4, amount: 405, time: 3 },
];

const STATE_MAP = {
  empty: { label: 'Boş', color: 'var(--text-muted)', bg: 'var(--bg-glass)' },
  new: { label: 'Yeni', color: 'var(--info)', bg: 'rgba(96,165,250,0.12)' },
  preparing: { label: 'Hazırlanıyor', color: 'var(--warning)', bg: 'rgba(251,191,36,0.1)' },
  served: { label: 'Servis edildi', color: 'var(--success)', bg: 'rgba(74,222,128,0.1)' },
};

function CashierPanel({ width = 1440, height = 900 }) {
  const [tables, setTables] = useState(TABLES_INIT);
  const [tab, setTab] = useState('floor');

  const occupied = tables.filter(t => t.state !== 'empty').length;
  const revenue = tables.reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div style={{
      width, height, background:'var(--gradient-page)',
      display:'flex', color:'var(--text-primary)', fontFamily:'var(--font-sans)',
      overflow:'hidden', borderRadius: 16,
    }}>
      {/* Sidebar */}
      <div style={{
        width: 240, borderRight:'1px solid var(--border-subtle)',
        background:'rgba(10,14,26,0.5)', backdropFilter:'blur(20px)',
        padding: 20, display:'flex', flexDirection:'column', gap: 16,
      }}>
        <div style={{display:'flex', alignItems:'center', gap: 10, padding:'4px 0 16px'}}>
          <img src="assets/logo-mark.svg" style={{width: 28, height: 28}}/>
          <div>
            <div style={{fontSize: 15, fontWeight: 700}}>HashTap</div>
            <div style={{fontSize: 10, color:'var(--text-muted)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.1em'}}>Yönetim Paneli</div>
          </div>
        </div>
        {[
          {id:'floor', icon:'🍽', label:'Masa Planı'},
          {id:'orders', icon:'📋', label:'Siparişler', badge: 4},
          {id:'menu', icon:'📖', label:'Menü'},
          {id:'reports', icon:'📊', label:'Raporlar'},
          {id:'settings', icon:'⚙️', label:'Ayarlar'},
        ].map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{
            display:'flex', alignItems:'center', gap: 12, padding:'12px 14px', borderRadius: 12,
            background: tab === n.id ? 'rgba(255,107,61,0.12)' : 'transparent',
            border: 0, color: tab === n.id ? 'var(--brand-500)' : 'var(--text-secondary)',
            fontSize: 14, fontWeight: 600, cursor:'pointer', textAlign:'left',
            fontFamily:'inherit', transition: 'all 180ms',
          }}>
            <span style={{fontSize: 16}}>{n.icon}</span>
            <span style={{flex: 1}}>{n.label}</span>
            {n.badge && <span style={{
              background: 'var(--brand-500)', color:'white', fontSize: 10, fontWeight: 700,
              padding:'2px 7px', borderRadius: 999,
            }}>{n.badge}</span>}
          </button>
        ))}
        <div style={{flex: 1}}/>
        <div style={{padding: 14, background:'var(--bg-glass)', borderRadius: 12, border:'1px solid var(--border-subtle)'}}>
          <div style={{fontSize: 10, color:'var(--text-muted)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em'}}>Canlı bağlantı</div>
          <div style={{display:'flex', alignItems:'center', gap: 8, marginTop: 6, color: 'var(--success)', fontSize: 12, fontWeight: 600}}>
            <span className="pulse-dot"/> Online · 3sn
          </div>
          <div style={{fontSize: 11, color:'var(--text-muted)', marginTop: 8}}>iyzico · e-Arşiv · KDS hepsi aktif</div>
        </div>
      </div>

      {/* Main */}
      <div style={{flex: 1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
        <div style={{
          padding: '20px 28px', display:'flex', justifyContent:'space-between', alignItems:'center',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div>
            <div style={{fontSize: 26, fontWeight: 700, letterSpacing:'-0.02em'}}>
              {tab === 'floor' ? 'Masa Planı' : tab === 'orders' ? 'Siparişler' : tab === 'menu' ? 'Menü' : tab === 'reports' ? 'Raporlar' : 'Ayarlar'}
            </div>
            <div style={{fontSize: 13, color:'var(--text-secondary)', marginTop: 2}}>Çırağan Restaurant · Salon · Çarşamba, 18:42</div>
          </div>
          <div style={{display:'flex', gap: 12}}>
            <button className="btn btn-secondary btn-sm">+ Yeni sipariş</button>
            <button className="btn btn-primary btn-sm">Gün sonu raporu</button>
          </div>
        </div>

        {tab === 'floor' && <FloorView tables={tables} setTables={setTables} occupied={occupied} revenue={revenue}/>}
        {tab === 'orders' && <OrdersView/>}
        {tab === 'menu' && <MenuView/>}
        {tab === 'reports' && <ReportsView/>}
        {tab === 'settings' && <SettingsView/>}
      </div>
    </div>
  );
}

function FloorView({ tables, occupied, revenue }) {
  return (
    <div style={{flex: 1, padding: 28, overflowY:'auto'}}>
      {/* Stats bento */}
      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap: 16, marginBottom: 24}}>
        <BentoCard>
          <div style={{fontSize: 11, color:'var(--text-muted)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em'}}>Günlük ciro</div>
          <div style={{fontSize: 40, fontWeight: 800, letterSpacing:'-0.03em', marginTop: 4, fontFamily:'var(--font-mono)'}}>
            {revenue.toLocaleString('tr')} <span style={{fontSize: 20, color:'var(--text-secondary)'}}>₺</span>
          </div>
          <div style={{fontSize: 12, color:'var(--success)', fontWeight: 600, marginTop: 4, display:'flex', alignItems:'center', gap: 4}}>
            ↗ %18 dünden yüksek · hedef %75
          </div>
          <div style={{marginTop: 14, height: 6, background:'var(--bg-glass-strong)', borderRadius: 999, overflow:'hidden'}}>
            <div style={{width:'75%', height:'100%', background:'linear-gradient(90deg, var(--brand-500), var(--brand-400))', borderRadius: 999}}/>
          </div>
        </BentoCard>
        <BentoCard>
          <div style={{fontSize: 11, color:'var(--text-muted)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em'}}>Dolu masa</div>
          <div style={{fontSize: 40, fontWeight: 800, marginTop: 4, fontFamily:'var(--font-mono)'}}>{occupied}<span style={{fontSize: 20, color:'var(--text-secondary)'}}>/{tables.length}</span></div>
          <div style={{fontSize: 12, color:'var(--text-secondary)', marginTop: 8}}>%{Math.round(occupied/tables.length*100)} doluluk</div>
        </BentoCard>
        <BentoCard>
          <div style={{fontSize: 11, color:'var(--text-muted)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em'}}>Masa devri</div>
          <div style={{fontSize: 40, fontWeight: 800, marginTop: 4, fontFamily:'var(--font-mono)'}}>3.4<span style={{fontSize: 20, color:'var(--text-secondary)'}}>×</span></div>
          <div style={{fontSize: 12, color:'var(--success)', marginTop: 8}}>↗ %22 HashTap öncesine göre</div>
        </BentoCard>
        <BentoCard>
          <div style={{fontSize: 11, color:'var(--text-muted)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em'}}>Ort. sepet</div>
          <div style={{fontSize: 40, fontWeight: 800, marginTop: 4, fontFamily:'var(--font-mono)'}}>₺ 287</div>
          <div style={{fontSize: 12, color:'var(--text-secondary)', marginTop: 8}}>EN menüde ₺ 340</div>
        </BentoCard>
      </div>

      <div style={{fontSize: 14, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-secondary)', marginBottom: 14}}>Salon</div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 16}}>
        {tables.map(t => {
          const s = STATE_MAP[t.state];
          return (
            <div key={t.n} style={{
              background: t.state === 'empty' ? 'var(--bg-glass)' : s.bg,
              border: `1px solid ${t.state === 'empty' ? 'var(--border-subtle)' : s.color}`,
              borderRadius: 20, padding: 20, cursor:'pointer',
              transition: 'all 200ms var(--ease-smooth)',
              minHeight: 140,
            }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div>
                  <div style={{fontSize: 11, color:'var(--text-muted)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em'}}>Masa</div>
                  <div style={{fontSize: 36, fontWeight: 800, letterSpacing:'-0.03em', lineHeight: 1}}>{t.n}</div>
                </div>
                <div style={{
                  padding:'4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                  background: t.state === 'empty' ? 'var(--bg-glass-strong)' : 'rgba(0,0,0,0.2)',
                  color: s.color, textTransform:'uppercase', letterSpacing:'0.08em',
                }}>{s.label}</div>
              </div>
              <div style={{fontSize: 11, color:'var(--text-muted)', marginTop: 10}}>{t.seats} kişilik</div>
              {t.state !== 'empty' && (
                <div style={{marginTop: 10, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div style={{fontSize: 17, fontWeight: 700, color: s.color, fontFamily:'var(--font-mono)'}}>{t.amount} ₺</div>
                  <div style={{fontSize: 11, color:'var(--text-muted)', fontFamily:'var(--font-mono)'}}>{t.time}dk</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BentoCard({ children }) {
  return (
    <div style={{
      background:'var(--bg-glass)', border:'1px solid var(--border-subtle)',
      borderRadius: 20, padding: 20, backdropFilter:'blur(20px)',
    }}>{children}</div>
  );
}

function OrdersView() {
  const orders = [
    { id: 'TR-2841', table: 7, time: '18:39', items: 3, total: 875, state: 'new', payment: 'Apple Pay' },
    { id: 'TR-2840', table: 12, time: '18:37', items: 2, total: 405, state: 'new', payment: 'Kart' },
    { id: 'TR-2839', table: 3, time: '18:30', items: 5, total: 520, state: 'preparing', payment: 'Google Pay' },
    { id: 'TR-2838', table: 5, time: '18:28', items: 2, total: 230, state: 'preparing', payment: 'Kart' },
    { id: 'TR-2837', table: 9, time: '18:22', items: 6, total: 1340, state: 'preparing', payment: 'Kart' },
    { id: 'TR-2836', table: 1, time: '18:12', items: 4, total: 340, state: 'served', payment: 'Apple Pay' },
    { id: 'TR-2835', table: 11, time: '18:07', items: 2, total: 180, state: 'served', payment: 'Nakit' },
  ];
  return (
    <div style={{flex: 1, padding: 28, overflowY:'auto'}}>
      <div style={{background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius: 20, overflow:'hidden'}}>
        <div style={{display:'grid', gridTemplateColumns:'120px 80px 90px 1fr 120px 120px 140px 80px', padding:'14px 20px', borderBottom:'1px solid var(--border-subtle)', fontSize: 11, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)'}}>
          <div>Sipariş</div><div>Masa</div><div>Saat</div><div>Kalem</div><div>Tutar</div><div>Ödeme</div><div>Durum</div><div></div>
        </div>
        {orders.map(o => {
          const s = STATE_MAP[o.state];
          return (
            <div key={o.id} style={{display:'grid', gridTemplateColumns:'120px 80px 90px 1fr 120px 120px 140px 80px', padding:'16px 20px', borderBottom:'1px solid var(--border-subtle)', fontSize: 14, alignItems:'center'}}>
              <div style={{fontFamily:'var(--font-mono)', fontWeight: 600}}>#{o.id}</div>
              <div style={{fontSize: 18, fontWeight: 700, color:'var(--brand-500)'}}>M{o.table}</div>
              <div style={{fontFamily:'var(--font-mono)', color:'var(--text-secondary)'}}>{o.time}</div>
              <div style={{color:'var(--text-secondary)'}}>{o.items} kalem</div>
              <div style={{fontFamily:'var(--font-mono)', fontWeight: 700}}>{o.total} ₺</div>
              <div style={{color:'var(--text-secondary)', fontSize: 13}}>{o.payment}</div>
              <div><span className="badge" style={{background: s.bg, color: s.color}}>{s.label}</span></div>
              <div style={{textAlign:'right'}}><span style={{color:'var(--text-muted)'}}>⋯</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MenuView() {
  const cats = [
    { name: 'Başlangıçlar', items: 8, active: 8 },
    { name: 'Ana Yemekler', items: 14, active: 13 },
    { name: 'Tatlılar', items: 6, active: 6 },
    { name: 'İçecekler', items: 22, active: 20 },
    { name: 'Kahvaltı', items: 12, active: 0, note: 'Saat dışı' },
  ];
  return (
    <div style={{flex: 1, padding: 28, overflowY:'auto'}}>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 16}}>
        {cats.map(c => (
          <div key={c.name} style={{background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius: 20, padding: 20}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
              <div style={{fontSize: 18, fontWeight: 700}}>{c.name}</div>
              <div style={{fontSize: 11, color: c.active === 0 ? 'var(--warning)' : 'var(--success)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em'}}>
                {c.active === 0 ? c.note : 'Aktif'}
              </div>
            </div>
            <div style={{fontSize: 36, fontWeight: 800, marginTop: 10, fontFamily:'var(--font-mono)'}}>{c.active}<span style={{fontSize: 18, color:'var(--text-muted)'}}> / {c.items}</span></div>
            <div style={{fontSize: 12, color:'var(--text-muted)', marginTop: 4}}>TR + EN içerik tam</div>
            <div style={{marginTop: 16, display:'flex', gap: 8}}>
              <button className="btn btn-secondary btn-sm" style={{flex: 1}}>Düzenle</button>
              <button className="btn btn-secondary btn-sm" style={{flex: 1}}>QR bas</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsView() {
  const hours = [12,13,14,15,16,17,18,19,20,21,22];
  const data = [12, 28, 45, 30, 18, 22, 55, 78, 92, 68, 42];
  const max = Math.max(...data);
  return (
    <div style={{flex: 1, padding: 28, overflowY:'auto', display:'flex', flexDirection:'column', gap: 20}}>
      <div style={{background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius: 20, padding: 24}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 24}}>
          <div>
            <div style={{fontSize: 11, color:'var(--text-muted)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em'}}>Saatlik sipariş</div>
            <div style={{fontSize: 28, fontWeight: 700, marginTop: 4}}>Bugün</div>
          </div>
          <div style={{display:'flex', gap: 8}}>
            {['Gün', 'Hafta', 'Ay'].map((p, i) => (
              <button key={p} style={{padding:'8px 14px', borderRadius: 10, border:'1px solid var(--border-subtle)', background: i===0?'var(--brand-500)':'transparent', color: i===0?'white':'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor:'pointer'}}>{p}</button>
            ))}
          </div>
        </div>
        <div style={{display:'flex', alignItems:'flex-end', gap: 12, height: 200}}>
          {data.map((v, i) => (
            <div key={i} style={{flex: 1, display:'flex', flexDirection:'column', alignItems:'center', gap: 8}}>
              <div style={{flex: 1, width:'100%', display:'flex', alignItems:'flex-end'}}>
                <div style={{
                  width:'100%', height: `${v/max*100}%`, borderRadius: '8px 8px 2px 2px',
                  background: i === 8 ? 'linear-gradient(180deg, var(--brand-500), var(--brand-600))' : 'var(--bg-glass-strong)',
                  border: `1px solid ${i === 8 ? 'var(--brand-400)' : 'var(--border-subtle)'}`,
                  transition: 'all 240ms',
                }}/>
              </div>
              <div style={{fontSize: 11, color:'var(--text-muted)', fontFamily:'var(--font-mono)'}}>{hours[i]}:00</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16}}>
        <BentoCard>
          <div style={{fontSize: 11, color:'var(--text-muted)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em'}}>En çok satan</div>
          <div style={{marginTop: 14, display:'flex', flexDirection:'column', gap: 10}}>
            {[['Dana Köfte', 42], ['Somon Fileto', 28], ['Künefe', 24], ['Türk Kahvesi', 19], ['Tavuk Şiş', 15]].map(([name, count], i) => (
              <div key={name} style={{display:'flex', alignItems:'center', gap: 12}}>
                <div style={{fontSize: 12, fontWeight: 700, color:'var(--text-muted)', width: 20, fontFamily:'var(--font-mono)'}}>{i+1}</div>
                <div style={{flex: 1, fontSize: 14, fontWeight: 600}}>{name}</div>
                <div style={{flex: 2, height: 6, background:'var(--bg-glass-strong)', borderRadius: 999, overflow:'hidden'}}>
                  <div style={{width: `${count/42*100}%`, height:'100%', background:'var(--brand-500)', borderRadius: 999}}/>
                </div>
                <div style={{fontSize: 14, fontWeight: 700, fontFamily:'var(--font-mono)', width: 30, textAlign:'right'}}>{count}</div>
              </div>
            ))}
          </div>
        </BentoCard>
        <BentoCard>
          <div style={{fontSize: 11, color:'var(--text-muted)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em'}}>Ödeme yöntemi</div>
          <div style={{marginTop: 14, display:'flex', flexDirection:'column', gap: 12}}>
            {[['Apple Pay', 42, 'var(--brand-500)'], ['Kart (3DS)', 35, 'var(--info)'], ['Google Pay', 18, 'var(--accent-500)'], ['Nakit', 5, 'var(--text-muted)']].map(([name, pct, color]) => (
              <div key={name}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize: 13, marginBottom: 4}}>
                  <span style={{fontWeight: 600}}>{name}</span>
                  <span style={{fontFamily:'var(--font-mono)', color:'var(--text-secondary)'}}>%{pct}</span>
                </div>
                <div style={{height: 8, background:'var(--bg-glass-strong)', borderRadius: 999, overflow:'hidden'}}>
                  <div style={{width: `${pct}%`, height:'100%', background: color, borderRadius: 999}}/>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div style={{flex: 1, padding: 28, overflowY:'auto', display:'flex', flexDirection:'column', gap: 16}}>
      {[
        { title: 'iyzico subMerchant', sub: 'ST1234567 · Aktif · Para doğrudan restoran hesabına', status: 'ok' },
        { title: 'e-Arşiv (Foriba)', sub: 'Son 24 saat: 147/147 başarılı · fail-close politikası aktif', status: 'ok' },
        { title: 'Print-bridge', sub: 'RPi-kitchen-01 · Star TSP100 · son sinyal: 2 sn önce', status: 'ok' },
        { title: 'KDS · Ana mutfak', sub: 'kitchen@restoran.local · WebSocket · canlı', status: 'ok' },
        { title: 'Yedekleme', sub: 'B2 EU-Central · şifreli · son yedek: bu gece 04:00', status: 'ok' },
        { title: 'Uzaktan destek', sub: 'Tailscale · HashTap destek ekibi erişimi açık', status: 'warn' },
      ].map(s => (
        <div key={s.title} style={{background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius: 16, padding: 18, display:'flex', alignItems:'center', gap: 16}}>
          <div style={{
            width: 12, height: 12, borderRadius:'50%',
            background: s.status === 'ok' ? 'var(--success)' : 'var(--warning)',
            boxShadow: s.status === 'ok' ? '0 0 8px var(--success)' : '0 0 8px var(--warning)',
          }}/>
          <div style={{flex: 1}}>
            <div style={{fontSize: 15, fontWeight: 600}}>{s.title}</div>
            <div style={{fontSize: 12, color:'var(--text-muted)', marginTop: 2, fontFamily:'var(--font-mono)'}}>{s.sub}</div>
          </div>
          <button className="btn btn-secondary btn-sm">Ayarlar</button>
        </div>
      ))}
    </div>
  );
}

window.CashierPanel = CashierPanel;
