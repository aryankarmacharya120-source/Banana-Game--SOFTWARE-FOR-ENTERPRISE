export default function Avatar({ seed, size = 40, ring }) {
  return (
    <img
      className={`avatar ${ring ? `ring-${ring}` : ''}`}
      src={`/api/avatar/${encodeURIComponent(seed || 'guest')}`}
      width={size}
      height={size}
      alt=""
      loading="lazy"
    />
  );
}
