import { Route, Routes } from 'react-router-dom';
import { MenuPage } from './pages/MenuPage.js';
import { CartPage } from './pages/CartPage.js';
import { CheckoutPage } from './pages/CheckoutPage.js';
import { OrderStatusPage } from './pages/OrderStatusPage.js';

/**
 * Müşteri PWA rota şeması:
 *   /r/:tenantSlug/t/:tableId         → menü
 *   /r/:tenantSlug/t/:tableId/cart    → sepet
 *   /r/:tenantSlug/t/:tableId/pay     → ödeme
 *   /order/:orderId                   → sipariş durumu + e-arşiv
 */
export function App() {
  return (
    <Routes>
      <Route path="/r/:tenantSlug/t/:tableId" element={<MenuPage />} />
      <Route path="/r/:tenantSlug/t/:tableId/cart" element={<CartPage />} />
      <Route path="/r/:tenantSlug/t/:tableId/pay" element={<CheckoutPage />} />
      <Route path="/order/:orderId" element={<OrderStatusPage />} />
      <Route path="*" element={<div>HashTap — QR menü</div>} />
    </Routes>
  );
}
