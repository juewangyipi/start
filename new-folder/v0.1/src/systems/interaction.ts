import type { Facing, Player } from "../entities/player.ts";
import {
  GATHER,
  interactableCenter,
  isAvailable,
  type Interactable,
  type InteractKind,
} from "../entities/interactable.ts";
import type { Inventory } from "./inventory.ts";
import type { Skills } from "./skills.ts";
import { getItem } from "../data/items.ts";
import { SKILLS } from "../data/skills.ts";
import { CONFIG } from "../core/config.ts";

export type Toast = {
  text: string;
  ttl: number;
};

export type InteractionResult = {
  toasts: Toast[];
  active: Interactable | null;
  focus: Interactable | null;
  /** 最近一次成功采集类型（离线补进度用） */
  lastGatherKind: InteractKind | null;
};

const REACH = CONFIG.tileSize * 1.35;
const TOAST_TTL = 2.2;

/**
 * 面向目标 + 按住互动键 → 蓄力完成 → 掉落进包 + 技能经验。
 * depletedUntil 使用墙钟秒 Date.now()/1000，便于离线重生。
 */
export class InteractionSystem {
  private activeId: string | null = null;
  private fullBagCooldown = 0;
  lastGatherKind: InteractKind | null = null;

  update(args: {
    dt: number;
    nowSec: number;
    player: Player;
    interactHeld: boolean;
    list: Interactable[];
    inventory: Inventory;
    skills: Skills;
  }): InteractionResult {
    const { dt, nowSec, player, interactHeld, list, inventory, skills } = args;
    const toasts: Toast[] = [];
    this.fullBagCooldown = Math.max(0, this.fullBagCooldown - dt);
    let gathered: InteractKind | null = null;

    const focus = findFocus(player, list, nowSec);

    if (this.activeId) {
      const active = list.find((i) => i.id === this.activeId) ?? null;
      if (
        !active ||
        !isAvailable(active, nowSec) ||
        !isInReachAndFacing(player, active)
      ) {
        if (active) active.progress = 0;
        this.activeId = null;
      }
    }

    if (interactHeld && focus) {
      this.activeId = focus.id;
      const profile = GATHER[focus.kind];

      if (!inventory.canFit(profile.itemId, profile.amount)) {
        if (this.fullBagCooldown <= 0) {
          toasts.push({ text: "背包已满", ttl: TOAST_TTL });
          this.fullBagCooldown = 1.2;
        }
      } else {
        focus.progress += dt / profile.duration;
        if (focus.progress >= 1) {
          focus.progress = 0;
          focus.depletedUntil = nowSec + profile.respawn;

          const err = inventory.add(profile.itemId, profile.amount);
          if (err) {
            toasts.push({ text: err, ttl: TOAST_TTL });
          } else {
            const item = getItem(profile.itemId);
            toasts.push({
              text: `+${profile.amount} ${item.name}`,
              ttl: TOAST_TTL,
            });
            const ups = skills.addXp(profile.skillId, profile.xp);
            for (const u of ups) {
              toasts.push({
                text: `${SKILLS[u.skillId].name} 升到 ${u.level} 级！`,
                ttl: TOAST_TTL + 0.4,
              });
            }
            this.lastGatherKind = focus.kind;
            gathered = focus.kind;
          }
          this.activeId = null;
        }
      }
    } else if (!interactHeld && this.activeId) {
      this.activeId = null;
    }

    const active =
      (this.activeId && list.find((i) => i.id === this.activeId)) || null;

    return {
      toasts,
      active,
      focus,
      lastGatherKind: gathered ?? this.lastGatherKind,
    };
  }
}

function findFocus(
  player: Player,
  list: Interactable[],
  nowSec: number,
): Interactable | null {
  let best: Interactable | null = null;
  let bestDist = Infinity;

  for (const it of list) {
    if (!isAvailable(it, nowSec)) continue;
    if (!isInReachAndFacing(player, it)) continue;
    const c = interactableCenter(it);
    const pc = playerCenter(player);
    const d = Math.hypot(c.x - pc.x, c.y - pc.y);
    if (d < bestDist) {
      bestDist = d;
      best = it;
    }
  }
  return best;
}

function playerCenter(player: Player): { x: number; y: number } {
  return { x: player.x + player.size / 2, y: player.y + player.size / 2 };
}

function isInReachAndFacing(player: Player, it: Interactable): boolean {
  const pc = playerCenter(player);
  const c = interactableCenter(it);
  const dx = c.x - pc.x;
  const dy = c.y - pc.y;
  const dist = Math.hypot(dx, dy);
  if (dist > REACH) return false;
  if (dist < CONFIG.tileSize * 0.55) return true;

  const f = facingVec(player.facing);
  const inv = dist || 1;
  const dot = (dx / inv) * f.x + (dy / inv) * f.y;
  return dot >= 0.25;
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
