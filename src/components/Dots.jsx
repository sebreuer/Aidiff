export function Dots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "12px 0" }}>
      {[0, 0.2, 0.4].map((d, i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--t3)",
            animation: `kf 1.2s ease-in-out ${d}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
