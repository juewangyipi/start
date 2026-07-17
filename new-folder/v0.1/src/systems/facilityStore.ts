import type { Facility } from "../entities/facility.ts";
import type { ChunkId } from "../world/chunk.ts";
import { createMapFacilities } from "../data/mapFacilities.ts";

export class FacilityStore {
  private readonly all: Facility[];

  constructor() {
    this.all = createMapFacilities();
  }

  forChunk(chunkId: ChunkId): Facility[] {
    return this.all.filter((f) => f.chunkId === chunkId);
  }
}
