// The seven market fields sent to ChatGPT for a selected coin.
export interface AiMarketData {
    name: string;
    current_price_usd: number | null;
    market_cap_usd: number | null;
    volume_24h_usd: number | null;
    price_change_percentage_30d_in_currency: number | null;
    price_change_percentage_60d_in_currency: number | null;
    price_change_percentage_200d_in_currency: number | null;
}
