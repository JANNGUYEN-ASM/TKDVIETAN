import { beltBaseColor, beltStripeCount } from '../lib/belt'
import type { BeltRank } from '../types'

export function BeltBadge({ belt }: { belt: BeltRank }) {
  const color = beltBaseColor(belt)
  const stripes = beltStripeCount(belt)
  const isPoom = color === 'poom'

  return (
    <div className="belt-badge" title={belt}>
      <div
        className="belt-icon"
        style={
          isPoom
            ? {
                background: 'linear-gradient(180deg, #C8102E 0 50%, #111 50% 100%)',
              }
            : { background: color }
        }
      >
        {Array.from({ length: stripes }).map((_, i) => (
          <span
            key={i}
            className="stripe"
            style={{ right: 6 + i * 6, background: color === '#F5F5F5' ? '#1E5AA8' : '#111' }}
          />
        ))}
      </div>
      <span style={{ color: '#111' }}>{belt}</span>
    </div>
  )
}
