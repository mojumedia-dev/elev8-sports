export function StarDisplay({ avg, count, size = 'sm' }: { avg: number | null; count: number; size?: 'sm' | 'md' }) {
  const stars = avg ? Math.round(avg) : 0;
  const full = '★'.repeat(stars);
  const empty = '☆'.repeat(5 - stars);
  const textSize = size === 'md' ? 'text-base' : 'text-sm';
  if (count === 0) return <span className={`text-gray-400 ${textSize}`}>No reviews yet</span>;
  return (
    <span className={`${textSize} text-amber-500`}>
      {full}<span className="text-gray-300">{empty}</span>
      <span className="text-gray-500 ml-1">{avg?.toFixed(1)} ({count})</span>
    </span>
  );
}

export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={`text-2xl transition ${n <= value ? 'text-amber-500' : 'text-gray-300 hover:text-amber-300'}`}>
          ★
        </button>
      ))}
    </div>
  );
}
