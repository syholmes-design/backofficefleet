"use client";

type Props = {
  label: string;
  count: number;
  onClick?: () => void;
  active?: boolean;
};

export function ActionableCount({ label, count, onClick, active }: Props) {
  if (!onClick) {
    return <span className="bof-drivers-filter-pill">{label}: {count}</span>;
  }
  return (
    <button
      type="button"
      className={`bof-drivers-filter-pill ${active ? "bof-drivers-filter-pill--active" : ""}`}
      onClick={onClick}
    >
      {label}: {count}
    </button>
  );
}

