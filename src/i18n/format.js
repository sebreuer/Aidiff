/** Dot path, e.g. `tabs.results`. */
export function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((o, k) => (o != null ? o[k] : undefined), obj);
}

/** Replace `{name}` tokens (missing keys stay literal). */
export function interpolate(template, vars = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : `{${k}}`
  );
}
