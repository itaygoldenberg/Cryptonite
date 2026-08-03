import axios from "axios";
import { AiAdviceModel } from "../models/ai-advice-model";
import type { AiMarketData } from "../models/ai-market-data-model";
import { CoinDetailsModel } from "../models/coin-details-model";
import type { CoinModel } from "../models/coin-model";
import { appConfig } from "../utils/app-config";

type CoinGeckoDetails = {
    name: string;
    market_data: {
        current_price: { usd: number; eur: number; ils: number };
        market_cap: { usd: number };
        total_volume: { usd: number };
        price_change_percentage_30d: number | null;
        price_change_percentage_60d: number | null;
        price_change_percentage_200d: number | null;
    };
};

type CoinCapAsset = {
    symbol: string;
    priceUsd: string;
};

type OpenAiResponse = {
    choices?: Array<{ message?: { content?: string } }>;
};

// Supports the optional encrypted-key workflow during local development only.
class LocalApiService {

    // Loads the top 100 CoinGecko entries when local encrypted-key mode is enabled.
    public async getAllCoins(): Promise<CoinModel[]> {
        const response = await axios.get<CoinModel[]>(appConfig.coinsUrl);
        return response.data;
    }

    // Loads one coin's current USD, EUR and ILS prices for local More Info.
    public async getCoinDetails(id: string): Promise<CoinDetailsModel> {
        const response = await axios.get<CoinGeckoDetails>(
            appConfig.coinDetailsUrl + encodeURIComponent(id)
        );
        const prices = response.data.market_data.current_price;
        return new CoinDetailsModel(prices.usd, prices.eur, prices.ils);
    }

    // Maps CoinGecko market data to the exact fields required by AI Advice.
    public async getCoinDataForAi(id: string): Promise<AiMarketData> {
        const response = await axios.get<CoinGeckoDetails>(
            appConfig.coinDetailsUrl + encodeURIComponent(id)
        );
        const coin = response.data;
        const market = coin.market_data;

        return {
            name: coin.name,
            current_price_usd: market.current_price.usd,
            market_cap_usd: market.market_cap.usd,
            volume_24h_usd: market.total_volume.usd,
            price_change_percentage_30d_in_currency: market.price_change_percentage_30d,
            price_change_percentage_60d_in_currency: market.price_change_percentage_60d,
            price_change_percentage_200d_in_currency: market.price_change_percentage_200d
        };
    }

    // Returns one batched CoinCap price response for the requested symbols.
    public async getPrices(symbols: string[]): Promise<Record<string, number>> {
        const response = await axios.get<{ data: CoinCapAsset[] }>(
            appConfig.pricesUrl + "/assets?limit=150",
            { headers: { Authorization: "Bearer " + appConfig.coincapApiKey } }
        );
        const requested = new Set(symbols);
        const prices: Record<string, number> = {};

        response.data.data.forEach(coin => {
            const symbol = coin.symbol.toUpperCase();
            const price = Number(coin.priceUsd);
            if (requested.has(symbol) && Number.isFinite(price) && price > 0) {
                prices[symbol] = price;
            }
        });

        return prices;
    }

    // Sends the validated market snapshot to OpenAI and parses its JSON response.
    public async getAdvice(coinData: AiMarketData): Promise<AiAdviceModel> {
        const prompt = "You are a crypto analyst. Based on the following data, decide whether this coin is worth buying. "
            + "Answer in JSON with exactly two fields: recommendation (one short sentence) and explanation (one paragraph). "
            + "Data: " + JSON.stringify(coinData);

        const response = await axios.post<OpenAiResponse>(
            appConfig.openaiUrl,
            {
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            },
            { headers: { Authorization: "Bearer " + appConfig.openaiKey } }
        );

        const content = response.data.choices?.[0]?.message?.content;
        if (!content) throw new Error("OpenAI returned an empty answer.");

        const answer = JSON.parse(content) as { recommendation?: unknown; explanation?: unknown };
        if (typeof answer.recommendation !== "string" || typeof answer.explanation !== "string") {
            throw new Error("OpenAI returned an invalid answer.");
        }

        return new AiAdviceModel(answer.recommendation, answer.explanation);
    }
}

export const localApiService = new LocalApiService();
