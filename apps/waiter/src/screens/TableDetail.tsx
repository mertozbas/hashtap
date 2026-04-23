import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, Receipt, Users } from 'lucide-react';
import { Card, CardTitle, Button, Badge, useToast, useHaptic } from '@hashtap/ui';
import { DEMO_TABLES, statusLabel, statusTone } from '../lib/tables.js';

export function TableDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const haptic = useHaptic();
  const table = DEMO_TABLES.find((t) => t.id === id);

  if (!table) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-textc-muted">Masa bulunamadı.</p>
        <Button variant="secondary" onClick={() => navigate('/')}>Geri</Button>
      </div>
    );
  }

  async function markNeedsBill() {
    haptic('medium');
    toast.show({ title: `Masa ${table?.label} için hesap istendi`, tone: 'info' });
  }

  async function markServed() {
    haptic('success');
    toast.show({ title: 'Servis edildi', tone: 'success' });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/')}
          aria-label="Geri"
          className="!h-10 !w-10 !p-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Masa {table.label}</h1>
        <Badge tone={statusTone(table.status)}>{statusLabel(table.status)}</Badge>
      </div>

      <Card>
        <CardTitle>Durum</CardTitle>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wide text-textc-muted">Kişi</div>
            <div className="mt-1 flex items-center gap-2 text-lg">
              <Users className="h-4 w-4" />
              {table.guestCount ?? '—'}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-textc-muted">Açılış</div>
            <div className="mt-1 text-lg">{table.openedAt ? new Date(table.openedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link to={`/tables/${table.id}/menu`}>
          <Button size="lg" fullWidth leftIcon={<Plus className="h-5 w-5" />}>
            Sipariş ekle
          </Button>
        </Link>
        <Button size="lg" variant="secondary" leftIcon={<Receipt className="h-5 w-5" />} onClick={markNeedsBill}>
          Hesap
        </Button>
      </div>

      <Button size="md" variant="secondary" onClick={markServed}>
        Servis tamam
      </Button>
    </div>
  );
}
