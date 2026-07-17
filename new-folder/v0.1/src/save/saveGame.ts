import { CONFIG } from "../core/config.ts";
import type { ChunkId } from "../world/chunk.ts";
import type { Facing } from "../entities/player.ts";
import type { InventorySnapshot } from "../systems/inventory.ts";
import type { SkillsSnapshot } from "../systems/skills.ts";
import type { ShopState } from "../systems/shop.ts";
import type { InteractableSnapshot } from "../systems/interactableStore.ts";
import type { InteractKind } from "../entities/interactable.ts";

export type SavePointData = {
  chunkId: ChunkId;
  x: number;
  y: number;
};

export type SaveData = {
  version: string;
  wallMs: number;
  gold: number;
  hp: number;
  chunkId: ChunkId;
  playerX: number;
  playerY: number;
  facing: Facing;
  inventory: InventorySnapshot;
  warehouse: InventorySnapshot;
  skills: SkillsSnapshot;
  shop: ShopState;
  savePoint: SavePointData;
  dayProgress: number;
  interactables: InteractableSnapshot[];
  lastGatherKind: InteractKind | null;
  slimeX: number;
  slimeY: number;
};

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(CONFIG.saveKey);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (!data || data.version !== CONFIG.version) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(CONFIG.saveKey, JSON.stringify(data));
  } catch {
    // 配额满等：静默
  }
}

export function clearSave(): void {
  localStorage.removeItem(CONFIG.saveKey);
}
