// Buying recommendation returned by ChatGPT for a single coin.
export class AiAdviceModel {
    public recommendation: string;
    public explanation: string;

    // Creates a normalized AI recommendation and its supporting explanation.
    public constructor(recommendation: string, explanation: string) {
        this.recommendation = recommendation;
        this.explanation = explanation;
    }
}
