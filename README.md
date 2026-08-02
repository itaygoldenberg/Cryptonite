# Cryptonite

A React and TypeScript single page application that presents live data about the
top 100 cryptocurrencies, draws real-time price reports, and provides AI-powered
buying advice.

This project was created as the second project of the John Bryce Full Stack Web
Developer course.

## Links

| | |
|---|---|
| Live site | Add the Firebase Hosting URL after deployment |
| GitHub repository | https://github.com/itaygoldenberg/cryptonite |
| Author | https://www.linkedin.com/in/itay-goldenberg/ |

## Features

### Navigation

The application includes Home, Reports, AI Advice and About pages. The navbar
also includes a case-insensitive coin search field.

### Home page

The Home page displays the top 100 coins. Each card shows the coin image, symbol,
name, a More Info button and a selection switch.

The search filters the already loaded list locally by coin name or symbol, so
typing does not create additional API requests.

### More Info

More Info displays the current price in USD, EUR and ILS. Details are loaded once
per coin and then kept in the card state.

### Selected coins

Users can select up to five coins for the Reports and AI Advice pages. Selecting a
sixth coin opens a replacement dialog. The selected coin IDs are stored in
`localStorage`, so the switches remain selected after the browser is reopened.

### Reports page

Reports displays one live chart containing all selected coins. Prices are refreshed
once per second, and the chart keeps the latest twenty readings. Polling stops
after three consecutive failures while the collected data remains visible.

### AI Advice page

The AI Advice page lists the selected coins. Each coin can be sent to the ChatGPT
API with the following market fields:

```text
name
current_price_usd
market_cap_usd
volume_24h_usd
price_change_percentage_30d_in_currency
price_change_percentage_60d_in_currency
price_change_percentage_200d_in_currency
```

The response contains a short recommendation and an explanation paragraph.

### About page

The About page includes project information, technologies, a personal photo and
contact links.

## Technologies

- React
- TypeScript
- Redux Toolkit
- React Router
- Axios
- Recharts
- Vite

## Project structure

```text
src/
|-- components/
|   |-- coins-area/      CoinCard, SearchBox, LimitDialog
|   |-- layout-area/     Layout, Header, Menu, Routing
|   |-- pages-area/      Home, Reports, AiAdvice, About, Page404
|-- models/              CoinModel, CoinDetailsModel, AiAdviceModel
|-- redux/               coins-slice, selected-slice, search-slice, store
|-- services/            CoinService, AiService
|-- utils/               AppConfig
```

Redux stores the coin list, selected coins and search term globally so navigation
between pages does not require another coin-list request.

## APIs

| Purpose | Provider |
|---|---|
| Top 100 coins | CoinGecko `/coins/markets` |
| More Info details | CoinGecko `/coins/{id}` |
| AI market data | CoinGecko `/coins/{id}` |
| Live report prices | CoinCap `/assets` |
| AI recommendation | OpenAI `/v1/chat/completions` |

CoinCap is used for the live report and was approved as the project's real-time
price provider. Prices are matched by symbol because CoinGecko and CoinCap use
different coin ID formats.

Create a CoinCap API key from the [CoinCap Pro Dashboard](https://pro.coincap.io/dashboard)
before generating its encrypted project value.

## Running locally

Install dependencies:

```bash
npm install
```

The public API URLs have defaults, so a `.env` file is optional. To override
them locally, use these variables:

```text
VITE_COINS_API
VITE_COIN_DETAILS_URL
VITE_COINCAP_BASE_URL
VITE_OPENAI_URL
```

API keys are not read from `.env`. Generate an obfuscated value locally:

```bash
npm run encrypt:key -- CoinCap
npm run encrypt:key -- OpenAI
```

Each command asks for the original key and prints one value that starts with
`enc:`. Open `src/utils/app-config.ts` and replace only the empty value inside
the matching quotes:

```ts
const ENCRYPTED_COINCAP_API_KEY = "enc: PASTE_THE_COINCAP_OUTPUT_HERE";
const ENCRYPTED_OPENAI_API_KEY = "enc: PASTE_THE_OPENAI_OUTPUT_HERE";
```

Do not paste original API keys into the source code. Keep the `enc:` values in
these two constants, then start the app or build it normally. This lets the
project run after it is cloned or extracted from a ZIP, while keeping original
keys out of `.env`, GitHub and the submission archive.

This client-side approach prevents an original key from being stored as plain
text in the repository. It is not equivalent to server-side secret storage,
because a determined user can inspect a running browser application.

Start the development server:

```bash
npm run dev
```

The application runs at `http://localhost:5173`.

## Production build

```bash
npm run build
```

The production files are generated in the `dist` folder. Do not include
`node_modules`, `.env` or `dist` in the submitted ZIP archive.

## Author

Itay Goldenberg

- GitHub: https://github.com/itaygoldenberg
- LinkedIn: https://www.linkedin.com/in/itay-goldenberg/
