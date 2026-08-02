import { decryptApiKey } from "./api-key-obfuscation";

const ENCRYPTED_COINCAP_API_KEY = "enc: PASTE_THE_COINCAP_OUTPUT_HERE ";
const ENCRYPTED_OPENAI_API_KEY = "enc: PASTE_THE_OPENAI_OUTPUT_HERE ";

// Central access point for public API addresses and locally obfuscated API keys.
class AppConfig {
    public readonly coinsUrl = import.meta.env.VITE_COINS_API || "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false";
    public readonly coinDetailsUrl = import.meta.env.VITE_COIN_DETAILS_URL || "https://api.coingecko.com/api/v3/coins/";
    public readonly pricesUrl = import.meta.env.VITE_COINCAP_BASE_URL || "https://rest.coincap.io/v3";
    public readonly openaiUrl = import.meta.env.VITE_OPENAI_URL || "https://api.openai.com/v1/chat/completions";
    public readonly coincapApiKey: string;
    public readonly openaiKey: string;

    public constructor() {
        this.coincapApiKey = decryptApiKey(ENCRYPTED_COINCAP_API_KEY);
        this.openaiKey = decryptApiKey(ENCRYPTED_OPENAI_API_KEY);
    }
}

export const appConfig = new AppConfig();
