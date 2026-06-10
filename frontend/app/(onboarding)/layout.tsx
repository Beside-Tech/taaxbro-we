/**
 * Layout for the /onboarding route.
 * Renders the scattered purple tile mosaic background from the Figma designs.
 * All tile positions/sizes/opacities are derived from the reference screenshots.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-[#f3eeff]'>

      {/* Purple tile grid — top edge */}
      <TileRow top='0%'    sizes={[88, 64, 92, 72, 80, 88, 68, 90]} />
      {/* Left edge */}
      <TileCol left='0%'   tops={['14%','27%','40%','53%','66%','79%']} sizes={[88, 72, 84, 68, 88, 80]} />
      {/* Right edge */}
      <TileCol left='auto' right='0%' tops={['14%','27%','40%','53%','66%','79%']} sizes={[80, 88, 72, 84, 68, 88]} />
      {/* Bottom edge */}
      <TileRow top='auto' bottom='0%' sizes={[80, 68, 88, 72, 88, 68, 84, 80]} />

      {/* Soft radial glow behind the card */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          background: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(255,255,255,0.55) 0%, transparent 80%)',
        }}
      />

      {/* Content */}
      <div className='relative z-10 w-full'>
        {children}
      </div>
    </div>
  );
}

// ─── Tile helpers ──────────────────────────────────────────────────────────────

const TILE_PALETTE = [
  { bg: '#4c1d95', opacity: 0.85 }, // deep violet
  { bg: '#6d28d9', opacity: 0.70 },
  { bg: '#7c3aed', opacity: 0.55 },
  { bg: '#8b5cf6', opacity: 0.45 },
  { bg: '#a78bfa', opacity: 0.55 },
  { bg: '#c4b5fd', opacity: 0.65 },
  { bg: '#ddd6fe', opacity: 0.80 },
];

function pickColor(i: number) {
  return TILE_PALETTE[i % TILE_PALETTE.length];
}

function TileRow({
  top, bottom, sizes,
}: {
  top?: string; bottom?: string; sizes: number[];
}) {
  const total = sizes.length;
  return (
    <>
      {sizes.map((size, i) => {
        const { bg, opacity } = pickColor((i * 3) % TILE_PALETTE.length);
        const leftPct = (i / total) * 100;
        return (
          <div
            key={i}
            className='absolute rounded-xl pointer-events-none'
            style={{
              width:   size,
              height:  size,
              top,
              bottom,
              left:    `${leftPct}%`,
              background: bg,
              opacity,
            }}
          />
        );
      })}
    </>
  );
}

function TileCol({
  left, right, tops, sizes,
}: {
  left?: string; right?: string; tops: string[]; sizes: number[];
}) {
  return (
    <>
      {tops.map((top, i) => {
        const { bg, opacity } = pickColor((i * 2 + 1) % TILE_PALETTE.length);
        const size = sizes[i] ?? 80;
        return (
          <div
            key={i}
            className='absolute rounded-xl pointer-events-none'
            style={{
              width:  size,
              height: size,
              top,
              left,
              right,
              background: bg,
              opacity,
            }}
          />
        );
      })}
    </>
  );
}