const STYLES = {
  ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  expired: 'bg-red-50 text-red-700 border-red-200',
};

const LABELS = {
  ok: 'Em dia',
  warning: 'Vencendo',
  expired: 'Vencido',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
