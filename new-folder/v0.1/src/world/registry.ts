import type { Chunk, ChunkId } from "./chunk.ts";
import { CONFIG } from "../core/config.ts";

/**
 * 四图注册表。邻接（与架构一致）：
 *   village ── grassland ── riverside ── forest
 */
const CHUNKS: Record<ChunkId, Chunk> = {
  village: {
    id: "village",
    name: "村落",
    groundColor: "#3d5c45",
    gridColor: "#35533e",
    widthTiles: CONFIG.viewTilesW,
    heightTiles: CONFIG.viewTilesH,
    neighbors: { right: "grassland" },
  },
  grassland: {
    id: "grassland",
    name: "草地",
    groundColor: "#4a6b3a",
    gridColor: "#405f32",
    widthTiles: CONFIG.viewTilesW,
    heightTiles: CONFIG.viewTilesH,
    neighbors: { left: "village", right: "riverside" },
  },
  riverside: {
    id: "riverside",
    name: "河边",
    groundColor: "#3a5f6b",
    gridColor: "#32545e",
    widthTiles: CONFIG.viewTilesW,
    heightTiles: CONFIG.viewTilesH,
    neighbors: { left: "grassland", right: "forest" },
  },
  forest: {
    id: "forest",
    name: "森林",
    groundColor: "#2f4a32",
    gridColor: "#28402b",
    widthTiles: CONFIG.viewTilesW,
    heightTiles: CONFIG.viewTilesH,
    neighbors: { left: "riverside" },
  },
};

export function getChunk(id: ChunkId): Chunk {
  return CHUNKS[id];
}

export function allChunkIds(): ChunkId[] {
  return Object.keys(CHUNKS) as ChunkId[];
}
