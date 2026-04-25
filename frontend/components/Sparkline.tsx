interface Props { values: number[]; width?: number; height?: number; direction?: "up" | "down"; }

export function Sparkline({ values, width = 80, height = 24, direction }: Props) {
  if (!values.length) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const d = values.map((v, i) =>
    `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)},${(height - ((v - min) / range) * height).toFixed(2)}`
  ).join(" ");
  const dir = direction ?? (values[values.length - 1] > values[0] ? "up" : "down");
  return (
    <svg className="index-card-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path className={`spark-line ${dir}`} d={d} />
    </svg>
  );
}
