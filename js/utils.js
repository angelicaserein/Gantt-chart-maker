export const dayMs = 24 * 60 * 60 * 1000;

export function parseDate(value) {
  const [year, month, date] = value.split("-").map(Number);
  return new Date(year, month - 1, date);
}

export function formatDate(value) {
  const d = parseDate(value);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

export function formatDateToString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function diffDays(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / dayMs);
}

export function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function clampItemsToRange(state) {
  if (parseDate(state.end) < parseDate(state.start)) {
    state.end = state.start;
  }
  state.items.forEach((item) => {
    if (parseDate(item.end) < parseDate(item.start)) {
      item.end = item.start;
    }
  });
}
