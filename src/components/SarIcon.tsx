export default function SarIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={className}
      style={{
        fontFamily: 'SaudiRiyalSymbol, sans-serif',
        fontSize: size,
        lineHeight: 1,
        fontWeight: 'bold',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="ريال سعودي"
    >
      {'\uF0EA'}
    </span>
  );
}
