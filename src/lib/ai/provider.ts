import type { InterventionInput, InterventionOutput } from "./schema";

export interface AIProvider {
  readonly name: string;
  generateIntervention(input: InterventionInput): Promise<InterventionOutput>;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "AIProviderError";
  }
}
