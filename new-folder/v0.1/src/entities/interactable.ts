import type { ChunkId } from "../world/chunk.ts";
import type { ItemId } from "../data/items.ts";
import type { SkillId } from "../data/skills.ts";

export type InteractKind = "tree" | "fish_spot";

export type Interactable = {
  id: string;
  kind: InteractKind;
  chunkId: ChunkId;
  /** 块内像素坐标（左上角） */
  x: number;
  y: number;
  size: number;
  /** 耗尽后至该墙钟秒（Date.now()/1000）前不可采，便于离线重生 */
  depletedUntil: number;
  /** 当前互动进度 0～1 */
  progress: number;
};

export type GatherProfile = {
  skillId: SkillId;
  itemId: ItemId;
  /** 每次完成获得数量 */
  amount: number;
  /** 技能经验 */
  xp: number;
  /** 蓄力秒数 */
  duration: number;
  /** 耗尽后重生秒数 */
  respawn: number;
  label: string;
};

export const GATHER: Record<InteractKind, GatherProfile> = {
  tree: {
    skillId: "woodcutting",
    itemId: "wood",
    amount: 1,
    xp: 5,
    duration: 1.1,
    respawn: 12,
    label: "砍树",
  },
  fish_spot: {
    skillId: "fishing",
    itemId: "raw_fish",
    amount: 1,
    xp: 6,
    duration: 1.4,
    respawn: 10,
    label: "钓鱼",
  },
};

export function isAvailable(it: Interactable, nowSec: number): boolean {
  return nowSec >= it.depletedUntil;
}

export function interactableCenter(it: Interactable): { x: number; y: number } {
  return { x: it.x + it.size / 2, y: it.y + it.size / 2 };
}
