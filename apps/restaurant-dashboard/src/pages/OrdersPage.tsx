export function OrdersPage() {
  return (
    <div>
      <h2>Canlı siparişler</h2>
      <p style={{ color: 'var(--hashtap-muted)' }}>
        WebSocket bağlantısı açıldığında masa-masa sipariş akışı burada listelenir.
        Durum (created → paid → sent_to_pos → in_kitchen → ready → served) renk kodlu gösterilir.
      </p>
    </div>
  );
}
