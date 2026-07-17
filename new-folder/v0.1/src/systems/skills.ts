import type { SkillId } from "../data/skills.ts";
import { SKILLS, xpToNextLevel } from "../data/skills.ts";

export type SkillState = {
  level: number;
  xp: number;
};

export type LevelUpEvent = {
  skillId: SkillId;
  level: number;
};

export type SkillsSnapshot = Record<SkillId, SkillState>;

/** 技能运行时：等级 + 经验；升级事件给 UI 提示。 */
export class Skills {
  private readonly states: Record<SkillId, SkillState> = {
    woodcutting: { level: 1, xp: 0 },
    fishing: { level: 1, xp: 0 },
  };

  get(id: SkillId): SkillState {
    return this.states[id];
  }

  addXp(id: SkillId, amount: number): LevelUpEvent[] {
    if (amount <= 0) return [];
    const st = this.states[id];
    st.xp += amount;
    const events: LevelUpEvent[] = [];

    while (st.xp >= xpToNextLevel(st.level)) {
      st.xp -= xpToNextLevel(st.level);
      st.level += 1;
      events.push({ skillId: id, level: st.level });
    }
    return events;
  }

  summaryLine(): string {
    return (Object.keys(SKILLS) as SkillId[])
      .map((id) => {
        const s = this.states[id];
        return `${SKILLS[id].name}Lv${s.level}`;
      })
      .join(" · ");
  }

  toJSON(): SkillsSnapshot {
    return {
      woodcutting: { ...this.states.woodcutting },
      fishing: { ...this.states.fishing },
    };
  }

  loadJSON(data: SkillsSnapshot): void {
    for (const id of Object.keys(SKILLS) as SkillId[]) {
      const s = data[id];
      if (s) {
        this.states[id].level = s.level;
        this.states[id].xp = s.xp;
      }
    }
  }
}
