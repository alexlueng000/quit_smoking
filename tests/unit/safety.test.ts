import { describe, expect, it } from "vitest";
import {
  createSafetyIntervention,
  detectSafetyEscalation,
} from "@/lib/ai/safety";
import { parseInterventionOutput } from "@/lib/ai/schema";

describe("intervention safety rules", () => {
  it("detects urgent medical language", () => {
    expect(detectSafetyEscalation("我现在胸痛而且呼吸困难")).toBe("medical_emergency");
  });

  it("detects self-harm language", () => {
    expect(detectSafetyEscalation("我不想活了")).toBe("self_harm");
  });

  it("returns schema-valid safety instructions", () => {
    expect(() => parseInterventionOutput(createSafetyIntervention("medical_emergency"))).not.toThrow();
    expect(() => parseInterventionOutput(createSafetyIntervention("self_harm"))).not.toThrow();
  });
});
