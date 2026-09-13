import { AIProviderError, type AIProvider } from "@/lib/ai/provider";
import { buildInterventionPrompt, INTERVENTION_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { parseInterventionOutput, type InterventionInput } from "@/lib/ai/schema";
import { selectStrategies, type TriggerType } from "@/lib/ai/strategies";

type ProviderConfig = {
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
};

export class OpenAICompatibleProvider implements AIProvider {
  readonly name: string;

  constructor(private readonly config: ProviderConfig) {
    this.name = config.name;
  }

  async generateIntervention(input: InterventionInput) {
    const strategies = selectStrategies(
      input.currentCraving.trigger as TriggerType,
      input.currentCraving.beforeScore,
    );
    try {
      const response = await fetch(`${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: INTERVENTION_SYSTEM_PROMPT },
            { role: "user", content: buildInterventionPrompt(input, strategies) },
          ],
        }),
        signal: AbortSignal.timeout(2_500),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = payload.choices?.[0]?.message?.content;
      if (!raw) throw new Error("Provider returned no content");
      const output = parseInterventionOutput(JSON.parse(raw));
      if (!strategies.includes(output.strategy)) {
        throw new Error("Provider selected a strategy outside the allowed rule set");
      }
      return output;
    } catch (error) {
      throw new AIProviderError("AI intervention request failed", this.name, { cause: error });
    }
  }
}
