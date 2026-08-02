import { CoinModel } from "../../../models/coin-model";
import { getChangeKey } from "./report-cache";
import type { ReportPoint } from "./report-cache";

type CoinTooltipProps = {
    active?: boolean;
    payload?: any[];
    data: ReportPoint[];
    coins: CoinModel[];
};

type CoinLegendProps = {
    payload?: any[];
    coins: CoinModel[];
};

export function CoinTooltip({ active, payload, data, coins }: CoinTooltipProps) {
    if (!active || !payload || payload.length === 0) return null;

    const point = payload[0].payload as ReportPoint;
    const pointIndex = data.indexOf(point);
    const previousPoint = data[pointIndex - 1];

    return (
        <div className="coin-tooltip">
            <p className="tooltip-time">{point.time}</p>

            {payload.map(item => {
                const coin = coins.find(c => c.symbol.toUpperCase() === item.dataKey);
                const current = Number(point[item.dataKey]);
                const previous = previousPoint ? Number(previousPoint[item.dataKey]) : 0;
                const hasChange = previous > 0 && current > 0;
                const savedChange = point[getChangeKey(item.dataKey)];
                const change = typeof savedChange === "number"
                    ? savedChange
                    : hasChange ? ((current - previous) / previous) * 100 : 0;
                const trendClass = change >= 0 ? "positive" : "negative";
                const changeText = Math.abs(change) < 0.01 ? change.toFixed(4) : change.toFixed(2);

                return (
                    <div className="tooltip-coin" key={item.dataKey}>
                        <span className="tooltip-identity">
                            {coin && <img src={coin.image} alt="" />}
                            <span>{coin?.symbol.toUpperCase() ?? item.dataKey}</span>
                        </span>
                        <strong>${current.toFixed(2)}</strong>
                        {hasChange &&
                            <small className={trendClass}>
                                {change >= 0 ? "+" : ""}{changeText}%
                            </small>
                        }
                    </div>
                );
            })}
        </div>
    );
}

export function CoinLegend({ payload, coins }: CoinLegendProps) {
    if (!payload) return null;

    return (
        <div className="coin-legend">
            {payload.map((item, index) => {
                const coin = coins.find(c => c.symbol.toUpperCase() === item.dataKey);

                return (
                    <span className={"coin-legend-item series-" + (index + 1)} key={item.dataKey}>
                        {coin && <img src={coin.image} alt="" />}
                        <span className="legend-color" />
                        <span>{coin?.symbol.toUpperCase() ?? item.dataKey}</span>
                    </span>
                );
            })}
        </div>
    );
}
