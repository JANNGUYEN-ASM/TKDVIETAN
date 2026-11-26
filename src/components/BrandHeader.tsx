import { useStore } from '../store'

export function BrandHeader({ subtitle }: { subtitle: string }) {
  const { state, syncLabel, setRole } = useStore()
  const isAn = state.role === 'an'

  return (
    <header className="brand-bar">
      <div className="brand-row">
        <img
          className="brand-logo"
          src="/logo-viet-an.png"
          alt="Logo CLB TAEKWONDO VIỆT AN"
          width={56}
          height={56}
        />
        <div className="brand-text">
          <h1>
            CLB TAEKWONDO <span className="brand-gold">VIỆT AN</span>
          </h1>
          <p className="subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="brand-meta">
        <span className="chip chip-soft">{isAn ? 'An · Chủ CLB' : 'HLV · Điểm danh'}</span>
        <button
          type="button"
          className="chip chip-soft"
          style={{ border: '1px solid rgba(255,255,255,0.25)', background: 'transparent' }}
          onClick={() => setRole(isAn ? 'hlv' : 'an')}
        >
          Đổi: {isAn ? 'HLV' : 'An'}
        </button>
        <span className="sample-tag" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
          {syncLabel}
        </span>
      </div>
    </header>
  )
}
