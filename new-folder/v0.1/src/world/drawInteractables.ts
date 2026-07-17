import {
  GATHER,
  isAvailable,
  type Interactable,
} from "../entities/interactable.ts";

/** 绘制当前图互动物 + 焦点高亮 + 蓄力条 */
export function drawInteractables(
  ctx: CanvasRenderingContext2D,
  list: Interactable[],
  nowSec: number,
  focusId: string | null,
  active: Interactable | null,
): void {
  for (const it of list) {
    const available = isAvailable(it, nowSec);
    const focused = focusId === it.id;

    if (it.kind === "tree") {
      drawTree(ctx, it, available, focused);
    } else {
      drawFishSpot(ctx, it, available, focused);
    }

    if (available && it.progress > 0) {
      drawProgress(ctx, it);
    } else if (!available) {
      drawRespawnHint(ctx, it, nowSec);
    }
  }

  if (active && active.progress > 0) {
    const profile = GATHER[active.kind];
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(active.x - 4, active.y - 14, active.size + 8, 10);
    ctx.fillStyle = "#fff6c8";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(profile.label, active.x + active.size / 2, active.y - 9);
  }
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  it: Interactable,
  available: boolean,
  focused: boolean,
): void {
  const { x, y, size } = it;
  if (focused) {
    ctx.strokeStyle = "#ffe08a";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 1, y - 1, size + 2, size + 2);
  }
  ctx.fillStyle = available ? "#5a3d28" : "#3a3a3a";
  ctx.fillRect(x + size * 0.35, y + size * 0.45, size * 0.3, size * 0.5);
  ctx.fillStyle = available ? "#2f7a3e" : "#4a4a4a";
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size * 0.35, size * 0.42, 0, Math.PI * 2);
  ctx.fill();
  if (available) {
    ctx.fillStyle = "#3d9a52";
    ctx.beginPath();
    ctx.arc(x + size / 2 - 2, y + size * 0.3, size * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFishSpot(
  ctx: CanvasRenderingContext2D,
  it: Interactable,
  available: boolean,
  focused: boolean,
): void {
  const { x, y, size } = it;
  if (focused) {
    ctx.strokeStyle = "#9ad8ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 1, y - 1, size + 2, size + 2);
  }
  ctx.fillStyle = available ? "rgba(80, 180, 220, 0.55)" : "rgba(80,80,90,0.4)";
  ctx.beginPath();
  ctx.ellipse(
    x + size / 2,
    y + size / 2,
    size * 0.45,
    size * 0.28,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  if (available) {
    ctx.fillStyle = "#e8f6ff";
    ctx.fillRect(x + size * 0.35, y + size * 0.4, size * 0.35, size * 0.18);
  }
}

function drawProgress(ctx: CanvasRenderingContext2D, it: Interactable): void {
  const w = it.size + 4;
  const h = 3;
  const x = it.x - 2;
  const y = it.y + it.size + 2;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#f0d28a";
  ctx.fillRect(x, y, w * Math.min(1, it.progress), h);
}

function drawRespawnHint(
  ctx: CanvasRenderingContext2D,
  it: Interactable,
  nowSec: number,
): void {
  const left = Math.max(0, Math.ceil(it.depletedUntil - nowSec));
  if (left <= 0) return;
  ctx.fillStyle = "rgba(200,200,200,0.7)";
  ctx.font = "8px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(`${left}s`, it.x + it.size / 2, it.y + it.size + 2);
}
