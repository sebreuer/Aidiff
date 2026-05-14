export function parseMarkdown(text) {
  const parts = [];
  let rem = text;
  let key = 0;
  while (rem.length > 0) {
    const m = rem.match(/\*\*(.+?)\*\*/);
    if (m) {
      if (m.index > 0) parts.push(<span key={key++}>{rem.slice(0, m.index)}</span>);
      parts.push(<strong key={key++}>{m[1]}</strong>);
      rem = rem.slice(m.index + m[0].length);
    } else {
      parts.push(<span key={key++}>{rem}</span>);
      break;
    }
  }
  return parts;
}

function boldMarkClass(inner, state) {
  const t = inner.trim();
  if (
    /^(alle\s+antworten|beide\s+antworten|beide|both\s+answers|all\s+three|all\s+answers|gemeinsam(e)?|für\s+alle)\b/i.test(t)
  ) {
    state.slot = null;
    return "aidiff-assessment-mark aidiff-assessment-mark--neutral";
  }
  let m = t.match(/^(Antwort|Answer|Response|Spalte|Column)\s*([123])\b/i);
  if (!m) m = t.match(/^Réponse\s*([123])\b/i);
  if (m) {
    const n = m[2] != null ? Number(m[2]) : Number(m[1]);
    if (n >= 1 && n <= 3) {
      state.slot = n;
      return `aidiff-assessment-mark aidiff-assessment-mark--s${n}`;
    }
  }
  if (state.slot != null) return `aidiff-assessment-mark aidiff-assessment-mark--s${state.slot}`;
  return "aidiff-assessment-mark aidiff-assessment-mark--neutral";
}

function parseAnswerAnchoredMarkdownLine(line, state) {
  const parts = [];
  let rem = line;
  let key = 0;
  while (rem.length > 0) {
    const m = rem.match(/\*\*(.+?)\*\*/);
    if (m) {
      if (m.index > 0) parts.push(<span key={key++}>{rem.slice(0, m.index)}</span>);
      const inner = m[1];
      const cls = boldMarkClass(inner, state);
      parts.push(
        <strong key={key++} className={cls}>
          {inner}
        </strong>
      );
      rem = rem.slice(m.index + m[0].length);
    } else {
      parts.push(<span key={key++}>{rem}</span>);
      break;
    }
  }
  return parts;
}

/**
 * Assessment prose: highlighter colors follow **Antwort n** / **Answer n**; following **traits** use that color until another label or a “shared” bold.
 */
export function renderAssessmentWithAnswerMarks(text) {
  const raw = String(text || "");
  if (!raw) return null;
  const paragraphs = raw.split(/\n\n+/).filter((p) => p.trim().length > 0);
  return paragraphs.map((para, pi) => {
    const state = { slot: null };
    const lines = para.split(/\n/);
    return (
      <span key={pi} style={{ display: "block", marginTop: pi > 0 ? "0.85em" : 0 }}>
        {lines.map((line, li) => (
          <span key={li}>
            {parseAnswerAnchoredMarkdownLine(line, state)}
            {li < lines.length - 1 && <br />}
          </span>
        ))}
      </span>
    );
  });
}

export function renderText(text) {
  return text.split("\n").map((line, i, arr) => (
    <span key={i}>
      {parseMarkdown(line)}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}
