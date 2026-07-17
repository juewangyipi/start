import type { Interactable } from "../entities/interactable.ts";
import type { ChunkId } from "../world/chunk.ts";
import { createMapInteractables } from "../data/mapInteractables.ts";

export type InteractableSnapshot = {
  id: string;
  depletedUntil: number;
  progress: number;
};

/** 世界互动物仓库：按当前块过滤；耗尽时间用墙钟秒。 */
export class InteractableStore {
  private readonly all: Interactable[];

  constructor() {
    this.all = createMapInteractables();
  }

  forChunk(chunkId: ChunkId): Interactable[] {
    return this.all.filter((i) => i.chunkId === chunkId);
  }

  allList(): Interactable[] {
    return this.all;
  }

  getById(id: string): Interactable | undefined {
    return this.all.find((i) => i.id === id);
  }

  toJSON(): InteractableSnapshot[] {
    return this.all.map((i) => ({
      id: i.id,
      depletedUntil: i.depletedUntil,
      progress: i.progress,
    }));
  }

  loadJSON(list: InteractableSnapshot[]): void {
    const map = new Map(list.map((s) => [s.id, s]));
    for (const it of this.all) {
      const s = map.get(it.id);
      if (!s) continue;
      it.depletedUntil = s.depletedUntil;
      it.progress = s.progress;
    }
  }
}
