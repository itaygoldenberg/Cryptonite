import axios from "axios";
import { AiAdviceModel } from "../models/ai-advice-model";
import type { AiMarketData } from "../models/ai-market-data-model";
import { appConfig } from "../utils/app-config";

const AI_ADVICE_CACHE_PREFIX = "aiAdvice:";

// Handles the communication with the ChatGPT API.
class AiService {

    // Sends the coin market data to ChatGPT and returns its buying recommendation.
    public async getAdvice(coinData: AiMarketData): Promise<AiAdviceModel> {

        const prompt = "You are a crypto analyst. Based on the following data, decide whether this coin is worth buying. "
            + "Answer in JSON with exactly two fields: recommendation (one short sentence) and explanation (one paragraph). "
            + "Data: " + JSON.stringify(coinData);

        // response_format forces valid JSON, otherwise the model may answer in free text
        // and the parsing below would fail.
        const body = {
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        };

        const options = { headers: { Authorization: "Bearer " + appConfig.openaiKey } };

        try {
            const response = await axios.post(appConfig.openaiUrl, body, options);

            // The answer arrives as a JSON string inside the first choice of the response.
            const answer = JSON.parse(response.data.choices[0].message.content);
            const advice = new AiAdviceModel(answer.recommendation, answer.explanation);

            this.writeCache(coinData.name, advice);
            return advice;
        }
        catch (error) {
            const cached = this.readCache(coinData.name);
            if (cached) return cached;
            throw error;
        }
    }

    // Reads the last recommendation saved for the same coin.
    private readCache(coinName: string): AiAdviceModel | null {
        try {
            const raw = localStorage.getItem(AI_ADVICE_CACHE_PREFIX + coinName);
            if (!raw) return null;

            const cache = JSON.parse(raw);
            const data = cache.data ?? cache;
            if (typeof data.recommendation !== "string" || typeof data.explanation !== "string") return null;

            return new AiAdviceModel(data.recommendation, data.explanation);
        }
        catch {
            return null;
        }
    }

    // Saves the recommendation for use when the AI API is unavailable.
    private writeCache(coinName: string, advice: AiAdviceModel): void {
        try {
            localStorage.setItem(AI_ADVICE_CACHE_PREFIX + coinName, JSON.stringify({
                savedAt: Date.now(),
                data: advice
            }));
        }
        catch {
            return;
        }
    }

}

export const aiService = new AiService();
