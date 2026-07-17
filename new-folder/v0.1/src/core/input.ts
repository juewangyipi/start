import { CONFIG } from "./config.ts";

export type MoveAxis = {
  x: number;
  y: number;
};

/**
 * 键盘输入：按住状态 + 本帧刚按下（边沿）。
 * 每帧末尾需调用 endFrame()。
 */
export class Input {
  private readonly down = new Set<string>();
  private readonly just = new Set<string>();

  constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    this.down.clear();
    this.just.clear();
  }

  endFrame(): void {
    this.just.clear();
  }

  getMoveAxis(): MoveAxis {
    let x = 0;
    let y = 0;
    if (this.anyDown(CONFIG.keys.left)) x -= 1;
    if (this.anyDown(CONFIG.keys.right)) x += 1;
    if (this.anyDown(CONFIG.keys.up)) y -= 1;
    if (this.anyDown(CONFIG.keys.down)) y += 1;
    return { x, y };
  }

  isInteractHeld(): boolean {
    return this.anyDown(CONFIG.keys.interact);
  }

  isInteractJustPressed(): boolean {
    return this.anyJust(CONFIG.keys.interact);
  }

  isInventoryJustPressed(): boolean {
    return this.anyJust(CONFIG.keys.inventory);
  }

  isEscapeJustPressed(): boolean {
    return this.anyJust(CONFIG.keys.escape);
  }

  private anyDown(codes: readonly string[]): boolean {
    return codes.some((c) => this.down.has(c));
  }

  private anyJust(codes: readonly string[]): boolean {
    return codes.some((c) => this.just.has(c));
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (
      e.code.startsWith("Arrow") ||
      e.code === "Space" ||
      e.code === "KeyW" ||
      e.code === "KeyA" ||
      e.code === "KeyS" ||
      e.code === "KeyD" ||
      e.code === "KeyE" ||
      e.code === "KeyB" ||
      e.code === "KeyI" ||
      e.code === "Escape"
    ) {
      e.preventDefault();
    }
    if (e.repeat) return;
    if (!this.down.has(e.code)) {
      this.just.add(e.code);
    }
    this.down.add(e.code);
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.down.delete(e.code);
  };

  private readonly onBlur = (): void => {
    this.down.clear();
    this.just.clear();
  };
}
