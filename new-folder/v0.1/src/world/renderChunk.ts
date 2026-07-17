import type { Chunk, ChunkNeighbors } from "./chunk.ts";
import { CONFIG } from "../core/config.ts";
import { getChunk } from "./registry.ts";

type ExitDir = keyof ChunkNeighbors;

/**
 * 画当前块占位内容 + 可通行出口提示。
 * 各图略有区分，方便确认切屏是否成功。
 */
export function renderChunkBackground(
  ctx: CanvasRenderingContext2D,
  chunk: Chunk,
  width: number,
  height: number,
): void {
  const { tileSize } = CONFIG;

  ctx.fillStyle = chunk.groundColor;
  ctx.fillRect(0, 0, width, height);

  // 网格
  ctx.strokeStyle = chunk.gridColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= width; x += tileSize) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
  }
  for (let y = 0; y <= height; y += tileSize) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
  }
  ctx.stroke();

  // 各地图简单装饰（纯色块，非美术）
  drawDecor(ctx, chunk, width, height, tileSize);

  // 出口边缘高亮
  drawExitEdges(ctx, chunk, width, height, tileSize);
}

function drawDecor(
  ctx: CanvasRenderingContext2D,
  chunk: Chunk,
  width: number,
  height: number,
  tile: number,
): void {
  switch (chunk.id) {
    case "village": {
      // 中央小屋占位
      const bw = tile * 3;
      const bh = tile * 2;
      const bx = (width - bw) / 2;
      const by = (height - bh) / 2 - tile;
      ctx.fillStyle = "#6b5344";
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = "#8b3a3a";
      ctx.beginPath();
      ctx.moveTo(bx - 2, by);
      ctx.lineTo(bx + bw / 2, by - tile);
      ctx.lineTo(bx + bw + 2, by);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "grassland": {
      // 小路
      ctx.fillStyle = "#6d7a45";
      ctx.fillRect(0, height / 2 - tile / 2, width, tile);
      break;
    }
    case "riverside": {
      // 右侧水域
      ctx.fillStyle = "#2a6a8a";
      ctx.fillRect(width - tile * 4, 0, tile * 4, height);
      ctx.fillStyle = "#3a8ab0";
      ctx.fillRect(width - tile * 3.5, tile, tile * 2.5, height - tile * 2);
      break;
    }
    case "forest": {
      // 浅色灌木点缀（可砍的树由互动物层绘制）
      ctx.fillStyle = "rgba(30, 60, 35, 0.45)";
      const bushes = [
        [1, 1],
        [18, 2],
        [2, 14],
        [18, 13],
      ];
      for (const [tx, ty] of bushes) {
        ctx.fillRect(tx * tile + 2, ty * tile + 2, tile - 4, tile - 4);
      }
      break;
    }
  }
}

function drawExitEdges(
  ctx: CanvasRenderingContext2D,
  chunk: Chunk,
  width: number,
  height: number,
  tile: number,
): void {
  const dirs: ExitDir[] = ["up", "down", "left", "right"];
  const band = 3;

  for (const dir of dirs) {
    const nextId = chunk.neighbors[dir];
    if (!nextId) continue;

    ctx.fillStyle = "rgba(240, 220, 120, 0.45)";
    switch (dir) {
      case "left":
        ctx.fillRect(0, 0, band, height);
        break;
      case "right":
        ctx.fillRect(width - band, 0, band, height);
        break;
      case "up":
        ctx.fillRect(0, 0, width, band);
        break;
      case "down":
        ctx.fillRect(0, height - band, width, band);
        break;
    }

    // 出口旁小字提示
    const label = getChunk(nextId).name;
    ctx.fillStyle = "rgba(255, 245, 200, 0.9)";
    ctx.font = "10px sans-serif";
    ctx.textBaseline = "middle";
    switch (dir) {
      case "right":
        ctx.textAlign = "right";
        ctx.fillText(`→ ${label}`, width - tile * 0.4, height / 2);
        break;
      case "left":
        ctx.textAlign = "left";
        ctx.fillText(`${label} ←`, tile * 0.4, height / 2);
        break;
      case "up":
        ctx.textAlign = "center";
        ctx.fillText(`↑ ${label}`, width / 2, tile * 0.7);
        break;
      case "down":
        ctx.textAlign = "center";
        ctx.fillText(`↓ ${label}`, width / 2, height - tile * 0.7);
        break;
    }
  }
}
