export function ComposerStyleIconButton({ ariaLabel, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "6px 8px",
        borderRadius: 8,
        color: "var(--t2)",
        display: "flex",
        alignItems: "center",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg3)";
        e.currentTarget.style.color = "var(--text)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "none";
        e.currentTarget.style.color = "var(--t2)";
      }}
    >
      {children}
    </button>
  );
}
