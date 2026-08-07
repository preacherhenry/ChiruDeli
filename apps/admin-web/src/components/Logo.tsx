import { brandMark } from '@chirudeli/design-tokens';

export function Logo({ size = 32, badge }: { size?: number; badge?: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox={brandMark.viewBox}>
        <circle cx={brandMark.circle.cx} cy={brandMark.circle.cy} r={brandMark.circle.r} fill="#0E6E4E" />
        {brandMark.chevrons.map((c) => (
          <polygon key={c.points} points={c.points} fill="#FFFFFF" opacity={c.opacity} />
        ))}
      </svg>
      <span className="font-heading text-xl font-extrabold text-neutral-900" style={{ fontSize: size * 0.5 }}>
        Chiru<span className="text-secondary-500">Deli</span>
      </span>
      {badge ? (
        <span className="rounded-pill bg-neutral-900 px-2 py-0.5 text-xs font-semibold text-white">{badge}</span>
      ) : null}
    </div>
  );
}
