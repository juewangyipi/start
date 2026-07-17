import { CONFIG } from "../core/config.ts";
import type { ChunkId } from "../world/chunk.ts";
import type { Player } from "./player.ts";

/** v0.1 极简威胁：森林中的史莱姆，接触掉血。 */
export class Slime {
  readonly chunkId: ChunkId = "forest";
  x: number;
  y: number;
  readonly size: number;

  constructor() {
    const T = CONFIG.tileSize;
    this.size = T;
    this.x = 10 * T;
    this.y = 7 * T;
  }

  update(dt: number, player: Player, playerChunk: ChunkId): void {
    if (playerChunk !== this.chunkId) return;
    const pcx = player.x + player.size / 2;
    const pcy = player.y + player.size / 2;
    const cx = this.x + this.size / 2;
    const cy = this.y + this.size / 2;
    const dx = pcx - cx;
    const dy = pcy - cy;
    const len = Math.hypot(dx, dy) || 1;
    const speed = CONFIG.slimeSpeed * CONFIG.tileSize;
    this.x += (dx / len) * speed * dt;
    this.y += (dy / len) * speed * dt;

    // 夹在图内
    const maxX = CONFIG.viewTilesW * CONFIG.tileSize - this.size;
    const maxY = CONFIG.viewTilesH * CONFIG.tileSize - this.size;
    this.x = Math.max(0, Math.min(maxX, this.x));
    this.y = Math.max(0, Math.min(maxY, this.y));
  }

  touching(player: Player): boolean {
    return (
      player.x < this.x + this.size &&
      player.x + player.size > this.x &&
      player.y < this.y + this.size &&
      player.y + player.size > this.y
    );
  }
}
