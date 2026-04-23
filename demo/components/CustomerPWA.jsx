/* Customer PWA, iPhone frame with menu -> cart -> pay flow */
const { useState, useEffect, useRef } = React;

const MENU = [
  { cat: "Başlangıçlar", items: [
    { id: 1, name: "Humus", price: 85, img: "hum", desc: "Tahin, zeytinyağı, nar ekşisi" },
    { id: 2, name: "Közlenmiş Patlıcan", price: 95, img: "pat", desc: "Sarımsaklı yoğurt, dereotu" },
    { id: 3, name: "Mevsim Salata", price: 110, img: "sal", desc: "Roka, domates, peynir, balzamik" },
  ]},
  { cat: "Ana Yemekler", items: [
    { id: 4, name: "Ev Yapımı Dana Köfte", price: 240, img: "kof", desc: "8 adet, izgara sebze, pilav", popular: true },
    { id: 5, name: "Tavuk Şiş", price: 195, img: "tav", desc: "Marine tavuk, bulgur pilavı" },
    { id: 6, name: "Somon Fileto", price: 320, img: "som", desc: "Limon tereyağı, taze sebze", popular: true },
    { id: 7, name: "Vejetaryen Makarna", price: 165, img: "mak", desc: "Taze sebzeler, parmesan" },
  ]},
  { cat: "Tatlılar", items: [
    { id: 8, name: "Künefe", price: 125, img: "kun", desc: "Antep fıstığı, kaymak" },
    { id: 9, name: "Tiramisu", price: 110, img: "tir", desc: "Ev yapımı, espresso ıslatmalı" },
  ]},
  { cat: "İçecekler", items: [
    { id: 10, name: "Türk Kahvesi", price: 55, img: "kah", desc: "Orta şekerli / sade / şekerli" },
    { id: 11, name: "Taze Portakal Suyu", price: 65, img: "por", desc: "350ml" },
    { id: 12, name: "Ayran", price: 35, img: "ayr", desc: "Ev yapımı" },
  ]},
];

const LANG = {
  tr: { table: "Masa", menu: "Menü", cart: "Sepet", pay: "Öde", total: "Toplam",
        empty: "Sepetiniz boş", add: "Ekle", note: "Not ekle",
        orderPlaced: "Siparişiniz alındı", preparing: "Hazırlanıyor", ready: "Hazır",
        searchPlaceholder: "Menüde ara...", popular: "Popüler" },
  en: { table: "Table", menu: "Menu", cart: "Cart", pay: "Pay", total: "Total",
        empty: "Your cart is empty", add: "Add", note: "Add note",
        orderPlaced: "Order placed", preparing: "Preparing", ready: "Ready",
        searchPlaceholder: "Search menu...", popular: "Popular" },
};

function FoodImage({ seed, small }) {
  // Deterministic subtle gradient placeholder from seed
  const hues = { hum: 35, pat: 280, sal: 120, kof: 20, tav: 40, som: 10, mak: 50,
                 kun: 30, tir: 25, kah: 28, por: 32, ayr: 220 };
  const h = hues[seed] ?? 30;
  const sz = small ? 60 : 120;
  return (
    <div style={{
      width: small ? 64 : '100%', height: sz, flexShrink: 0,
      borderRadius: 14, overflow: 'hidden', position: 'relative',
      background: `linear-gradient(135deg, oklch(0.55 0.12 ${h}) 0%, oklch(0.35 0.08 ${h + 30}) 100%)`,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 8px, transparent 8px 16px)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', fontSize: small ? 10 : 11, color: 'rgba(255,255,255,0.7)',
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>{seed}</div>
    </div>
  );
}

function CustomerPWA({ initialScreen = 'qr', autoPay = false }) {
  const [screen, setScreen] = useState(initialScreen); // qr | menu | cart | payment | status
  const [lang, setLang] = useState('tr');
  const [cart, setCart] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [note, setNote] = useState('');
  const [activeCat, setActiveCat] = useState(MENU[0].cat);
  const [tip, setTip] = useState(10);
  const [orderState, setOrderState] = useState('sent'); // sent | preparing | ready
  const t = LANG[lang];

  // Auto-advance order status demo
  useEffect(() => {
    if (screen !== 'status') return;
    const t1 = setTimeout(() => setOrderState('preparing'), 2500);
    const t2 = setTimeout(() => setOrderState('ready'), 6500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [screen]);

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const tipAmount = Math.round(subtotal * tip / 100);
  const total = subtotal + tipAmount;

  const addToCart = (item, qty = 1, itemNote = '') => {
    setCart(prev => {
      const exist = prev.find(c => c.id === item.id && c.note === itemNote);
      if (exist) return prev.map(c => c === exist ? {...c, qty: c.qty + qty} : c);
      return [...prev, { ...item, qty, note: itemNote }];
    });
  };

  const changeQty = (idx, delta) => {
    setCart(prev => prev.map((c, i) => i === idx ? {...c, qty: c.qty + delta} : c).filter(c => c.qty > 0));
  };

  return (
    <div style={{
      width: 390, height: 780, background: 'var(--gradient-page)', position: 'relative',
      borderRadius: 44, overflow: 'hidden',
      border: '10px solid #1a1a20', boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 0 0 2px #2a2a30',
    }}>
      {/* Dynamic island */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        width: 120, height: 32, background: '#000', borderRadius: 16, zIndex: 100,
      }} />
      {/* Status bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 54, zIndex: 90,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', fontSize: 15, fontWeight: 600, color: 'white',
      }}>
        <span>9:41</span>
        <span style={{display:'flex', gap: 6, alignItems:'center'}}>
          <span style={{fontSize: 12}}>●●●●</span>
          <span style={{fontSize: 11}}>5G</span>
          <span style={{display:'inline-block', width: 24, height: 12, border: '1.5px solid white', borderRadius: 3, position:'relative'}}>
            <span style={{position:'absolute', inset: 1, background:'white', width:'80%', borderRadius:1}}/>
          </span>
        </span>
      </div>

      <div style={{ paddingTop: 54, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {screen === 'qr' && <QRScreen onScan={() => setScreen('menu')} />}
        {screen === 'menu' && (
          <MenuScreen
            t={t} lang={lang} setLang={setLang}
            activeCat={activeCat} setActiveCat={setActiveCat}
            cart={cart} onItemClick={setSelectedItem}
            onCartClick={() => setScreen('cart')}
          />
        )}
        {screen === 'cart' && (
          <CartScreen t={t} cart={cart} changeQty={changeQty}
            subtotal={subtotal} tip={tip} setTip={setTip} tipAmount={tipAmount} total={total}
            onBack={() => setScreen('menu')}
            onCheckout={() => setScreen('payment')} />
        )}
        {screen === 'payment' && (
          <PaymentScreen t={t} total={total} autoPay={autoPay}
            onSuccess={() => { setOrderState('sent'); setScreen('status'); }}
            onBack={() => setScreen('cart')} />
        )}
        {screen === 'status' && (
          <StatusScreen t={t} orderState={orderState} cart={cart} total={total}
            onNewOrder={() => { setCart([]); setScreen('menu'); }} />
        )}
      </div>

      {selectedItem && (
        <ItemSheet item={selectedItem} t={t}
          onClose={() => setSelectedItem(null)}
          onAdd={(qty, n) => { addToCart(selectedItem, qty, n); setSelectedItem(null); }} />
      )}
    </div>
  );
}

function QRScreen({ onScan }) {
  const [scanning, setScanning] = useState(false);
  return (
    <div style={{flex: 1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: 32, gap: 32}}>
      <img src="assets/logo-mark.svg" style={{width: 64, height: 64}} alt="HashTap"/>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em'}}>Masa 7'ye hoş geldiniz</div>
        <div style={{fontSize: 15, color: 'var(--text-secondary)', marginTop: 8}}>Çırağan Restaurant</div>
      </div>
      <div style={{
        width: 220, height: 220, background: 'white', borderRadius: 24, padding: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        <QRPattern />
        {scanning && (
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 3, background: 'var(--brand-500)',
            boxShadow: '0 0 20px var(--brand-500)',
            animation: 'scanLine 1.6s ease-in-out',
          }}/>
        )}
      </div>
      <button className="btn btn-primary btn-lg" style={{width: '100%'}} onClick={() => {
        setScanning(true); setTimeout(onScan, 900);
      }}>QR'ı Okut</button>
      <div style={{fontSize: 12, color: 'var(--text-muted)'}}>Demo için butona dokunun</div>
      <style>{`@keyframes scanLine { 0%{top:20px;opacity:0;} 10%{opacity:1;} 90%{opacity:1;} 100%{top:200px;opacity:0;} }`}</style>
    </div>
  );
}

function QRPattern() {
  // Static QR-like pattern drawn from a seed
  const size = 21;
  const cells = [];
  const seed = 0xA5F3;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const on = ((x * 73 + y * 151 + seed) % 7) < 3 || ((x + y) % 11) === 0;
      if (on) cells.push(<rect key={`${x}-${y}`} x={x*8} y={y*8} width="8" height="8" fill="#0A0E1A"/>);
    }
  }
  // Finder patterns
  const finder = (cx, cy) => [
    <rect key={`f1-${cx}-${cy}`} x={cx} y={cy} width="56" height="56" fill="#0A0E1A"/>,
    <rect key={`f2-${cx}-${cy}`} x={cx+8} y={cy+8} width="40" height="40" fill="white"/>,
    <rect key={`f3-${cx}-${cy}`} x={cx+16} y={cy+16} width="24" height="24" fill="#0A0E1A"/>,
  ];
  return (
    <svg viewBox="0 0 168 168" width="100%" height="100%">
      <rect width="168" height="168" fill="white"/>
      {cells}
      {finder(0, 0)}
      {finder(112, 0)}
      {finder(0, 112)}
      <rect x="70" y="70" width="28" height="28" fill="var(--brand-500)" rx="4"/>
      <text x="84" y="90" textAnchor="middle" fontSize="18" fontWeight="700" fill="white" fontFamily="Inter">#</text>
    </svg>
  );
}

function MenuScreen({ t, lang, setLang, activeCat, setActiveCat, cart, onItemClick, onCartClick }) {
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  return (
    <>
      <div style={{padding: '12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <div style={{fontSize: 11, color: 'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight: 600}}>Çırağan · {t.table} 7</div>
          <div style={{fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em'}}>{t.menu}</div>
        </div>
        <div style={{display:'flex', gap: 6, background:'var(--bg-glass)', padding: 4, borderRadius: 10, border: '1px solid var(--border-subtle)'}}>
          {['tr', 'en'].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              border:0, padding:'6px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor:'pointer',
              background: lang===l? 'var(--brand-500)':'transparent', color: lang===l? 'white':'var(--text-secondary)',
            }}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div style={{padding: '0 20px 12px', display:'flex', gap: 8, overflowX:'auto', scrollbarWidth:'none'}}>
        {MENU.map(c => (
          <button key={c.cat} onClick={() => setActiveCat(c.cat)} style={{
            padding: '10px 16px', borderRadius: 999, border:'1px solid var(--border-subtle)',
            background: activeCat===c.cat? 'var(--brand-500)' : 'var(--bg-glass)',
            color: activeCat===c.cat ? 'white' : 'var(--text-secondary)',
            fontSize: 13, fontWeight: 600, whiteSpace:'nowrap', cursor:'pointer', flexShrink: 0,
            transition: 'all 180ms var(--ease-smooth)',
          }}>{c.cat}</button>
        ))}
      </div>

      <div style={{flex: 1, overflowY:'auto', padding: '0 20px 120px', display:'flex', flexDirection:'column', gap: 12}}>
        {MENU.find(c => c.cat === activeCat)?.items.map(it => (
          <button key={it.id} onClick={() => onItemClick(it)} style={{
            background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius: 18,
            padding: 12, display:'flex', gap: 14, textAlign:'left', cursor:'pointer', color:'inherit',
            fontFamily: 'inherit', transition: 'all 180ms var(--ease-smooth)',
          }}>
            <FoodImage seed={it.img} small />
            <div style={{flex: 1, display:'flex', flexDirection:'column', justifyContent:'space-between', minWidth: 0}}>
              <div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap: 8}}>
                  <div style={{fontSize: 15, fontWeight: 600, lineHeight: 1.2}}>{it.name}</div>
                  {it.popular && <span className="badge badge-brand" style={{fontSize: 9, padding:'2px 8px'}}>★</span>}
                </div>
                <div style={{fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.3}}>{it.desc}</div>
              </div>
              <div style={{fontSize: 16, fontWeight: 700, color: 'var(--brand-500)'}}>{it.price} ₺</div>
            </div>
          </button>
        ))}
      </div>

      {cartCount > 0 && (
        <div style={{position:'absolute', left: 16, right: 16, bottom: 20, zIndex: 50}}>
          <button onClick={onCartClick} className="btn btn-primary" style={{
            width: '100%', height: 64, borderRadius: 18, padding:'0 20px',
            display:'flex', justifyContent:'space-between',
          }}>
            <span style={{display:'flex', alignItems:'center', gap: 10}}>
              <span style={{
                background:'rgba(255,255,255,0.25)', width: 28, height: 28, borderRadius: 10,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize: 14,
              }}>{cartCount}</span>
              <span>{t.cart}</span>
            </span>
            <span style={{fontWeight: 700}}>{cartTotal} ₺</span>
          </button>
        </div>
      )}
    </>
  );
}

function ItemSheet({ item, t, onClose, onAdd }) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  return (
    <div style={{position:'absolute', inset: 0, zIndex: 200}}>
      <div onClick={onClose} style={{position:'absolute', inset: 0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)'}}/>
      <div style={{
        position:'absolute', bottom: 0, left: 0, right: 0,
        background: 'var(--bg-1)', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 20, animation: 'slideUp 300ms var(--ease-snappy)',
        borderTop: '1px solid var(--border-default)',
      }}>
        <div style={{width: 40, height: 4, background:'var(--border-strong)', borderRadius: 2, margin:'0 auto 16px'}}/>
        <FoodImage seed={item.img} />
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginTop: 16, gap: 12}}>
          <div>
            <div style={{fontSize: 22, fontWeight: 700, letterSpacing:'-0.02em'}}>{item.name}</div>
            <div style={{fontSize: 13, color:'var(--text-secondary)', marginTop: 4}}>{item.desc}</div>
          </div>
          <div style={{fontSize: 22, fontWeight: 700, color:'var(--brand-500)', whiteSpace:'nowrap'}}>{item.price} ₺</div>
        </div>
        <textarea value={note} onChange={e => setNote(e.target.value)}
          placeholder="Notunuz (örn. az pişmiş, soğansız)..."
          style={{
            width: '100%', marginTop: 14, minHeight: 60,
            background:'var(--bg-glass)', border:'1px solid var(--border-subtle)',
            borderRadius: 12, padding: 12, color:'var(--text-primary)',
            fontSize: 13, fontFamily:'inherit', resize: 'none',
          }}/>
        <div style={{display:'flex', gap: 12, marginTop: 16, alignItems:'center'}}>
          <div style={{display:'flex', alignItems:'center', gap: 0, background:'var(--bg-glass)', borderRadius: 14, border:'1px solid var(--border-subtle)'}}>
            <button onClick={() => setQty(Math.max(1, qty - 1))} style={{width: 48, height: 48, border: 0, background:'transparent', color:'var(--text-primary)', fontSize: 20, cursor:'pointer'}}>−</button>
            <div style={{width: 36, textAlign:'center', fontSize: 17, fontWeight: 600}}>{qty}</div>
            <button onClick={() => setQty(qty + 1)} style={{width: 48, height: 48, border: 0, background:'transparent', color:'var(--text-primary)', fontSize: 20, cursor:'pointer'}}>+</button>
          </div>
          <button onClick={() => onAdd(qty, note)} className="btn btn-primary btn-md" style={{flex: 1}}>
            {t.add} · {item.price * qty} ₺
          </button>
        </div>
        <style>{`@keyframes slideUp { from{transform:translateY(100%);} to{transform:translateY(0);} }`}</style>
      </div>
    </div>
  );
}

function CartScreen({ t, cart, changeQty, subtotal, tip, setTip, tipAmount, total, onBack, onCheckout }) {
  return (
    <>
      <div style={{padding: '8px 20px', display:'flex', alignItems:'center', gap: 12}}>
        <button onClick={onBack} style={{width: 40, height: 40, borderRadius: 12, background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', color:'var(--text-primary)', fontSize: 16, cursor:'pointer'}}>←</button>
        <div style={{fontSize: 22, fontWeight: 700, letterSpacing:'-0.02em'}}>{t.cart}</div>
      </div>
      <div style={{flex: 1, overflowY:'auto', padding: '12px 20px', display:'flex', flexDirection:'column', gap: 10}}>
        {cart.length === 0 && <div style={{textAlign:'center', color:'var(--text-muted)', padding: 60}}>{t.empty}</div>}
        {cart.map((c, i) => (
          <div key={i} style={{background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius: 16, padding: 12, display:'flex', gap: 12, alignItems:'center'}}>
            <FoodImage seed={c.img} small />
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{fontSize: 14, fontWeight: 600}}>{c.name}</div>
              {c.note && <div style={{fontSize: 11, color:'var(--text-muted)', marginTop: 2}}>"{c.note}"</div>}
              <div style={{fontSize: 13, color:'var(--brand-500)', fontWeight: 600, marginTop: 4}}>{c.price * c.qty} ₺</div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap: 0, background:'var(--bg-0)', borderRadius: 10}}>
              <button onClick={() => changeQty(i, -1)} style={{width: 32, height: 32, border: 0, background:'transparent', color:'var(--text-primary)', cursor:'pointer'}}>−</button>
              <div style={{width: 24, textAlign:'center', fontSize: 14, fontWeight: 600}}>{c.qty}</div>
              <button onClick={() => changeQty(i, 1)} style={{width: 32, height: 32, border: 0, background:'transparent', color:'var(--text-primary)', cursor:'pointer'}}>+</button>
            </div>
          </div>
        ))}
        {cart.length > 0 && (
          <div style={{background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius: 16, padding: 16, marginTop: 8}}>
            <div style={{fontSize: 12, color:'var(--text-muted)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom: 10}}>Bahşiş</div>
            <div style={{display:'flex', gap: 8}}>
              {[0, 5, 10, 15].map(p => (
                <button key={p} onClick={() => setTip(p)} style={{
                  flex: 1, height: 44, borderRadius: 12, border: `1px solid ${tip===p? 'var(--brand-500)':'var(--border-subtle)'}`,
                  background: tip===p? 'rgba(255,107,61,0.12)' : 'transparent',
                  color: tip===p? 'var(--brand-500)' : 'var(--text-secondary)',
                  fontSize: 14, fontWeight: 600, cursor:'pointer',
                }}>{p === 0 ? 'Yok' : `%${p}`}</button>
              ))}
            </div>
          </div>
        )}
      </div>
      {cart.length > 0 && (
        <div style={{padding: 20, borderTop:'1px solid var(--border-subtle)', background:'var(--bg-1)'}}>
          <div style={{display:'flex', justifyContent:'space-between', fontSize: 13, color:'var(--text-secondary)', marginBottom: 4}}>
            <span>Ara toplam</span><span>{subtotal} ₺</span>
          </div>
          {tipAmount > 0 && (
            <div style={{display:'flex', justifyContent:'space-between', fontSize: 13, color:'var(--text-secondary)', marginBottom: 4}}>
              <span>Bahşiş (%{tip})</span><span>{tipAmount} ₺</span>
            </div>
          )}
          <div style={{display:'flex', justifyContent:'space-between', fontSize: 20, fontWeight: 700, marginTop: 10, marginBottom: 14}}>
            <span>{t.total}</span><span>{total} ₺</span>
          </div>
          <button onClick={onCheckout} className="btn btn-primary btn-lg" style={{width:'100%'}}>
            {t.pay} · {total} ₺
          </button>
        </div>
      )}
    </>
  );
}

function PaymentScreen({ t, total, autoPay, onSuccess, onBack }) {
  const [method, setMethod] = useState('apple');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (autoPay) {
      setProcessing(true);
      setTimeout(onSuccess, 1800);
    }
  }, []);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(onSuccess, 2200);
  };

  if (processing) {
    return (
      <div style={{flex: 1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 24, padding: 40}}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          border: '4px solid var(--border-subtle)', borderTopColor: 'var(--brand-500)',
          animation: 'spin 1s linear infinite',
        }}/>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize: 18, fontWeight: 600}}>3DS doğrulanıyor...</div>
          <div style={{fontSize: 13, color:'var(--text-muted)', marginTop: 6}}>iyzico ile güvenli ödeme</div>
        </div>
        <style>{`@keyframes spin {to{transform:rotate(360deg);}}`}</style>
      </div>
    );
  }

  return (
    <>
      <div style={{padding: '8px 20px', display:'flex', alignItems:'center', gap: 12}}>
        <button onClick={onBack} style={{width: 40, height: 40, borderRadius: 12, background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', color:'var(--text-primary)', fontSize: 16, cursor:'pointer'}}>←</button>
        <div style={{fontSize: 22, fontWeight: 700, letterSpacing:'-0.02em'}}>Ödeme</div>
      </div>
      <div style={{flex: 1, padding: 20, display:'flex', flexDirection:'column', gap: 14}}>
        <div style={{background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius: 16, padding: 20, textAlign:'center'}}>
          <div style={{fontSize: 12, color:'var(--text-muted)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em'}}>Ödenecek Tutar</div>
          <div style={{fontSize: 44, fontWeight: 800, letterSpacing:'-0.03em', marginTop: 4}}>{total} <span style={{fontSize: 22, color:'var(--text-secondary)'}}>₺</span></div>
        </div>

        <div style={{fontSize: 12, color:'var(--text-muted)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em', marginTop: 4}}>Yöntem</div>

        <PayMethod active={method==='apple'} onClick={() => setMethod('apple')} icon="🍎" label="Apple Pay" sub="Touch ID ile onayla"/>
        <PayMethod active={method==='google'} onClick={() => setMethod('google')} icon="G" label="Google Pay" sub="•••• 4242"/>
        <PayMethod active={method==='card'} onClick={() => setMethod('card')} icon="💳" label="Kart ile öde" sub="iyzico 3DS"/>

        <div style={{flex: 1}}/>

        <div style={{fontSize: 11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap: 8, padding: '0 8px'}}>
          <span style={{fontSize: 14}}>🔒</span>
          <span>Para doğrudan restoranın hesabına aktarılır · iyzico subMerchant · PCI SAQ-A</span>
        </div>

        <button onClick={handlePay} className="btn btn-primary btn-lg" style={{width:'100%'}}>
          {method === 'apple' ? 'Apple Pay ile Öde' : method === 'google' ? 'Google Pay ile Öde' : 'Ödemeyi Tamamla'} · {total} ₺
        </button>
      </div>
    </>
  );
}

function PayMethod({ active, onClick, icon, label, sub }) {
  return (
    <button onClick={onClick} style={{
      background: active ? 'rgba(255,107,61,0.08)' : 'var(--bg-glass)',
      border: `1px solid ${active? 'var(--brand-500)':'var(--border-subtle)'}`,
      borderRadius: 14, padding: 14, display:'flex', alignItems:'center', gap: 14,
      textAlign:'left', color:'inherit', cursor:'pointer', fontFamily:'inherit',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: active ? 'var(--brand-500)' : 'var(--bg-glass-strong)',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize: 18, fontWeight: 700,
        color: active ? 'white' : 'var(--text-primary)',
      }}>{icon}</div>
      <div style={{flex: 1}}>
        <div style={{fontSize: 15, fontWeight: 600}}>{label}</div>
        <div style={{fontSize: 12, color:'var(--text-muted)', marginTop: 2}}>{sub}</div>
      </div>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        border: `2px solid ${active? 'var(--brand-500)':'var(--border-strong)'}`,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {active && <div style={{width: 10, height: 10, borderRadius:'50%', background:'var(--brand-500)'}}/>}
      </div>
    </button>
  );
}

function StatusScreen({ t, orderState, cart, total, onNewOrder }) {
  const steps = [
    { id: 'sent', label: 'Sipariş alındı', sub: 'Mutfağa düştü', icon: '📋' },
    { id: 'preparing', label: 'Hazırlanıyor', sub: 'Şefler iş başında', icon: '👨‍🍳' },
    { id: 'ready', label: 'Hazır', sub: 'Garsonunuz getiriyor', icon: '✨' },
  ];
  const activeIdx = steps.findIndex(s => s.id === orderState);
  return (
    <div style={{flex: 1, display:'flex', flexDirection:'column', padding: 20, gap: 16}}>
      <div style={{textAlign:'center', padding: '10px 0'}}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap: 8,
          background:'var(--success-bg)', color:'var(--success)',
          padding:'6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
        }}>
          <span className="pulse-dot"/> ÖDEME TAMAMLANDI
        </div>
        <div style={{fontSize: 24, fontWeight: 700, marginTop: 14, letterSpacing:'-0.02em'}}>Afiyet olsun!</div>
        <div style={{fontSize: 13, color:'var(--text-secondary)', marginTop: 4}}>Sipariş no: #TR-2841 · Masa 7</div>
      </div>

      <div style={{background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius: 18, padding: 20}}>
        {steps.map((s, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          const pending = i > activeIdx;
          return (
            <div key={s.id} style={{display:'flex', gap: 14, position:'relative', paddingBottom: i === steps.length - 1 ? 0 : 20}}>
              {i !== steps.length - 1 && (
                <div style={{
                  position:'absolute', left: 19, top: 40, width: 2, height: '100%',
                  background: done ? 'var(--brand-500)' : 'var(--border-subtle)',
                }}/>
              )}
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: (done || active) ? 'var(--brand-500)' : 'var(--bg-glass-strong)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize: 18, flexShrink: 0, zIndex: 1,
                boxShadow: active ? '0 0 0 6px rgba(255,107,61,0.2)' : 'none',
                transition: 'all 400ms var(--ease-snappy)',
              }}>
                {done ? '✓' : s.icon}
              </div>
              <div style={{flex: 1, paddingTop: 4}}>
                <div style={{fontSize: 15, fontWeight: 600, color: pending ? 'var(--text-muted)' : 'var(--text-primary)'}}>{s.label}</div>
                <div style={{fontSize: 12, color:'var(--text-muted)', marginTop: 2}}>{s.sub}</div>
                {active && <div style={{fontSize: 11, color:'var(--brand-500)', fontWeight: 600, marginTop: 4}}>şu an</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius: 16, padding: 14}}>
        <div style={{fontSize: 11, color:'var(--text-muted)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom: 8}}>e-Arşiv Fişi</div>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{fontSize: 13}}>📧 ahmet@ornek.com</div>
          <div className="badge badge-success">Gönderildi</div>
        </div>
      </div>

      <div style={{flex: 1}}/>
      <button onClick={onNewOrder} className="btn btn-secondary btn-md" style={{width:'100%'}}>+ Yeni Sipariş Ekle</button>
    </div>
  );
}

window.CustomerPWA = CustomerPWA;
