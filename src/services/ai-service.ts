import axios from "axios";
import { AiAdviceModel } from "../models/ai-advice-model";
import type { AiMarketData } from "../models/ai-market-data-model";
import { appConfig } from "../utils/app-config";
import { localApiService } from "./local-api-service";

const AI_ADVICE_CACHE_PREFIX = "aiAdvice:";

// Handles AI advice requests through the Vercel API.
class AiService {

    // Sends market data to the server and returns the cached or fresh recommendation.
    public async getAdvice(coinData: AiMarketData): Promise<AiAdviceModel> {
        try {
            const advice = appConfig.useLocalOpenAiApi
                ? await localApiService.getAdvice(coinData)
                : await axios.post<{ recommendation: string; explanation: string }>(
                    appConfig.apiBaseUrl + "/ai/advice",
                    coinData
                ).then(response => new AiAdviceModel(
                    response.data.recommendation, response.data.explanation
                ));
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

