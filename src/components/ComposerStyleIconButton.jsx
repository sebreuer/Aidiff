export function ComposerStyleIconButton({ ariaLabel, onClick, children }) {
  return (
    <button
      type="button"
      className="aidiff-glass-control"
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      style={{
        padding: "6px 8px",
        display: "flex",
        alignItems: "center",
      }}
    >
      {children}
    </button>
  );
}
