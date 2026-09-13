import { AIProviderError, type AIProvider } from "./provider";
import { MockAIProvider } from "./providers/mock-provider";
import { OpenAICompatibleProvider } from "./providers/openai-compatible-provider";

class UnavailableAIProvider implements AIProvider {
  constructor(readonly name: string) {}

  async generateIntervention(): Promise<never> {
    throw new AIProviderError("AI provider configuration is incomplete", this.name);
  }
}

type AIEnvironment = {
  AI_PROVIDER?: string;
  AI_API_KEY?: string;
  AI_BASE_URL?: string;
  AI_MODEL?: string;
};

export function createAIProvider(
  environment: AIEnvironment = process.env as unknown as AIEnvironment,
): AIProvider {
  const name = environment.AI_PROVIDER || "mock";
  if (name === "mock") return new MockAIProvider();

  const apiKey = environment.AI_API_KEY;
  const baseUrl = environment.AI_BASE_URL;
  const model = environment.AI_MODEL;
  if (!apiKey || !baseUrl || !model) {
    return new UnavailableAIProvider(name);
  }
  return new OpenAICompatibleProvider({ name, apiKey, baseUrl, model });
}
