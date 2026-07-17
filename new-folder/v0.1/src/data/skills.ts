/** 生活技能定义（v0.1：砍树、钓鱼） */
export type SkillId = "woodcutting" | "fishing";

export type SkillDef = {
  id: SkillId;
  name: string;
};

export const SKILLS: Record<SkillId, SkillDef> = {
  woodcutting: { id: "woodcutting", name: "砍树" },
  fishing: { id: "fishing", name: "钓鱼" },
};

/** 升到 nextLevel 所需经验（从当前 level 升到 level+1） */
export function xpToNextLevel(level: number): number {
  return 10 + (level - 1) * 8;
}
