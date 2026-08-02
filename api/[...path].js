const COINGECKO_URL = "https://api.coingecko.com/api/v3";
const COINCAP_URL = "https://rest.coincap.io/v3";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const ALLOWED_ORIGINS = new Set([
    "https://cryptonite-amber.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]);

let coinsCache = null;
let pricesCache = null;
const detailsCache = new Map();

export async function handleApiRequest(request, response, forcedPath) {
    const origin = request.headers.origin;
    if (origin && ALLOWED_ORIGINS.has(origin)) {
        response.setHeader("Access-Control-Allow-Origin", origin);
    }
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

    if (request.method === "OPTIONS") {
        response.status(204).end();
        return;
    }

    const requestUrl = new URL(request.url, "http://localhost");
    const path = forcedPath || requestUrl.pathname.replace(/^\/api/, "").replace(/\/$/, "") || "/";

    try {
        if (request.method === "GET" && path === "/coins") {
            response.status(200).json(await getCoins());
            return;
        }

        const details = path.match(/^\/coins\/([a-zA-Z0-9_-]+)\/(details|ai-data)$/);
        if (request.method === "GET" && details) {
            response.status(200).json(await getDetails(details[1], details[2] === "ai-data"));
            return;
        }

        if (request.method === "GET" && path === "/reports/prices") {
            const symbols = parseSymbols(request.query.symbols);
            if (symbols.length === 0) {
                response.status(400).json({ error: "At least one symbol is required." });
                return;
            }

            response.setHeader("CDN-Cache-Control", "s-maxage=5, stale-while-revalidate=30");
            response.status(200).json(await getPrices(symbols));
            return;
        }

        if (request.method === "POST" && path === "/ai/advice") {
            response.status(200).json(await getAdvice(request.body));
            return;
        }

        response.status(404).json({ error: "Endpoint not found." });
    }
    catch {
        response.status(502).json({ error: "The requested provider is temporarily unavailable." });
    }
}

// Caches the CoinGecko list for five minutes.
async function getCoins() {
    if (coinsCache && coinsCache.expiresAt > Date.now()) return coinsCache.data;

    const response = await fetch(COINGECKO_URL + "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false");
    if (!response.ok) throw new Error("CoinGecko list request failed.");

    const data = await response.json();
    if (!Array.isArray(data) || data.length < 100) throw new Error("CoinGecko returned an incomplete list.");

    coinsCache = { expiresAt: Date.now() + 300000, data };
    return data;
}

// Caches CoinGecko details while preserving the existing response shapes.
async function getDetails(id, forAi) {
    const key = (forAi ? "ai:" : "details:") + id;
    const cached = detailsCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const response = await fetch(COINGECKO_URL + "/coins/" + encodeURIComponent(id));
    if (!response.ok) throw new Error("CoinGecko details request failed.");

    const coin = await response.json();
    const market = coin.market_data;
    const data = forAi
        ? {
            name: coin.name,
            current_price_usd: market.current_price?.usd ?? null,
            market_cap_usd: market.market_cap?.usd ?? null,
            volume_24h_usd: market.total_volume?.usd ?? null,
            price_change_percentage_30d_in_currency: market.price_change_percentage_30d ?? null,
            price_change_percentage_60d_in_currency: market.price_change_percentage_60d ?? null,
            price_change_percentage_200d_in_currency: market.price_change_percentage_200d ?? null
        }
        : {
            usd: market.current_price.usd,
            eur: market.current_price.eur,
            ils: market.current_price.ils
        };

    detailsCache.set(key, { expiresAt: Date.now() + 300000, data });
    return data;
}

// Calls CoinCap at most once every five seconds for Reports.
async function getPrices(symbols) {
    const requested = new Set(symbols);

    if (!pricesCache || pricesCache.expiresAt <= Date.now()) {
        try {
            const apiKey = process.env.COINCAP_API_KEY?.trim();
            if (!apiKey) throw new Error("CoinCap API key is missing.");

            const response = await fetch(COINCAP_URL + "/assets?limit=150", {
                headers: { Authorization: "Bearer " + apiKey }
            });
            if (!response.ok) throw new Error("CoinCap prices request failed.");

            const payload = await response.json();
            const data = {};
            payload.data.forEach(coin => {
                const price = Number(coin.priceUsd);
                if (Number.isFinite(price) && price > 0) data[coin.symbol.toUpperCase()] = price;
            });
            pricesCache = { expiresAt: Date.now() + 5000, data };
        }
        catch (error) {
            if (!pricesCache) throw error;
            pricesCache.expiresAt = Date.now() + 5000;
        }
    }

    return Object.fromEntries(
        Object.entries(pricesCache.data).filter(([symbol]) => requested.has(symbol))
    );
}

// Sends AI Advice to OpenAI without exposing the key to the browser.
async function getAdvice(body) {
    if (!isAiMarketData(body)) throw new Error("Invalid AI market data.");

    const prompt = "You are a crypto analyst. Based on the following data, decide whether this coin is worth buying. "
        + "Answer in JSON with exactly two fields: recommendation (one short sentence) and explanation (one paragraph). "
        + "Data: " + JSON.stringify(body);

    const response = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.OPENAI_API_KEY
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        })
    });
    if (!response.ok) throw new Error("OpenAI request failed.");

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned an empty answer.");

    const answer = JSON.parse(content);
    if (typeof answer.recommendation !== "string" || typeof answer.explanation !== "string") {
        throw new Error("OpenAI returned an invalid answer.");
    }

    return { recommendation: answer.recommendation, explanation: answer.explanation };
}

function parseSymbols(value) {
    if (typeof value !== "string") return [];
    return [...new Set(value.split(",")
        .map(symbol => symbol.trim().toUpperCase())
        .filter(symbol => /^[A-Z0-9_-]{1,20}$/.test(symbol)))].slice(0, 5);
}

function isAiMarketData(value) {
    if (!value || typeof value !== "object") return false;

    const fields = [
        "current_price_usd",
        "market_cap_usd",
        "volume_24h_usd",
        "price_change_percentage_30d_in_currency",
        "price_change_percentage_60d_in_currency",
        "price_change_percentage_200d_in_currency"
    ];

    return typeof value.name === "string" && fields.every(field =>
        value[field] === null || typeof value[field] === "number"
    );
}


export default function handler(request, response) {
    return handleApiRequest(request, response);
}

