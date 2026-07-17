import { CONFIG } from "../core/config.ts";
import type { Interactable } from "../entities/interactable.ts";
import type { ChunkId } from "../world/chunk.ts";

const T = CONFIG.tileSize;

function tree(
  id: string,
  chunkId: ChunkId,
  tileX: number,
  tileY: number,
): Interactable {
  return {
    id,
    kind: "tree",
    chunkId,
    x: tileX * T,
    y: tileY * T,
    size: T,
    depletedUntil: 0,
    progress: 0,
  };
}

function fish(
  id: string,
  chunkId: ChunkId,
  tileX: number,
  tileY: number,
): Interactable {
  return {
    id,
    kind: "fish_spot",
    chunkId,
    x: tileX * T,
    y: tileY * T,
    size: T,
    depletedUntil: 0,
    progress: 0,
  };
}

/**
 * 各图互动物布局（占位坐标）。
 * forest 砍树 · riverside 钓鱼 · grassland 可选 1 棵树。
 */
export function createMapInteractables(): Interactable[] {
  return [
    // 草地：路边一棵
    tree("gl_tree_1", "grassland", 6, 4),

    // 河边：靠近水域的鱼点（水域在右侧约 16～19 格）
    fish("rv_fish_1", "riverside", 14, 4),
    fish("rv_fish_2", "riverside", 15, 7),
    fish("rv_fish_3", "riverside", 14, 11),

    // 森林：多棵树
    tree("ft_tree_1", "forest", 3, 3),
    tree("ft_tree_2", "forest", 7, 2),
    tree("ft_tree_3", "forest", 12, 4),
    tree("ft_tree_4", "forest", 16, 3),
    tree("ft_tree_5", "forest", 4, 8),
    tree("ft_tree_6", "forest", 9, 9),
    tree("ft_tree_7", "forest", 15, 8),
    tree("ft_tree_8", "forest", 5, 12),
    tree("ft_tree_9", "forest", 11, 12),
    tree("ft_tree_10", "forest", 17, 11),
  ];
}
