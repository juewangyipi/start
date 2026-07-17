import type { Facility } from "../entities/facility.ts";

export function drawFacilities(
  ctx: CanvasRenderingContext2D,
  list: Facility[],
  focusId: string | null,
): void {
  for (const f of list) {
    const focused = f.id === focusId;
    switch (f.kind) {
      case "shop":
        drawShop(ctx, f, focused);
        break;
      case "warehouse":
        drawWarehouse(ctx, f, focused);
        break;
      case "save_point":
        drawSave(ctx, f, focused);
        break;
    }
  }
}

function drawShop(
  ctx: CanvasRenderingContext2D,
  f: Facility,
  focused: boolean,
): void {
  if (focused) strokeFocus(ctx, f, "#ffd98a");
  ctx.fillStyle = "#6b4a2e";
  ctx.fillRect(f.x, f.y, f.size, f.size);
  ctx.fillStyle = "#c4a35a";
  ctx.fillRect(f.x + 2, f.y + 2, f.size - 4, f.size * 0.35);
  ctx.fillStyle = "#f0e0b0";
  ctx.font = "9px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("店", f.x + f.size / 2, f.y - 2);
}

function drawWarehouse(
  ctx: CanvasRenderingContext2D,
  f: Facility,
  focused: boolean,
): void {
  if (focused) strokeFocus(ctx, f, "#a8d4ff");
  ctx.fillStyle = "#3d4a5c";
  ctx.fillRect(f.x, f.y, f.size, f.size);
  ctx.fillStyle = "#8a9bb0";
  ctx.fillRect(f.x + 4, f.y + 6, f.size - 8, f.size - 10);
  ctx.fillStyle = "#d0dce8";
  ctx.font = "9px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("仓", f.x + f.size / 2, f.y - 2);
}

function drawSave(
  ctx: CanvasRenderingContext2D,
  f: Facility,
  focused: boolean,
): void {
  if (focused) strokeFocus(ctx, f, "#b8f0c0");
  ctx.fillStyle = "#4a7a55";
  ctx.beginPath();
  ctx.arc(f.x + f.size / 2, f.y + f.size / 2, f.size * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c8f5d0";
  ctx.fillRect(f.x + f.size * 0.35, f.y + f.size * 0.2, f.size * 0.3, f.size * 0.55);
  ctx.fillStyle = "#e8ffe8";
  ctx.font = "8px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("存", f.x + f.size / 2, f.y - 2);
}

function strokeFocus(
  ctx: CanvasRenderingContext2D,
  f: Facility,
  color: string,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(f.x - 1, f.y - 1, f.size + 2, f.size + 2);
}
