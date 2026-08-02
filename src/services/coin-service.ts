import axios from "axios";
import type { AiMarketData } from "../models/ai-market-data-model";
import { CoinModel } from "../models/coin-model";
import { appConfig } from "../utils/app-config";
import { CoinDetailsModel } from "../models/coin-details-model";

const COINS_CACHE_KEY = "coinsCache";
const COINS_CACHE_MINUTES = 5;
const COINS_MIN_COUNT = 100;
const DETAILS_CACHE_PREFIX = "coinDetails:";
const AI_DATA_CACHE_PREFIX = "aiMarketData:";
const COINCAP_WEBSOCKET_URL = "wss://ws.coincap.io/prices?assets=";

export type LivePriceStatus = "connecting" | "open" | "closed" | "fallback";

// Handles every request related to coin data.
class CoinService {

    private coins: CoinModel[] | null = null;
    private pendingCoins: Promise<CoinModel[]> | null = null;
    private pendingPrices = new Map<string, Promise<Record<string, number>>>();
    private pricesRateLimitedUntil = 0;
    private pendingCoinCapAssets: Promise<Map<string, string>> | null = null;
    private coinCapAssets: Map<string, string> | null = null;

    // Returns the top 100 coins, reusing the memory cache, the storage cache or a request already in flight.
    public async getAllCoins(): Promise<CoinModel[]> {

        if (this.coins) return this.coins;

        const stored = this.readCache();

        if (stored) {
            this.coins = stored;
            return stored;
        }

        const stale = this.readCache(true);

        // Several pages ask for the list at the same moment, so they all share one request
        // instead of sending three and hitting the rate limit.
        if (this.pendingCoins) return this.pendingCoins;

        this.pendingCoins = axios.get<CoinModel[]>(appConfig.coinsUrl)
            .then(response => {
                const coins = response.data;

                // A short answer means the request was throttled or malformed, so it is
                // never kept and the next visit asks the server again.
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

    // Returns the current price of one coin in USD, EUR and ILS for the More Info panel.
    public async getCoinDetails(id: string): Promise<CoinDetailsModel> {
        try {
            const response = await axios.get(appConfig.coinDetailsUrl + id);
            const prices = response.data.market_data.current_price;

            const details = new CoinDetailsModel(prices.usd, prices.eur, prices.ils);
            this.writeLocalCache(DETAILS_CACHE_PREFIX + id, details);
            return details;
        }
        catch (error) {
            const cached = this.readLocalCache<CoinDetailsModel>(DETAILS_CACHE_PREFIX + id);
            if (cached) return new CoinDetailsModel(cached.usd, cached.eur, cached.ils);
            throw error;
        }
    }

    // Returns the seven market fields required by the ChatGPT prompt.
    public async getCoinDataForAi(id: string): Promise<AiMarketData> {
        try {
            const response = await axios.get(appConfig.coinDetailsUrl + id);
            const market = response.data.market_data;

            const data: AiMarketData = {
                name: response.data.name,
                current_price_usd: market.current_price.usd,
                market_cap_usd: market.market_cap.usd,
                volume_24h_usd: market.total_volume.usd,
                price_change_percentage_30d_in_currency: market.price_change_percentage_30d,
                price_change_percentage_60d_in_currency: market.price_change_percentage_60d,
                price_change_percentage_200d_in_currency: market.price_change_percentage_200d
            };

            this.writeLocalCache(AI_DATA_CACHE_PREFIX + id, data);
            return data;
        }
        catch (error) {
            const cached = this.readLocalCache<AiMarketData>(AI_DATA_CACHE_PREFIX + id);
            if (cached) return cached;
            throw error;
        }
    }

    // Returns the current USD price of the given symbols for the live report.
    public async getPrices(symbols: string[]): Promise<Record<string, number>> {

        const cacheKey = [...symbols].sort().join(",");
        const pending = this.pendingPrices.get(cacheKey);
        if (pending) return pending;

        if (Date.now() < this.pricesRateLimitedUntil) {
            throw new Error("CoinCap rate limit cooldown is active.");
        }

        // One request for a batch of coins is far cheaper than one request per coin.
        const url = appConfig.pricesUrl + "/assets?limit=150";

        const options = { headers: { Authorization: "Bearer " + appConfig.coincapApiKey } };
        const request = axios.get(url, options)
            .then(response => {
                const prices: Record<string, number> = {};

                // Matching is done by symbol because CoinGecko ids and CoinCap ids are not identical,
                // for example "binancecoin" versus "binance-coin".
                response.data.data.forEach((c: { symbol: string; priceUsd: string }) => {
                    const symbol = c.symbol.toUpperCase();

                    if (symbols.includes(symbol)) {
                        prices[symbol] = +c.priceUsd;
                    }
                });

                return prices;
            })
            .catch(error => {
                if (error.response?.status === 429) {
                    this.pricesRateLimitedUntil = Date.now() + 60000;
                }

                throw error;
            })
            .finally(() => this.pendingPrices.delete(cacheKey));

        this.pendingPrices.set(cacheKey, request);
        return request;
    }

    // Streams live prices without creating a REST request every second.
    public subscribeToLivePrices(
        symbols: string[],
        onPrices: (prices: Record<string, number>) => void,
        onStatus: (status: LivePriceStatus) => void
    ): () => void {
        let socket: WebSocket | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let stopped = false;
        let giveUp = false;
        let reconnectAttempts = 0;

        const start = async (): Promise<void> => {
            if (stopped || giveUp || document.hidden || reconnectAttempts >= 5) return;

            const assetIds = await this.resolveCoinCapAssetIds(symbols);
            if (stopped || giveUp || document.hidden || assetIds.length === 0) return;

            onStatus("connecting");
            const assetToSymbol = new Map(assetIds.map((id, index) => [id, symbols[index]]));

            // CoinCap closes the socket right after connecting unless the key travels in the address.
            const key = appConfig.coincapApiKey ? "&apiKey=" + appConfig.coincapApiKey : "";
            socket = new WebSocket(COINCAP_WEBSOCKET_URL + assetIds.join(",") + key);

            socket.onmessage = event => {
                try {
                    const message = JSON.parse(event.data) as Record<string, unknown>;

                    // A rejected key answers with an error object, and reconnecting cannot fix it,
                    // so the report moves to the REST fallback immediately.
                    if (typeof message.error === "string") {
                        giveUp = true;
                        onStatus("fallback");
                        socket?.close();
                        return;
                    }

                    const prices: Record<string, number> = {};

                    Object.entries(message).forEach(([assetId, value]) => {
                        const symbol = assetToSymbol.get(assetId);
                        const price = Number(value);

                        if (symbol && Number.isFinite(price) && price > 0) {
                            prices[symbol] = price;
                        }
                    });

                    if (Object.keys(prices).length === 0) return;

                    // The counter resets only once real prices arrive, because the socket also
                    // opens successfully when the key is rejected.
                    reconnectAttempts = 0;
                    onStatus("open");
                    onPrices(prices);
                }
                catch {
                    return;
                }
            };

            socket.onerror = () => onStatus("closed");
            socket.onclose = () => {
                socket = null;
                if (stopped || giveUp || document.hidden) return;

                reconnectAttempts++;
                if (reconnectAttempts >= 5) {
                    onStatus("fallback");
                    return;
                }

                const delay = Math.min(30000, 1000 * 2 ** (reconnectAttempts - 1));
                reconnectTimer = setTimeout(() => {
                    reconnectTimer = null;
                    void start();
                }, delay);
            };
        };

        const handleVisibilityChange = (): void => {
            if (document.hidden) {
                socket?.close();
                return;
            }

            if (!socket && !reconnectTimer && !giveUp) {
                reconnectAttempts = 0;
                void start();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        void start();

        return () => {
            stopped = true;
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (reconnectTimer) clearTimeout(reconnectTimer);
            socket?.close();
        };
    }

    // A trustworthy list holds the full top 100, so a partial answer is treated as invalid.
    private isCompleteList(coins: unknown): boolean {
        return Array.isArray(coins) && coins.length >= COINS_MIN_COUNT;
    }

    // Resolves CoinGecko symbols to CoinCap asset ids with one initial REST request.
    private async resolveCoinCapAssetIds(symbols: string[]): Promise<string[]> {
        const assetMap = await this.getCoinCapAssetMap();
        const fallbackIds: Record<string, string> = {
            BTC: "bitcoin",
            ETH: "ethereum",
            USDT: "tether",
            BNB: "binance-coin",
            XRP: "xrp",
            SOL: "solana",
            USDC: "usd-coin",
            ADA: "cardano",
            DOGE: "dogecoin",
            TRX: "tron",
            TON: "toncoin",
            AVAX: "avalanche",
            DOT: "polkadot",
            LINK: "chainlink",
            LTC: "litecoin",
            BCH: "bitcoin-cash",
            XMR: "monero",
            ETC: "ethereum-classic",
            XLM: "stellar",
            ATOM: "cosmos",
            NEAR: "near-protocol",
            UNI: "uniswap",
            FIL: "filecoin",
            ICP: "internet-computer",
            AAVE: "aave",
            ALGO: "algorand",
            MKR: "maker",
            VET: "vechain",
            OP: "optimism",
            ARB: "arbitrum",
            SUI: "sui"
        };

        return symbols.map(symbol => assetMap.get(symbol) ?? fallbackIds[symbol] ?? symbol.toLowerCase());
    }

    // Loads CoinCap ids once so coins outside the common symbol list can stream too.
    private getCoinCapAssetMap(): Promise<Map<string, string>> {

        // The map is kept for the whole session, otherwise every reconnect would send
        // another request and drain the daily quota.
        if (this.coinCapAssets) return Promise.resolve(this.coinCapAssets);

        if (this.pendingCoinCapAssets) return this.pendingCoinCapAssets;

        if (!appConfig.pricesUrl) return Promise.resolve(new Map());

        const options = { headers: { Authorization: "Bearer " + appConfig.coincapApiKey } };
        this.pendingCoinCapAssets = axios.get(appConfig.pricesUrl + "/assets?limit=150", options)
            .then(response => {
                const map = new Map<string, string>();
                response.data.data.forEach((coin: { symbol: string; id: string }) => {
                    map.set(coin.symbol.toUpperCase(), coin.id);
                });

                this.coinCapAssets = map;
                return map;
            })
            .catch(() => new Map<string, string>())
            .finally(() => {
                this.pendingCoinCapAssets = null;
            });

        return this.pendingCoinCapAssets;
    }

    // Reads the saved coin list, ignoring it when it is too old or incomplete.
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

    // Saves the coin list with a timestamp so a page refresh does not trigger a new request.
    private writeCache(coins: CoinModel[]): void {
        try {
            localStorage.setItem(COINS_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), coins }));
        }
        catch {
            return;
        }
    }

    // Reads a previously saved response without applying an expiration time.
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

    // Saves a response so it remains available when the API is temporarily unavailable.
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
