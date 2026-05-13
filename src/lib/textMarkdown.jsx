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

export function renderText(text) {
  return text.split("\n").map((line, i, arr) => (
    <span key={i}>
      {parseMarkdown(line)}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}
