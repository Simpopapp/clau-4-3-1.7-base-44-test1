import { describe, expect, it } from "vitest";

import {
  DEFAULT_PLUS,
  DEFAULT_SETTINGS,
  migrateLegacyState,
  normalizePlusSettings,
} from "@/lib/storage";
import { PLUS_TOGGLES, plusEnabled } from "@/lib/plus/settings";

describe("Studie Plus — settings v5", () => {
  it("defaults do pack: tudo desligado", () => {
    expect(DEFAULT_PLUS).toEqual({
      wordTranslation: false,
      phraseTranslation: false,
      plusAudio: false,
    });
    expect(DEFAULT_SETTINGS.plus).toEqual(DEFAULT_PLUS);
  });

  it("normalizePlusSettings aceita só boolean true; qualquer outra coisa fica off", () => {
    expect(normalizePlusSettings(undefined)).toEqual(DEFAULT_PLUS);
    expect(normalizePlusSettings(null)).toEqual(DEFAULT_PLUS);
    expect(normalizePlusSettings({})).toEqual(DEFAULT_PLUS);
    expect(
      normalizePlusSettings({
        wordTranslation: true,
        phraseTranslation: "sim",
        plusAudio: 1,
      }),
    ).toEqual({ wordTranslation: true, phraseTranslation: false, plusAudio: false });
  });

  it("migração v4 → v5 ganha pack desligado sem perder settings v4", () => {
    const v4 = migrateLegacyState({
      version: 4,
      attempts: [],
      bookmarks: [],
      settings: { dailyGoal: 12, targetScore: 79, examDate: "2026-12-01" },
    });
    expect(v4.version).toBe(6);
    expect(v4.settings.dailyGoal).toBe(12);
    expect(v4.settings.targetScore).toBe(79);
    expect(v4.settings.examDate).toBe("2026-12-01");
    expect(v4.settings.plus).toEqual(DEFAULT_PLUS);
  });

  it("migração v5 preserva os flags do pack", () => {
    const v5 = migrateLegacyState({
      version: 5,
      attempts: [],
      bookmarks: [],
      settings: { plus: { wordTranslation: true, phraseTranslation: false, plusAudio: true } },
    });
    expect(v5.version).toBe(6);
    expect(v5.settings.plus).toEqual({
      wordTranslation: true,
      phraseTranslation: false,
      plusAudio: true,
    });
  });

  it("plusEnabled reflete qualquer flag ativo", () => {
    const base = { ...DEFAULT_SETTINGS };
    expect(plusEnabled(base)).toBe(false);
    expect(plusEnabled({ ...base, plus: { ...DEFAULT_PLUS, phraseTranslation: true } })).toBe(true);
    expect(plusEnabled({ ...base, plus: { ...DEFAULT_PLUS, plusAudio: true } })).toBe(true);
  });

  it("catálogo de toggles do pack cobre exatamente os 3 recursos", () => {
    expect(PLUS_TOGGLES.map((t) => t.key)).toEqual([
      "wordTranslation",
      "phraseTranslation",
      "plusAudio",
    ]);
  });
});
