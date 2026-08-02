import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CoinModel } from "../../../models/coin-model";
import { coinService } from "../../../services/coin-service";
import { initCoinsAction } from "../../../redux/coins-slice";
import type { AppState } from "../../../redux/store";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CoinLegend, CoinTooltip } from "./report-chart";
import { getChangeKey, loadCachedReportData, REPORT_POLL_INTERVAL_MS, saveReportData } from "./report-cache";
import type { ReportPoint } from "./report-cache";
import "./reports.css";

// Live report drawing one chart with the current price of every selected coin.
export function Reports() {

    const coins = useSelector<AppState, CoinModel[]>(state => state.coins);
    const selected = useSelector<AppState, string[]>(state => state.selected);
    const dispatch = useDispatch();
    const [data, setData] = useState<ReportPoint[]>([]);
    const [error, setError] = useState("");

    const selectedCoins = useMemo(
        () => coins.filter(c => selected.includes(c.id)),
        [coins, selected]
    );
    const symbols = useMemo(
        () => selectedCoins.map(c => c.symbol.toUpperCase()),
        [selectedCoins]
    );
    useEffect(() => {
        if (coins.length > 0) return;

        coinService.getAllCoins()
            .then(all => dispatch(initCoinsAction(all)))
            .catch(() => undefined);
    }, [coins.length, dispatch]);

    // Uses a live stream and redraws the chart once per second without REST polling.
    useEffect(() => {

        if (symbols.length === 0) return;

        let failures = 0;
        let restTimer: ReturnType<typeof setInterval> | null = null;
        let latestPrices: Record<string, number> = {};

        setData(loadCachedReportData(symbols));

        // Appends one chart point using the newest prices received from the stream.
        function appendPrices(prices: Record<string, number>): void {
            setData(previous => {
                const lastPoint = previous[previous.length - 1];
                const point: ReportPoint = { time: new Date().toLocaleTimeString("he-IL") };

                selectedCoins.forEach(c => {
                    const symbol = c.symbol.toUpperCase();
                    const current = prices[symbol];
                    const previousValue = lastPoint ? Number(lastPoint[symbol]) : 0;
                    const previousChange = lastPoint ? lastPoint[getChangeKey(symbol)] : 0;

                    if (Number.isFinite(current) && current > 0) {
                        point[symbol] = current;
                        point[getChangeKey(symbol)] = previousValue > 0
                            ? ((current - previousValue) / previousValue) * 100
                            : 0;
                    }
                    else if (previousValue > 0) {
                        point[symbol] = previousValue;

                        if (typeof previousChange === "number") {
                            point[getChangeKey(symbol)] = previousChange;
                        }
                    }
                });

                const next = [...previous, point].slice(-20);
                saveReportData(symbols, next);
                return next;
            });
            setError("");
            failures = 0;
        }

        // Uses REST only as a protected fallback when the stream cannot connect.
        async function fetchRestPrices(): Promise<void> {
            if (document.hidden) return;

            try {
                const prices = await coinService.getPrices(symbols);

                if (!Object.values(prices).some(value => Number.isFinite(Number(value)) && Number(value) > 0)) {
                    throw new Error("No valid prices returned.");
                }

                appendPrices(prices);
            }
            catch (error) {
                failures++;

                const status = (error as { response?: { status?: number } }).response?.status;
                const isRateLimited = status === 429 ||
                    (error instanceof Error && error.message.includes("rate limit cooldown"));
                const isForbidden = status === 403;

                if (isRateLimited || isForbidden) {
                    if (restTimer) clearInterval(restTimer);
                    setError(isForbidden
                        ? "Live updates paused - CoinCap access was denied. Showing the latest saved data."
                        : "Live updates paused - API rate limit reached. Please try again later.");
                    return;
                }

                // Polling stops instead of hammering an API that keeps rejecting the requests,
                // and the data collected so far stays on screen.
                if (failures >= 3) {
                    if (restTimer) clearInterval(restTimer);
                    setError("Live updates paused - API rate limit reached. Please try again later.");
                    return;
                }

                setError("Connection issue - retrying...");
            }
        }

        // Starts the protected REST fallback only after the WebSocket gives up reconnecting.
        function startRestFallback(): void {
            if (restTimer) return;

            void fetchRestPrices();
            restTimer = setInterval(fetchRestPrices, REPORT_POLL_INTERVAL_MS);
        }

        // The stream can send many messages per second, but the chart keeps one readable point per second.
        const chartTimer = setInterval(() => {
            if (document.hidden || Object.keys(latestPrices).length === 0) return;

            const prices = latestPrices;
            latestPrices = {};
            appendPrices(prices);
        }, 1000);

        const stopStream = coinService.subscribeToLivePrices(
            symbols,
            prices => {
                latestPrices = { ...latestPrices, ...prices };
            },
            status => {
                if (status === "open") {
                    if (restTimer) {
                        clearInterval(restTimer);
                        restTimer = null;
                    }
                    setError("");
                }

                if (status === "fallback") startRestFallback();
            }
        );

        return () => {
            clearInterval(chartTimer);
            if (restTimer) clearInterval(restTimer);
            stopStream();
        };

    }, [symbols, selectedCoins]);

    if (selectedCoins.length === 0) {
        return (
            <div className="Reports">
                <h2>Please select coins from the home page</h2>
            </div>
        );
    }

    return (
        <div className="Reports">
            <h2>Live Report (USD)</h2>

            {error && <p className="error">{error}</p>}

            <div className="chart-wrapper">
                <ResponsiveContainer>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="time"
                            interval={0}
                            angle={-38}
                            textAnchor="end"
                            height={72}
                            tickMargin={14}
                            tick={{ fontSize: 10 }}
                        />
                        <YAxis scale="log" domain={["auto", "auto"]} />
                        <Tooltip
                            content={<CoinTooltip data={data} coins={selectedCoins} />}
                        />
                        <Legend content={<CoinLegend coins={selectedCoins} />} />
                        {symbols.map((s, i) =>
                            <Line key={s} type="monotone" dataKey={s} stroke={`var(--line-${i + 1})`} />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
