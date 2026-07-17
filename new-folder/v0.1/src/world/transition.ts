import type { Chunk, ChunkId, ChunkNeighbors } from "./chunk.ts";
import { chunkPixelSize } from "./chunk.ts";
import { getChunk } from "./registry.ts";
import { CONFIG } from "../core/config.ts";

export type ExitDir = keyof ChunkNeighbors;

export type TransitionResult = {
  nextId: ChunkId;
  /** 进入新块后的块内坐标 */
  x: number;
  y: number;
  via: ExitDir;
};

type Body = {
  x: number;
  y: number;
  size: number;
};

/**
 * 出界 + 邻接表 → 换块与对侧入口。
 * 不写死地图名；只读 chunk.neighbors。
 * 无邻居时返回 null，由调用方夹回边界。
 */
export function tryTransition(
  chunk: Chunk,
  body: Body,
  tileSize: number = CONFIG.tileSize,
): TransitionResult | null {
  const bounds = chunkPixelSize(chunk, tileSize);
  const dir = detectExit(body, bounds);
  if (!dir) return null;

  const nextId = chunk.neighbors[dir];
  if (!nextId) return null;

  const next = getChunk(nextId);
  const nextBounds = chunkPixelSize(next, tileSize);
  const { x, y } = placeAtOppositeEntrance(dir, body, nextBounds, tileSize);

  return { nextId, x, y, via: dir };
}

/** 是否越出某边（允许同时越角，取穿透更深的一侧） */
function detectExit(
  body: Body,
  bounds: { w: number; h: number },
): ExitDir | null {
  const overLeft = body.x < 0 ? -body.x : 0;
  const overRight =
    body.x + body.size > bounds.w ? body.x + body.size - bounds.w : 0;
  const overUp = body.y < 0 ? -body.y : 0;
  const overDown =
    body.y + body.size > bounds.h ? body.y + body.size - bounds.h : 0;

  const max = Math.max(overLeft, overRight, overUp, overDown);
  if (max <= 0) return null;

  if (max === overLeft) return "left";
  if (max === overRight) return "right";
  if (max === overUp) return "up";
  return "down";
}

/** 从 dir 离开旧图 → 放到新图对侧入口（略缩进，避免立刻再触发） */
function placeAtOppositeEntrance(
  exitDir: ExitDir,
  body: Body,
  nextBounds: { w: number; h: number },
  tileSize: number,
): { x: number; y: number } {
  const inset = tileSize * 0.5;
  const maxX = Math.max(0, nextBounds.w - body.size);
  const maxY = Math.max(0, nextBounds.h - body.size);

  // 保留另一轴相对位置，夹在合法范围内
  const keepX = clamp(body.x, 0, maxX);
  const keepY = clamp(body.y, 0, maxY);

  switch (exitDir) {
    case "left":
      // 往左出 → 从新图右侧进
      return { x: maxX - inset, y: keepY };
    case "right":
      return { x: inset, y: keepY };
    case "up":
      return { x: keepX, y: maxY - inset };
    case "down":
      return { x: keepX, y: inset };
  }
}

export function clampBodyToBounds(
  body: Body,
  bounds: { w: number; h: number },
): void {
  body.x = clamp(body.x, 0, Math.max(0, bounds.w - body.size));
  body.y = clamp(body.y, 0, Math.max(0, bounds.h - body.size));
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** 调试 / HUD：当前块有哪些出口 */
export function listExits(chunk: Chunk): string {
  const dirs: ExitDir[] = ["up", "down", "left", "right"];
  const parts: string[] = [];
  for (const d of dirs) {
    const id = chunk.neighbors[d];
    if (id) parts.push(`${dirLabel(d)}→${getChunk(id).name}`);
  }
  return parts.length ? parts.join("  ") : "（无出口）";
}

function dirLabel(d: ExitDir): string {
  switch (d) {
    case "up":
      return "上";
    case "down":
      return "下";
    case "left":
      return "左";
    case "right":
      return "右";
  }
}
