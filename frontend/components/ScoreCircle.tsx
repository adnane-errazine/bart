interface Props { value: number; max?: number; label?: string; }

export function ScoreCircle({ value, max = 100, label = "BART SCORE" }: Props) {
  const r = 52, cx = 60, cy = 60;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / max) * circumference;
  return (
    <div className="score-circle">
      <svg viewBox="0 0 120 120">
        <circle className="score-circle-track" cx={cx} cy={cy} r={r} />
        <circle className="score-circle-fill" cx={cx} cy={cy} r={r}
          strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="score-circle-inner">
        <div className="score-circle-value">{value}</div>
        <div className="score-circle-max">/ {max}</div>
        <div className="score-circle-label">{label}</div>
      </div>
    </div>
  );
}
