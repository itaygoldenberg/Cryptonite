import axios from "axios";
import type { AiMarketData } from "../models/ai-market-data-model";
import { CoinModel } from "../models/coin-model";
import { appConfig } from "../utils/app-config";
import { CoinDetailsModel } from "../models/coin-details-model";
import { localApiService } from "./local-api-service";

const COINS_CACHE_KEY = "coinsCache";
const COINS_CACHE_MINUTES = 5;
const COINS_MIN_COUNT = 100;
const DETAILS_CACHE_PREFIX = "coinDetails:";
const AI_DATA_CACHE_PREFIX = "aiMarketData:";
const REPORT_API_INTERVAL_MS = 1000;

export type LivePriceStatus = "connecting" | "open" | "closed" | "fallback";

// Handles requests for coin data through Vercel Functions.
class CoinService {
    private coins: CoinModel[] | null = null;
    private pendingCoins: Promise<CoinModel[]> | null = null;
    private pendingPrices = new Map<string, Promise<Record<string, number>>>();

    // Returns the top 100 coins, reusing browser cache when possible.
    public async getAllCoins(): Promise<CoinModel[]> {
        if (this.coins) return this.coins;
        const stored = this.readCache();
        if (stored) {
            this.coins = stored;
            return stored;
        }

        const stale = this.readCache(true);
        if (this.pendingCoins) return this.pendingCoins;

        const request = appConfig.useLocalApis
            ? localApiService.getAllCoins()
            : axios.get<CoinModel[]>(appConfig.apiBaseUrl + "/coins").then(response => response.data);

        this.pendingCoins = request
            .then(coins => {
                if (this.isCompleteList(coins)) {
                    this.coins = coins;
                    this.writeCache(coins);
                    return coins;
                }
                if (stale) {
                    this.coins = stale;
                    return stale;
                }
                throw new Error("The coin list is incomplete.");
            })
            .catch(error => {
                if (stale) {
                    this.coins = stale;
                    return stale;
                }
                throw error;
            })
            .finally(() => {
                this.pendingCoins = null;
            });

        return this.pendingCoins;
    }

    // Returns the current price of one coin in the three supported currencies.
    public async getCoinDetails(id: string): Promise<CoinDetailsModel> {
        try {
            const details = appConfig.useLocalApis
                ? await localApiService.getCoinDetails(id)
                : await axios.get<CoinDetailsModel>(
                    appConfig.apiBaseUrl + "/coins/" + encodeURIComponent(id) + "/details"
                ).then(response => new CoinDetailsModel(
                    response.data.usd, response.data.eur, response.data.ils
                ));
            this.writeLocalCache(DETAILS_CACHE_PREFIX + id, details);
            return details;
        }
        catch (error) {
            const cached = this.readLocalCache<CoinDetailsModel>(DETAILS_CACHE_PREFIX + id);
            if (cached) return new CoinDetailsModel(cached.usd, cached.eur, cached.ils);
            throw error;
        }
    }

    // Returns the market fields required by the Vercel AI endpoint.
    public async getCoinDataForAi(id: string): Promise<AiMarketData> {
        try {
            const data = appConfig.useLocalApis
                ? await localApiService.getCoinDataForAi(id)
                : await axios.get<AiMarketData>(
                    appConfig.apiBaseUrl + "/coins/" + encodeURIComponent(id) + "/ai-data"
                ).then(response => response.data);
            this.writeLocalCache(AI_DATA_CACHE_PREFIX + id, data);
            return data;
        }
        catch (error) {
            const cached = this.readLocalCache<AiMarketData>(AI_DATA_CACHE_PREFIX + id);
            if (cached) return cached;
            throw error;
        }
    }

    // Requests one batched CoinCap response through the API and shares in-flight calls.
    public async getPrices(symbols: string[]): Promise<Record<string, number>> {
        const cacheKey = [...symbols].sort().join(",");
        const pending = this.pendingPrices.get(cacheKey);
        if (pending) return pending;

        const request = (
            appConfig.useLocalCoinCapApi
                ? localApiService.getPrices(symbols)
                : axios.get<Record<string, number>>(
                    appConfig.apiBaseUrl + "/reports/prices",
                    { params: { symbols: symbols.join(",") } }
                ).then(response => response.data)
        ).finally(() => this.pendingPrices.delete(cacheKey));

        this.pendingPrices.set(cacheKey, request);
        return request;
    }

    // Polls Vercel once per second while its server cache limits CoinCap requests.
    public subscribeToLivePrices(
        symbols: string[],
        onPrices: (prices: Record<string, number>) => void,
        onStatus: (status: LivePriceStatus) => void
    ): () => void {
        let stopped = false;
        let inFlight = false;

        const poll = async (): Promise<void> => {
            if (stopped || document.hidden || inFlight) return;
            inFlight = true;
            onStatus("connecting");

            try {
                const prices = await this.getPrices(symbols);
                if (Object.keys(prices).length === 0) onStatus("closed");
                else {
                    onStatus("open");
                    onPrices(prices);
                }
            }
            catch {
                onStatus("closed");
            }
            finally {
                inFlight = false;
            }
        };

        const handleVisibilityChange = (): void => {
            if (!document.hidden) void poll();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        void poll();
        const timer = setInterval(() => void poll(), REPORT_API_INTERVAL_MS);

        return () => {
            stopped = true;
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            clearInterval(timer);
        };
    }

    private isCompleteList(coins: unknown): boolean {
        return Array.isArray(coins) && coins.length >= COINS_MIN_COUNT;
    }

    private readCache(allowExpired = false): CoinModel[] | null {
        try {
            const raw = localStorage.getItem(COINS_CACHE_KEY);
            if (!raw) return null;
            const cache = JSON.parse(raw);
            const ageMinutes = (Date.now() - cache.savedAt) / 60000;
            if (!allowExpired && ageMinutes > COINS_CACHE_MINUTES) return null;
            if (!this.isCompleteList(cache.coins)) {
                localStorage.removeItem(COINS_CACHE_KEY);
                return null;
            }
            return cache.coins;
        }
        catch {
            localStorage.removeItem(COINS_CACHE_KEY);
            return null;
        }
    }

    private writeCache(coins: CoinModel[]): void {
        try {
            localStorage.setItem(COINS_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), coins }));
        }
        catch {
            return;
        }
    }

    private readLocalCache<T>(key: string): T | null {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const cache = JSON.parse(raw);
            return cache.data ?? cache;
        }
        catch {
            return null;
        }
    }

    private writeLocalCache(key: string, data: unknown): void {
        try {
            localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }));
        }
        catch {
            return;
        }
    }
}

export const coinService = new CoinService();


