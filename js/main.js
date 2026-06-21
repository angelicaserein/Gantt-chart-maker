import { state, palette } from "./state.js";
import { uid, clampItemsToRange } from "./utils.js";
import { els, render, onAfterRender, renderChart, updateDataBox, adjustLaneHeights } from "./render.js";
import { attachBarInteractions } from "./drag.js";

// Re-attach bar drag/click listeners after every render
onAfterRender(attachBarInteractions);

// ── Input changes (live update) ────────────────────────────────────────────

document.addEventListener("input", (event) => {
  if (event.target.id === "dayWidthSlider") {
    const v = event.target.value;
    document.getElementById("dayWidthValue").textContent = `${v}px/天`;
    els.chart.style.setProperty("--day-width", v + "px");
    adjustLaneHeights();
    return;
  }

  const { category: catId, item: itemId, field } = event.target.dataset;

  if (event.target === els.rangeStart || event.target === els.rangeEnd || event.target === els.chartTitle) {
    state.title = els.chartTitle.value.trim() || "论文项目功能型甘特图";
    state.start = els.rangeStart.value;
    state.end   = els.rangeEnd.value;
    clampItemsToRange(state);
    els.rangeStart.value = state.start;
    els.rangeEnd.value   = state.end;
    renderChart();
    updateDataBox();
    saveToStorage();
    return;
  }

  if (catId && field) {
    const cat = state.categories.find((c) => c.id === catId);
    if (cat) cat[field] = event.target.value;
    renderChart();
    updateDataBox();
    saveToStorage();
  }

  if (itemId && field) {
    const item = state.items.find((i) => i.id === itemId);
    if (item) item[field] = event.target.value;
    clampItemsToRange(state);
    if (item && (field === "start" || field === "end")) event.target.value = item[field];
    renderChart();
    updateDataBox();
    saveToStorage();
  }
});

// ── Click actions ──────────────────────────────────────────────────────────

document.addEventListener("click", async (event) => {
  const { removeCategory: removeCatId, removeItem: removeItemId } = event.target.dataset;

  if (event.target.id === "addCategory") {
    state.categories.push({
      id:    uid("cat"),
      name:  "新分区",
      color: palette[state.categories.length % palette.length],
    });
    render();
    return;
  }

  if (event.target.id === "addItem") {
    if (!state.categories.length) {
      state.categories.push({ id: uid("cat"), name: "新分区", color: palette[0] });
    }
    const cat = state.categories[0];
    state.items.push({
      id: uid("item"), categoryId: cat.id, name: "新条目",
      tag: "", start: state.start, end: state.end, color: cat.color,
    });
    render();
    return;
  }

  if (removeCatId) {
    state.categories = state.categories.filter((c) => c.id !== removeCatId);
    state.items      = state.items.filter((i) => i.categoryId !== removeCatId);
    render();
    return;
  }

  if (removeItemId) {
    state.items = state.items.filter((i) => i.id !== removeItemId);
    render();
    return;
  }

  if (event.target.id === "copyData") {
    await navigator.clipboard.writeText(els.dataBox.value);
    event.target.textContent = "已复制 ✓";
    setTimeout(() => { event.target.textContent = "复制"; }, 900);
    return;
  }

  if (event.target.id === "loadData") {
    try {
      const next = JSON.parse(els.dataBox.value);
      Object.assign(state, {
        title:      next.title      || "论文项目功能型甘特图",
        start:      next.start      || "2026-06-05",
        end:        next.end        || "2026-07-09",
        categories: Array.isArray(next.categories) ? next.categories : [],
        items:      Array.isArray(next.items)      ? next.items      : [],
      });
      clampItemsToRange(state);
      render();
    } catch {
      alert("数据格式不正确");
    }
    return;
  }

  if (event.target.id === "resetDemo") { localStorage.removeItem(STORAGE_KEY); location.reload(); return; }

  if (event.target.id === "saveData") {
    saveToStorage();
    event.target.textContent = "已保存 ✓";
    setTimeout(() => { event.target.textContent = "保存"; }, 1200);
    return;
  }

  if (event.target.id === "downloadImage") { downloadPngSnapshot(event.target); }
});

// ── PNG export ─────────────────────────────────────────────────────────────

let _h2c = null;
async function loadHtml2Canvas() {
  if (_h2c) return _h2c;
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    s.onload = () => { _h2c = window.html2canvas; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return _h2c;
}

async function downloadPngSnapshot(btn) {
  const origText = btn.textContent;
  btn.textContent = "生成中…";
  btn.disabled = true;

  try {
    const h2c = await loadHtml2Canvas();
    const chart = els.chart;
    const scroll = els.chartScroll;

    // Temporarily expose full scrollable area so html2canvas sees it all
    const prevOverflow = scroll.style.overflow;
    const prevHeight   = scroll.style.height;
    scroll.style.overflow = "visible";
    scroll.style.height   = chart.scrollHeight + "px";

    const canvas = await h2c(chart, {
      scale:        2,          // 2× for crisp high-DPI output
      useCORS:      true,
      logging:      false,
      scrollX:      0,
      scrollY:      -window.scrollY,
      width:        chart.scrollWidth,
      height:       chart.scrollHeight,
      windowWidth:  chart.scrollWidth,
      windowHeight: chart.scrollHeight,
    });

    scroll.style.overflow = prevOverflow;
    scroll.style.height   = prevHeight;

    const link = Object.assign(document.createElement("a"), {
      href:     canvas.toDataURL("image/png"),
      download: "gantt-chart.png",
    });
    link.click();
  } catch (err) {
    console.error(err);
    alert("PNG 导出失败，请检查网络连接后重试。");
  } finally {
    btn.textContent = origText;
    btn.disabled = false;
  }
}

// ── LocalStorage persistence ───────────────────────────────────────────────

const STORAGE_KEY = "gantt-maker-data";

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    title:      state.title,
    start:      state.start,
    end:        state.end,
    categories: state.categories,
    items:      state.items,
  }));
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    Object.assign(state, {
      title:      saved.title      || state.title,
      start:      saved.start      || state.start,
      end:        saved.end        || state.end,
      categories: Array.isArray(saved.categories) ? saved.categories : state.categories,
      items:      Array.isArray(saved.items)      ? saved.items      : state.items,
    });
    clampItemsToRange(state);
    return true;
  } catch {
    return false;
  }
}

// Auto-save after every render
onAfterRender(saveToStorage);

// ── Init ───────────────────────────────────────────────────────────────────

loadFromStorage();
render();
