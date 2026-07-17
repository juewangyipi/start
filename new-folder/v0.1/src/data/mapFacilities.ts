import { CONFIG } from "../core/config.ts";
import type { Facility } from "../entities/facility.ts";

const T = CONFIG.tileSize;

/** 村落设施：商店、仓库、存档点 */
export function createMapFacilities(): Facility[] {
  return [
    {
      id: "vil_shop",
      kind: "shop",
      chunkId: "village",
      x: 4 * T,
      y: 6 * T,
      size: T * 2,
      label: "商店",
    },
    {
      id: "vil_warehouse",
      kind: "warehouse",
      chunkId: "village",
      x: 14 * T,
      y: 6 * T,
      size: T * 2,
      label: "仓库",
    },
    {
      id: "vil_save",
      kind: "save_point",
      chunkId: "village",
      x: 9 * T,
      y: 10 * T,
      size: T,
      label: "存档点",
    },
  ];
}
