import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/AppShell.js';
import { TablesScreen } from './screens/Tables.js';
import { TableDetailScreen } from './screens/TableDetail.js';
import { MenuBrowseScreen } from './screens/MenuBrowse.js';
import { NotificationsScreen } from './screens/Notifications.js';

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<TablesScreen />} />
        <Route path="/tables/:id" element={<TableDetailScreen />} />
        <Route path="/tables/:id/menu" element={<MenuBrowseScreen />} />
        <Route path="/notifications" element={<NotificationsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
