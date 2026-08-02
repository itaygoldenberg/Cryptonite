# Cryptonite

A React and TypeScript single page application that presents live data about the
top 100 cryptocurrencies, draws real-time price reports, and provides AI-powered
buying advice.

This project was created as the second project of the John Bryce Full Stack Web
Developer course.

## Links

| | |
|---|---|
| Live site | https://cryptonite-c953a.web.app |
| GitHub repository | https://github.com/itaygoldenberg/Cryptonite |
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

Install the frontend dependencies:

~~~bash
npm install
~~~

The frontend sends API requests to the same-origin /api Vercel Function.

For local API testing, use Vercel locally:\r\n\r\n~~~bash\r\nvercel dev\r\n~~~

Run the Vite app in another terminal:

~~~bash
npm run dev
~~~

The application runs at http://localhost:5173.

## Vercel API setup

The API runs in a Vercel Function. API keys are stored in Vercel Environment
Variables and are never placed in React source code, the browser bundle, GitHub
or the ZIP.

Install the Vercel CLI:

~~~bash
npm install -g vercel
vercel login
~~~

From the project root, connect the project and deploy:

~~~bash
vercel
~~~

In the Vercel dashboard, open Project Settings > Environment Variables and add
these Production variables:

~~~text
COINCAP_API_KEY
OPENAI_API_KEY
~~~

Enter the real values only in the Vercel dashboard. Do not use a VITE_ prefix
for secret variables because VITE_ values are exposed to the browser.

Deploy again after adding the variables:

~~~bash
vercel --prod
~~~

The live API architecture is:

~~~text
Browser -> same-origin /api Vercel Function -> CoinGecko/CoinCap/OpenAI
~~~

The Function caches CoinGecko and CoinCap responses and requests CoinCap at most
once every five seconds for Reports. Vercel Hobby Functions are free within the
plan limits. The Hobby plan is intended for personal, non-commercial projects.

For local testing, use:

~~~bash
vercel dev
~~~

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




