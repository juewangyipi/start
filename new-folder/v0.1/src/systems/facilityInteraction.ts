import type { Facing, Player } from "../entities/player.ts";
import {
  facilityCenter,
  type Facility,
} from "../entities/facility.ts";
import { CONFIG } from "../core/config.ts";

const REACH = CONFIG.tileSize * 1.6;

/** 设施：靠近 + 面向 + 点按 E 打开。 */
export function findFacilityFocus(
  player: Player,
  list: Facility[],
): Facility | null {
  let best: Facility | null = null;
  let bestDist = Infinity;
  const pc = {
    x: player.x + player.size / 2,
    y: player.y + player.size / 2,
  };

  for (const f of list) {
    const c = facilityCenter(f);
    const dx = c.x - pc.x;
    const dy = c.y - pc.y;
    const dist = Math.hypot(dx, dy);
    if (dist > REACH) continue;
    if (dist >= CONFIG.tileSize * 0.6) {
      const fv = facingVec(player.facing);
      const inv = dist || 1;
      const dot = (dx / inv) * fv.x + (dy / inv) * fv.y;
      if (dot < 0.15) continue;
    }
    if (dist < bestDist) {
      bestDist = dist;
      best = f;
    }
  }
  return best;
}

function facingVec(f: Facing): { x: number; y: number } {
  switch (f) {
    case "up":
      return { x: 0, y: -1 };
    case "down":
      return { x: 0, y: 1 };
    case "left":
      return { x: -1, y: 0 };
    case "right":
      return { x: 1, y: 0 };
  }
}
