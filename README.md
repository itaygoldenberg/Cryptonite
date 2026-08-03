<div align="center">

  # 💎 Cryptonite
  ### Real-Time Cryptocurrency Analytics & AI Market Intelligence

  A modern, high-performance React & TypeScript Single Page Application (SPA) delivering live market data for the top 100 cryptocurrencies, real-time charting, and AI-powered buying insights.

  [![Live Site](https://img.shields.io/badge/LIVE_DEMO-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://cryptonite-amber.vercel.app)
  [![GitHub Repo](https://img.shields.io/badge/GITHUB-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/itaygoldenberg/Cryptonite)
  [![LinkedIn](https://img.shields.io/badge/LINKEDIN-Itay_Goldenberg-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/itay-goldenberg/)

  <br />

  ![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![TypeScript](https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  ![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-593D88?style=for-the-badge&logo=redux&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
  ![Vercel Serverless](https://img.shields.io/badge/Vercel_Functions-000000?style=for-the-badge&logo=vercel&logoColor=white)
  ![OpenAI API](https://img.shields.io/badge/OpenAI_GPT-412991?style=for-the-badge&logo=openai&logoColor=white)

  <p align="center">
    <i>Developed as Project #2 of the John Bryce Full Stack Web Development Program.</i>
  </p>

</div>

---

## 📑 Table of Contents

- [Overview & Quick Links](#-overview--quick-links)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture & Structure](#-project-architecture--structure)
- [API Services & Endpoints](#-api-services--endpoints)
- [Local Development & Setup](#-local-development--setup)
- [Key Obfuscation & Security Workflow](#-key-obfuscation--security-workflow)
- [Vercel Deployment & Environment Variables](#-vercel-deployment--environment-variables)
- [Production Build](#-production-build)
- [Author](#-author)

---

## 🔗 Overview & Quick Links

| Resource | Link |
| :--- | :--- |
| **Live Web Application** | [https://cryptonite-amber.vercel.app](https://cryptonite-amber.vercel.app) |
| **GitHub Repository** | [https://github.com/itaygoldenberg/Cryptonite](https://github.com/itaygoldenberg/Cryptonite) |
| **Developer Portfolio / LinkedIn** | [https://www.linkedin.com/in/itay-goldenberg/](https://www.linkedin.com/in/itay-goldenberg/) |

---

## ✨ Key Features

### 🧭 Navigation & Global Search
* Features seamless client-side routing between **Home**, **Reports**, **AI Advice**, and **About** pages.
* Includes a global, case-insensitive instant search input located in the top navigation bar.

### 🪙 Home Page & Live Filtering
* Displays live market cards for the top 100 cryptocurrencies.
* Each card includes the coin image, symbol, full name, an interactive **More Info** toggle, and a selection switch.
* **Zero Network Overhead**: Search queries filter the client-side loaded dataset instantly without issuing additional external API requests.

### ℹ️ More Info Dynamic Fetching
* Displays live conversion rates in **USD ($)**, **EUR (€)**, and **ILS (₪)**.
* Fetches financial details once per coin on demand and caches the data directly in the local card component state to prevent redundant requests.

### 📌 Selected Coins & State Persistence
* Users can select up to **5 cryptocurrencies** to analyze across the Reports and AI Advice dashboards.
* Selecting a 6th coin triggers a interactive modal replacement dialog.
* Selected coin identifiers persist across browser sessions using `localStorage`.

### 📈 Reports Page (Real-Time Charting)
* Renders a live multi-axis chart featuring all selected cryptocurrencies powered by Recharts.
* Polls new market readings once per second, maintaining a rolling window of the latest **20 readings**.
* Batches CoinCap network requests for all active coins simultaneously and maintains existing visual trends during temporary API network failures.

### 🤖 AI Advice Page (Market Intelligence)
* Aggregates market data for selected coins and communicates directly with the OpenAI ChatGPT API.
* Submits structured market telemetry per coin:
  ```text
  • name
  • current_price_usd
  • market_cap_usd
  • volume_24h_usd
  • price_change_percentage_30d_in_currency
  • price_change_percentage_60d_in_currency
  • price_change_percentage_200d_in_currency
