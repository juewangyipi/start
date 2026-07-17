import { CONFIG } from "../core/config.ts";
import type { Chunk, ChunkId } from "./chunk.ts";
import { chunkPixelSize } from "./chunk.ts";
import { getChunk } from "./registry.ts";
import {
  clampBodyToBounds,
  tryTransition,
  type ExitDir,
} from "./transition.ts";

export type TransitionEvent = {
  from: ChunkId;
  to: ChunkId;
  via: ExitDir;
};

/** 世界层：当前块 + 切屏。 */
export class World {
  currentId: ChunkId = "village";
  /** 最近一次切屏（HUD 提示用） */
  lastTransition: TransitionEvent | null = null;

  get current(): Chunk {
    return getChunk(this.currentId);
  }

  boundsPx(): { w: number; h: number } {
    return chunkPixelSize(this.current, CONFIG.tileSize);
  }

  /**
   * 移动后调用：有邻接则换块并对侧落点，否则夹回边界。
   * @returns 是否发生了切屏
   */
  resolvePlayerBounds(player: {
    x: number;
    y: number;
    size: number;
  }): boolean {
    const result = tryTransition(this.current, player);
    if (result) {
      const from = this.currentId;
      this.currentId = result.nextId;
      player.x = result.x;
      player.y = result.y;
      this.lastTransition = { from, to: result.nextId, via: result.via };
      return true;
    }

    clampBodyToBounds(player, this.boundsPx());
    return false;
  }
}
