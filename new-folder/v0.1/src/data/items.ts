/** 物品定义：尽量纯数据，系统只读 id。 */
export type ItemId = "wood" | "raw_fish";

export type ItemDef = {
  id: ItemId;
  name: string;
  /** 单格最大堆叠 */
  stackMax: number;
  /** 卖价（商店后用） */
  sellPrice: number;
  /** UI / 掉落占位色 */
  color: string;
};

export const ITEMS: Record<ItemId, ItemDef> = {
  wood: {
    id: "wood",
    name: "木头",
    stackMax: 99,
    sellPrice: 2,
    color: "#a67c52",
  },
  raw_fish: {
    id: "raw_fish",
    name: "生鱼",
    stackMax: 99,
    sellPrice: 5,
    color: "#6eb5d0",
  },
};

export function getItem(id: ItemId): ItemDef {
  return ITEMS[id];
}
