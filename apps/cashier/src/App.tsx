import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/AppShell.js';
import { HomeScreen } from './screens/Home.js';
import { OrdersScreen } from './screens/Orders.js';
import { NewOrderScreen } from './screens/NewOrder.js';
import { TablesScreen } from './screens/Tables.js';
import { SettingsScreen } from './screens/Settings.js';

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/orders" element={<OrdersScreen />} />
        <Route path="/orders/new" element={<NewOrderScreen />} />
        <Route path="/tables" element={<TablesScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
