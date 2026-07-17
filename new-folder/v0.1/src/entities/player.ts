import { CONFIG } from "../core/config.ts";
import type { MoveAxis } from "../core/input.ts";

export type Facing = "up" | "down" | "left" | "right";

/** 玩家：块内像素坐标 + 朝向。边界与切屏由 World 处理。 */
export class Player {
  /** 块内像素坐标（左上角） */
  x: number;
  y: number;
  facing: Facing = "down";
  readonly size: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.size = CONFIG.tileSize;
  }

  /** 只负责位移与朝向，允许短暂出界以便 World 检测切屏。 */
  update(dt: number, axis: MoveAxis): void {
    let { x: ax, y: ay } = axis;
    if (ax === 0 && ay === 0) return;

    const len = Math.hypot(ax, ay);
    ax /= len;
    ay /= len;

    const speed = CONFIG.playerSpeed * CONFIG.tileSize;
    this.x += ax * speed * dt;
    this.y += ay * speed * dt;

    if (Math.abs(ax) > Math.abs(ay)) {
      this.facing = ax > 0 ? "right" : "left";
    } else {
      this.facing = ay > 0 ? "down" : "up";
    }
  }
}
