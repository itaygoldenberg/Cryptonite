import { decryptApiKey } from "./api-key-obfuscation";

const ENCRYPTED_COINCAP_API_KEY = "enc:  ";
const ENCRYPTED_OPENAI_API_KEY = "enc:  ";

// Central access point for hosted APIs and optional local encrypted keys.
class AppConfig {
    public readonly apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
    public readonly coinsUrl = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false";
    public readonly coinDetailsUrl = "https://api.coingecko.com/api/v3/coins/";
    public readonly pricesUrl = "https://rest.coincap.io/v3";
    public readonly openaiUrl = "https://api.openai.com/v1/chat/completions";
    public readonly coincapApiKey: string;
    public readonly openaiKey: string;
    public readonly useLocalApis: boolean;
    public readonly useLocalCoinCapApi: boolean;
    public readonly useLocalOpenAiApi: boolean;

    public constructor() {
        this.coincapApiKey = decryptApiKey(ENCRYPTED_COINCAP_API_KEY);
        this.openaiKey = decryptApiKey(ENCRYPTED_OPENAI_API_KEY);
        this.useLocalCoinCapApi = import.meta.env.DEV && Boolean(this.coincapApiKey);
        this.useLocalOpenAiApi = import.meta.env.DEV && Boolean(this.openaiKey);
        this.useLocalApis = this.useLocalCoinCapApi || this.useLocalOpenAiApi;
    }
}

export const appConfig = new AppConfig();

