export function HeaderWordmark({ dockedInHeader }) {
  return (
    <span
      style={{
        height: 30,
        display: "inline-flex",
        alignItems: "center",
        fontFamily: '"Unbounded", system-ui, sans-serif',
        fontWeight: 700,
        fontSize: 18,
        letterSpacing: "0.01em",
        color: "var(--text)",
        marginLeft: dockedInHeader ? 36 : 0,
        transition: "margin-left 520ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        userSelect: "none",
      }}
    >
      Aidiff
    </span>
  );
}
