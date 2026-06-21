import { state } from "./state.js";
import { dayMs, parseDate, formatDateToString, clampItemsToRange } from "./utils.js";
import { els, render, updateBarPosition, updateDataBox } from "./render.js";

let dragState = null;

export function attachBarInteractions() {
  document.querySelectorAll(".bar").forEach((bar) => {
    bar.addEventListener("mousedown", handleBarMouseDown);
    bar.addEventListener("dblclick", handleBarDoubleClick);
  });
}

function getCategoryRowAtY(clientY) {
  for (const row of document.querySelectorAll(".category-row")) {
    const rect = row.getBoundingClientRect();
    if (clientY >= rect.top && clientY <= rect.bottom) return row;
  }
  return null;
}

const LANE_HEIGHT = 60; // px per lane row (must match CSS: top: calc(var(--line) * 60px + 8px))

function handleBarMouseDown(event) {
  if (event.button !== 0) return;

  const handle = event.target.closest(".bar-resize-handle");

  const bar = event.currentTarget;
  const item = state.items.find((i) => i.id === bar.dataset.itemId);
  if (!item) return;

  const { scrollLeft } = els.chartScroll;
  const startX = event.clientX + scrollLeft;
  const startClientY = event.clientY;
  const originalLine = parseInt(bar.style.getPropertyValue("--line")) || 0;
  const categoryBodyEl = bar.closest(".category-body");

  dragState = {
    startX,
    originalStart: item.start,
    originalEnd:   item.end,
    originalLine,
    currentLine:   originalLine,
    categoryBodyEl,
    mode:          handle ? handle.dataset.resize : "move",
    isDragging:    false,
  };

  // Visual drop-target tracking — never mutates state
  let dropTargetRow = null;

  function clearDropTarget() {
    if (dropTargetRow) {
      dropTargetRow.classList.remove("drop-target");
      dropTargetRow = null;
    }
  }

  event.preventDefault();

  function onMouseMove(e) {
    const delta = e.clientX + els.chartScroll.scrollLeft - startX;
    const yDelta = e.clientY - startClientY;
    const hasMoved = dragState.mode === "move"
      ? Math.abs(delta) >= 5 || Math.abs(yDelta) >= 5
      : Math.abs(delta) >= 5;
    if (!dragState.isDragging && !hasMoved) return;

    dragState.isDragging = true;
    bar.classList.add("dragging");

    const dayWidth = parseFloat(getComputedStyle(bar).getPropertyValue("--day-width")) || 34;
    const dayDelta = Math.round(delta / dayWidth / 7) * 7;
    const origS = parseDate(dragState.originalStart);
    const origE = parseDate(dragState.originalEnd);
    const rangeS = parseDate(state.start);
    const rangeE = parseDate(state.end);
    let newS = origS, newE = origE;

    if (dragState.mode === "left") {
      newS = new Date(origS.getTime() + dayDelta * dayMs);
      if (newS < rangeS) newS = rangeS;
      if (newS > origE)  newS = origE;
    } else if (dragState.mode === "right") {
      newE = new Date(origE.getTime() + dayDelta * dayMs);
      if (newE > rangeE) newE = rangeE;
      if (newE < origS)  newE = origS;
    } else {
      newS = new Date(origS.getTime() + dayDelta * dayMs);
      newE = new Date(origE.getTime() + dayDelta * dayMs);

      const targetRow = getCategoryRowAtY(e.clientY);
      const targetCatId = targetRow?.dataset.categoryId;
      const isCrossCat = targetCatId && targetCatId !== item.categoryId;

      if (isCrossCat) {
        // Highlight drop destination; restore bar to its original lane
        if (dropTargetRow !== targetRow) {
          clearDropTarget();
          dropTargetRow = targetRow;
          targetRow.classList.add("drop-target");
        }
        bar.style.top = `calc(${dragState.originalLine} * ${LANE_HEIGHT}px + 8px)`;
      } else {
        clearDropTarget();
        // Snap bar to the nearest lane based on cursor Y within this section
        if (categoryBodyEl) {
          const bodyRect = categoryBodyEl.getBoundingClientRect();
          const relY = e.clientY - bodyRect.top;
          const targetLine = Math.max(0, Math.min(10, Math.round((relY - 10) / LANE_HEIGHT)));
          if (targetLine !== dragState.currentLine) {
            dragState.currentLine = targetLine;
            bar.style.top = `calc(${targetLine} * ${LANE_HEIGHT}px + 8px)`;
            // Expand section height while dragging if needed
            const categoryRow = categoryBodyEl.closest(".category-row");
            const neededPx = Math.max(70, (targetLine + 1) * LANE_HEIGHT + 14);
            const currentPx = parseFloat(categoryRow.style.getPropertyValue("--row-height")) || 62;
            if (neededPx > currentPx) {
              categoryRow.style.setProperty("--row-height", `${neededPx}px`);
            }
          }
        }
      }

      if (newS < rangeS || newE > rangeE) return;
    }

    item.start = formatDateToString(newS);
    item.end   = formatDateToString(newE);
    updateBarPosition(bar, item);
  }

  function onMouseUp(e) {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    bar.classList.remove("dragging");
    clearDropTarget();

    if (dragState?.isDragging) {
      if (dragState.mode === "move") {
        const targetRow = getCategoryRowAtY(e.clientY);
        const targetCatId = targetRow?.dataset.categoryId;
        const isNewCategory =
          targetCatId &&
          targetCatId !== item.categoryId &&
          state.categories.some((c) => c.id === targetCatId);

        if (isNewCategory) {
          item.categoryId = targetCatId;
          delete item.line; // reset manual lane when changing category
          render();
          dragState = null;
          return;
        }

        // Same-category drop: persist manual lane if it changed
        if (dragState.currentLine !== dragState.originalLine) {
          item.line = dragState.currentLine;
        }
        render(); // re-layout so other bars adjust around the updated position
      } else {
        updateDataBox();
      }
    }
    dragState = null;
  }

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

function handleBarDoubleClick(event) {
  const item = state.items.find((i) => i.id === event.currentTarget.dataset.itemId);
  if (!item) return;

  const overlay    = document.querySelector("#barEditOverlay");
  const nameInput  = document.querySelector("#editBarName");
  const tagInput   = document.querySelector("#editBarTag");
  const startInput = document.querySelector("#editBarStart");
  const endInput   = document.querySelector("#editBarEnd");
  const saveBtn    = document.querySelector("#saveBarEdit");
  const cancelBtn  = document.querySelector("#cancelBarEdit");

  nameInput.value  = item.name;
  tagInput.value   = item.tag || "";
  startInput.value = item.start;
  endInput.value   = item.end;
  overlay.classList.add("active");
  nameInput.focus();

  function close() {
    overlay.classList.remove("active");
    saveBtn.removeEventListener("click", onSave);
    cancelBtn.removeEventListener("click", close);
  }

  function onSave() {
    item.name  = nameInput.value.trim() || "未命名";
    item.tag   = tagInput.value.trim();
    item.start = startInput.value;
    item.end   = endInput.value;
    clampItemsToRange(state);
    close();
    render();
  }

  saveBtn.addEventListener("click", onSave);
  cancelBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); }, { once: true });
}
