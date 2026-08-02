import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CoinModel } from "../../../models/coin-model";
import { AiAdviceModel } from "../../../models/ai-advice-model";
import { coinService } from "../../../services/coin-service";
import { aiService } from "../../../services/ai-service";
import { initCoinsAction } from "../../../redux/coins-slice";
import type { AppState } from "../../../redux/store";
import "./ai-advice.css";

// AI page listing the selected coins and returning a ChatGPT recommendation for one of them.
export function AiAdvice() {

    const coins = useSelector<AppState, CoinModel[]>(state => state.coins);
    const selected = useSelector<AppState, string[]>(state => state.selected);
    const dispatch = useDispatch();

    const [advice, setAdvice] = useState<AiAdviceModel | null>(null);
    const [loadingId, setLoadingId] = useState("");
    const [error, setError] = useState("");

    const selectedCoins = coins.filter(c => selected.includes(c.id));

    useEffect(() => {
        if (coins.length > 0) return;

        coinService.getAllCoins()
            .then(all => dispatch(initCoinsAction(all)))
            .catch(() => undefined);
    }, [coins.length, dispatch]);

    // Fetches the coin market data and asks ChatGPT whether the coin is worth buying.
    async function askAi(id: string) {
        try {
            setLoadingId(id);
            setAdvice(null);
            setError("");

            const coinData = await coinService.getCoinDataForAi(id);
            const result = await aiService.getAdvice(coinData);

            setAdvice(result);
        }
        catch {
            setError("Could not get advice right now. Please try again later.");
        }
        finally {
            setLoadingId("");
        }
    }

    if (selectedCoins.length === 0) {
        return (
            <div className="AiAdvice">
                <h2>Please select coins from the home page</h2>
            </div>
        );
    }

    return (
        <div className="AiAdvice">

            <h2>AI Advice</h2>

            <div className="coins-row">
                {selectedCoins.map(c =>
                    <div key={c.id} className="ai-coin">
                        <img src={c.image} alt={c.name} />
                        <span>{c.name}</span>
                        <button onClick={() => askAi(c.id)} disabled={loadingId === c.id}>
                            {loadingId === c.id ? "Thinking..." : "Get Advice"}
                        </button>
                    </div>
                )}
            </div>

            {error && <p className="error">{error}</p>}

            {advice &&
                <div className="advice-box">
                    <h3>{advice.recommendation}</h3>
                    <p>{advice.explanation}</p>
                </div>
            }

        </div>
    );
}
