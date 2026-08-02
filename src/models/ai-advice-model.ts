// Buying recommendation returned by ChatGPT for a single coin.
export class AiAdviceModel {
    public recommendation: string;
    public explanation: string;

    public constructor(recommendation: string, explanation: string) {
        this.recommendation = recommendation;
        this.explanation = explanation;
    }
}
