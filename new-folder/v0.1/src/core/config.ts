/** 全局配置：格子、版本、键位、速度等。系统尽量读这里，少写魔法数。 */
export const CONFIG = {
  version: "v0.1",
  title: "Game v0.1",

  tileSize: 16,
  viewTilesW: 20,
  viewTilesH: 15,

  playerSpeed: 4.5,

  inventorySlots: 12,
  warehouseSlots: 16,
  startingGold: 15,
  maxHp: 100,

  /** 一天时长（真实秒） */
  dayLengthSec: 120,

  /** 自动存档间隔（秒） */
  autosaveSec: 12,

  /** 离线补进度：最多折算秒数 / 最多补采次数 */
  offlineMaxSec: 60 * 30,
  offlineMaxGathers: 25,
  /** 离线时按该间隔折算一次采集 */
  offlineGatherSec: 14,

  /** 背包/仓库扩容：每次加几格、基础价、每次加价 */
  expandSlots: 4,
  bagExpandBasePrice: 20,
  bagExpandPriceStep: 12,
  warehouseExpandBasePrice: 25,
  warehouseExpandPriceStep: 15,

  /** 森林史莱姆接触伤害 / 秒 */
  slimeDps: 18,
  slimeSpeed: 1.6,

  saveKey: "game-v0.1-save",

  keys: {
    up: ["KeyW", "ArrowUp"],
    down: ["KeyS", "ArrowDown"],
    left: ["KeyA", "ArrowLeft"],
    right: ["KeyD", "ArrowRight"],
    interact: ["KeyE", "Space"],
    inventory: ["KeyB", "KeyI"],
    escape: ["Escape"],
  },
} as const;

export type Config = typeof CONFIG;

export function viewWidthPx(): number {
  return CONFIG.viewTilesW * CONFIG.tileSize;
}

export function viewHeightPx(): number {
  return CONFIG.viewTilesH * CONFIG.tileSize;
}

export function bagExpandPrice(level: number): number {
  return CONFIG.bagExpandBasePrice + level * CONFIG.bagExpandPriceStep;
}

export function warehouseExpandPrice(level: number): number {
  return (
    CONFIG.warehouseExpandBasePrice + level * CONFIG.warehouseExpandPriceStep
  );
}
