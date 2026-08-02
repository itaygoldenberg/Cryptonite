# Cryptonite

A React and TypeScript single page application that presents live data about the
top 100 cryptocurrencies, draws real-time price reports, and provides AI-powered
buying advice.

This project was created as the second project of the John Bryce Full Stack Web
Developer course.

## Links

| | |
|---|---|
| Live site | https://cryptonite-amber.vercel.app |
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

Reports displays one live chart containing all selected coins. The chart checks for
new data once per second and keeps the latest twenty readings. CoinCap requests are
batched for all selected coins, and saved readings remain visible after API failures.

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
- Vercel Functions

## Project structure

```text
api/                    Protected Vercel API routes
scripts/                Local API-key obfuscation helper
src/
|-- components/
|   |-- coins-area/      CoinCard, SearchBox, LimitDialog
|   |-- layout-area/     Layout, Header, Menu, Routing
|   |-- pages-area/      Home, Reports, AiAdvice, About, Page404
|-- models/              CoinModel, CoinDetailsModel, AiAdviceModel
|-- redux/               coins-slice, selected-slice, search-slice, store
|-- services/            CoinService, AiService, LocalApiService
|-- utils/               AppConfig and local key decryption
vercel.json             Production routing and SPA fallback
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

Create a CoinCap API key from the [CoinCap Pro Dashboard](https://pro.coincap.io/dashboard).
For Production, store the raw key only as the `COINCAP_API_KEY` Vercel Environment Variable.

## Running locally

Install the dependencies:

~~~bash
npm install
~~~

### Full Vercel development

The recommended local setup uses the same protected API architecture as Production.
Install the Vercel CLI and run:

~~~bash
npm install -g vercel
vercel login
vercel dev
~~~

Vercel prints the local URL, normally `http://localhost:3000`.

### Optional encrypted-key workflow for the evaluator

The project also keeps the instructor-approved local obfuscation workflow. Generate
one encrypted value for each local API key without writing the original key to a file:

~~~bash
npm run encrypt:key -- CoinCap
npm run encrypt:key -- OpenAI
~~~

Each command asks for the original key and prints one value beginning with `enc:`.
Open `src/utils/app-config.ts` and replace the complete placeholder inside the
matching quotes:

~~~ts
const ENCRYPTED_COINCAP_API_KEY = "enc:PASTE_THE_COINCAP_OUTPUT_HERE";
const ENCRYPTED_OPENAI_API_KEY = "enc:PASTE_THE_OPENAI_OUTPUT_HERE";
~~~

Do not paste the original keys into source code. After adding the generated values,
run `npm start`; Vite opens the app at `http://localhost:5173` and Development mode
uses the matching local CoinCap and OpenAI key. CoinGecko remains keyless.

This XOR-based obfuscation is included only for local evaluation and is reversible;
it is not a replacement for server-side secret storage. Keep the placeholders in
GitHub, Production builds and the submitted ZIP. The evaluator should generate values
with their own keys on their own computer.

## Vercel API setup

The API runs in a Vercel Function. Production API keys are stored in Vercel
Environment Variables and are never placed in React source code, the browser bundle,
GitHub or the ZIP. Vercel uses raw server-side values, not the optional `enc:` values.

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


## Production build

```bash
npm run build
```

The production files are generated in the `dist` folder. Do not include
`node_modules`, `.env`, `dist` or `.git` in the submitted ZIP archive.

## Author

Itay Goldenberg

- GitHub: https://github.com/itaygoldenberg
- LinkedIn: https://www.linkedin.com/in/itay-goldenberg/




