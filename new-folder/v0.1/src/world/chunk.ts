/** 地图块：邻接表驱动切屏，勿在逻辑里写死地图名。 */
export type ChunkId = "village" | "grassland" | "riverside" | "forest";

export type ChunkNeighbors = {
  up?: ChunkId;
  down?: ChunkId;
  left?: ChunkId;
  right?: ChunkId;
};

export type Chunk = {
  id: ChunkId;
  /** 显示名（调试 / UI） */
  name: string;
  /** 地面主色（占位美术） */
  groundColor: string;
  /** 网格辅色 */
  gridColor: string;
  widthTiles: number;
  heightTiles: number;
  neighbors: ChunkNeighbors;
};

export function chunkPixelSize(chunk: Chunk, tileSize: number): {
  w: number;
  h: number;
} {
  return {
    w: chunk.widthTiles * tileSize,
    h: chunk.heightTiles * tileSize,
  };
}
