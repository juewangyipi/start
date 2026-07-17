import { CONFIG } from "../core/config.ts";

export type DayPhase = "dawn" | "day" | "dusk" | "night";

/** 昼夜：氛围为主；0～1 为一天进度。 */
export class TimeOfDay {
  /** 一天内进度 0～1 */
  progress: number;

  constructor(progress = 0.25) {
    this.progress = progress;
  }

  update(dt: number): void {
    this.progress = (this.progress + dt / CONFIG.dayLengthSec) % 1;
  }

  phase(): DayPhase {
    const p = this.progress;
    if (p < 0.2) return "dawn";
    if (p < 0.55) return "day";
    if (p < 0.7) return "dusk";
    return "night";
  }

  phaseLabel(): string {
    switch (this.phase()) {
      case "dawn":
        return "黎明";
      case "day":
        return "白天";
      case "dusk":
        return "黄昏";
      case "night":
        return "夜晚";
    }
  }

  /** 画面压暗 0～1（夜晚最暗） */
  darkness(): number {
    switch (this.phase()) {
      case "dawn":
        return 0.12;
      case "day":
        return 0;
      case "dusk":
        return 0.22;
      case "night":
        return 0.48;
    }
  }
}
