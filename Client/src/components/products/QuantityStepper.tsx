import { useEffect, useState } from "react";

const BTN =
  "h-12 w-10 inline-flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-40";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  value?: number;
  onChange?: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const [q, setQ] = useState<number>(value ?? 1);

  useEffect(() => {
    if (typeof value === "number") setQ(value);
  }, [value]);

  function commit(next: number) {
    const v = Math.max(min, Math.min(max, next));
    setQ(v);
    onChange?.(v);
  }

  return (
    <div className="flex h-12 w-32 items-center justify-between bg-[#f6f3ef] ring-1 ring-slate-200">
      <button
        type="button"
        className={BTN}
        onClick={() => commit(q - 1)}
        disabled={q <= min}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path
            d="M6 12h12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div className="min-w-[2ch] text-center text-sm text-slate-800">{q}</div>

      <button
        type="button"
        className={BTN}
        onClick={() => commit(q + 1)}
        disabled={q >= max}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path
            d="M12 6v12M6 12h12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
