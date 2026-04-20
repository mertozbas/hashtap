import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { OrdersPage } from './pages/OrdersPage';
import { MenuEditorPage } from './pages/MenuEditorPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <div className="shell">
      <aside>
        <h1>HashTap</h1>
        <nav>
          <NavLink to="/orders">Siparişler</NavLink>
          <NavLink to="/menu">Menü</NavLink>
          <NavLink to="/analytics">Analiz</NavLink>
          <NavLink to="/settings">Ayarlar</NavLink>
        </nav>
      </aside>
      <section>
        <Routes>
          <Route path="/" element={<Navigate to="/orders" replace />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/menu" element={<MenuEditorPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </section>
    </div>
  );
}
