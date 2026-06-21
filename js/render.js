import { state, palette } from "./state.js";
import { dayMs, diffDays, parseDate, formatDate, formatDateToString, escapeHtml } from "./utils.js";

// DOM references — ES modules are deferred, so the DOM is ready when this runs
export const els = {
  rangeStart:   document.querySelector("#rangeStart"),
  rangeEnd:     document.querySelector("#rangeEnd"),
  chartTitle:   document.querySelector("#chartTitle"),
  categoryList: document.querySelector("#categoryList"),
  itemList:     document.querySelector("#itemList"),
  dataBox:      document.querySelector("#dataBox"),
  chartScroll:  document.querySelector("#chartScroll"),
  chart:        document.querySelector("#chart"),
};

// Called from main.js to register callbacks that run after each render
const _postRenderHooks = [];
export function onAfterRender(fn) { _postRenderHooks.push(fn); }

export function updateDataBox() {
  els.dataBox.value = JSON.stringify(state, null, 2);
}

export function renderCategoryEditor() {
  els.categoryList.innerHTML = "";
  state.categories.forEach((cat, i) => {
    const card = document.createElement("div");
    card.className = "edit-card";
    card.innerHTML = `
      <div class="compact-row">
        <label>
          分区名称
          <input data-category="${cat.id}" data-field="name" value="${escapeHtml(cat.name)}">
        </label>
        <button class="danger" type="button" data-remove-category="${cat.id}">删除</button>
      </div>
      <label>
        分区颜色
        <input type="color" data-category="${cat.id}" data-field="color" value="${cat.color || palette[i % palette.length]}">
      </label>
    `;
    els.categoryList.appendChild(card);
  });
}

export function renderItemEditor() {
  els.itemList.innerHTML = "";
  state.items.forEach((item, i) => {
    const card = document.createElement("div");
    card.className = "edit-card";
    card.innerHTML = `
      <div class="compact-row">
        <label>
          条目名称
          <input data-item="${item.id}" data-field="name" value="${escapeHtml(item.name)}">
        </label>
        <button class="danger" type="button" data-remove-item="${item.id}">删除</button>
      </div>
      <div class="item-fields">
        <label class="wide">
          所属分区
          <select data-item="${item.id}" data-field="categoryId">
            ${state.categories.map((cat) => `
              <option value="${cat.id}" ${cat.id === item.categoryId ? "selected" : ""}>${escapeHtml(cat.name)}</option>
            `).join("")}
          </select>
        </label>
        <label>
          开始日期
          <input type="date" data-item="${item.id}" data-field="start" value="${item.start}">
        </label>
        <label>
          结束日期
          <input type="date" data-item="${item.id}" data-field="end" value="${item.end}">
        </label>
        <label>
          小标签
          <input data-item="${item.id}" data-field="tag" value="${escapeHtml(item.tag || "")}">
        </label>
        <label>
          条目颜色
          <input type="color" data-item="${item.id}" data-field="color" value="${item.color || palette[i % palette.length]}">
        </label>
      </div>
    `;
    els.itemList.appendChild(card);
  });
}

function layoutItems(items) {
  const sorted = items.slice().sort((a, b) => parseDate(a.start) - parseDate(b.start));
  const lineEnds = []; // lineEnds[i] = furthest end day on lane i
  const results = [];

  // First pass: honour manually-pinned lanes (item.line != null)
  sorted.filter((it) => it.line != null).forEach((item) => {
    const s = Math.max(0, diffDays(state.start, item.start));
    const e = Math.min(diffDays(state.start, state.end), diffDays(state.start, item.end));
    const span = Math.max(0, e - s);
    const line = item.line;
    while (lineEnds.length <= line) lineEnds.push(-1);
    lineEnds[line] = Math.max(lineEnds[line], e);
    results.push({ item, start: s, span, line });
  });

  // Second pass: auto-place items that have no manual lane
  sorted.filter((it) => it.line == null).forEach((item) => {
    const s = Math.max(0, diffDays(state.start, item.start));
    const e = Math.min(diffDays(state.start, state.end), diffDays(state.start, item.end));
    const span = Math.max(0, e - s);
    let line = lineEnds.findIndex((lastEnd) => s > lastEnd);
    if (line === -1) { line = lineEnds.length; lineEnds.push(e); }
    else { lineEnds[line] = e; }
    results.push({ item, start: s, span, line });
  });

  return results;
}

export function adjustLaneHeights() {
  els.chart.querySelectorAll(".category-row").forEach(row => {
    const bars = Array.from(row.querySelectorAll(".bar"));
    if (!bars.length) return;

    // Measure actual rendered height per lane
    const laneH = new Map();
    bars.forEach(bar => {
      const line = parseInt(bar.style.getPropertyValue("--line")) || 0;
      laneH.set(line, Math.max(laneH.get(line) ?? 0, bar.getBoundingClientRect().height));
    });

    const lineCount = Math.max(...laneH.keys()) + 1;
    const gap = 8;
    const laneTops = new Map();
    let top = gap;
    for (let i = 0; i < lineCount; i++) {
      laneTops.set(i, top);
      top += (laneH.get(i) ?? 36) + gap;
    }

    // Uniform height + corrected top for every bar in each lane
    bars.forEach(bar => {
      const line = parseInt(bar.style.getPropertyValue("--line")) || 0;
      bar.style.top    = `${laneTops.get(line)}px`;
      bar.style.height = `${laneH.get(line)}px`;
    });

    row.style.setProperty("--row-height", `${Math.max(70, top)}px`);
  });
}

export function renderChart() {
  const totalDays = diffDays(state.start, state.end) + 1;
  if (!state.categories.length || totalDays < 1) {
    els.chart.innerHTML = `<div class="empty">请先设置时间范围和分区</div>`;
    return;
  }

  els.chart.style.setProperty("--days", totalDays);

  let weekStart = 0;
  const weeks = [], weekDates = [];
  while (weekStart < totalDays) {
    const col = 2 + weekStart;
    const num = Math.floor(weekStart / 7) + 1;
    const s = new Date(parseDate(state.start).getTime() + weekStart * dayMs);
    const lastDay = Math.min(weekStart + 6, totalDays - 1);
    const e = new Date(parseDate(state.start).getTime() + lastDay * dayMs);
    const weekSpan = lastDay - weekStart + 1;
    weeks.push(`<div class="week" style="grid-column:${col}/span ${weekSpan};">Week${String(num).padStart(2,"0")}</div>`);
    weekDates.push(`<div class="week-date" style="grid-column:${col}/span ${weekSpan};">${formatDate(formatDateToString(s))}-${formatDate(formatDateToString(e))}</div>`);
    weekStart += 7;
  }

  const rows = state.categories.map((cat) => {
    const positioned = layoutItems(state.items.filter((i) => i.categoryId === cat.id));
    const lineCount = positioned.length ? Math.max(...positioned.map(p => p.line)) + 1 : 0;
    const rowHeight = Math.max(70, lineCount * 60 + 14);
    const bars = positioned.map(({ item, start, span, line }) => `
      <div class="bar" data-item-id="${item.id}" data-category-id="${cat.id}"
           style="--start:${start};--span:${span};--line:${line};--bar-color:${item.color || cat.color};">
        <span class="bar-resize-handle left" data-resize="left" aria-hidden="true"></span>
        <div class="bar-main">
          <span class="bar-name">${escapeHtml(item.name)}</span>
          ${item.tag ? `<span class="bar-tag">${escapeHtml(item.tag)}</span>` : ""}
        </div>
        <span class="bar-resize-handle right" data-resize="right" aria-hidden="true"></span>
      </div>
    `).join("");

    return `
      <section class="category-row" data-category-id="${cat.id}" style="--row-height:${rowHeight}px;">
        <div class="category-label" style="background-color:${cat.color};">${escapeHtml(cat.name)}</div>
        <div class="category-body">${bars}</div>
      </section>
    `;
  }).join("");

  els.chart.innerHTML = `
    <div class="timeline">
      <div class="timeline-corner">Timeline</div>
      ${weeks.join("")}${weekDates.join("")}
    </div>
    ${rows}
  `;

  adjustLaneHeights();
}

export function updateBarPosition(bar, item) {
  const start = Math.max(0, diffDays(state.start, item.start));
  const span = Math.max(0, Math.min(diffDays(state.start, state.end), diffDays(state.start, item.end)) - start);
  bar.style.left = `calc(${start} * var(--day-width) + 6px)`;
  bar.style.width = `max(var(--day-width), calc((${span} + 1) * var(--day-width) - 12px))`;
}

export function render() {
  els.rangeStart.value = state.start;
  els.rangeEnd.value   = state.end;
  els.chartTitle.value = state.title;
  renderCategoryEditor();
  renderItemEditor();
  renderChart();
  updateDataBox();
  _postRenderHooks.forEach((fn) => fn());
}
