import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { AiAdviceModel } from "../../../models/ai-advice-model";
import { CoinModel } from "../../../models/coin-model";
import { aiService } from "../../../services/ai-service";
import { coinService } from "../../../services/coin-service";
import { initCoinsAction } from "../../../redux/coins-slice";
import type { AppState } from "../../../redux/store";
import "./ai-advice-widget.css";

interface AiAdviceWidgetProps {
    open: boolean;
    onOpen: () => void;
    onClose: () => void;
}

// Floating AI assistant showing advice for the coins selected on Home.
export function AiAdviceWidget(props: AiAdviceWidgetProps) {

    const coins = useSelector<AppState, CoinModel[]>(state => state.coins);
    const selected = useSelector<AppState, string[]>(state => state.selected);
    const dispatch = useDispatch();

    const [activeCoinId, setActiveCoinId] = useState("");
    const [advice, setAdvice] = useState<AiAdviceModel | null>(null);
    const [loadingId, setLoadingId] = useState("");
    const [error, setError] = useState("");

    const selectedCoins = useMemo(
        () => coins.filter(coin => selected.includes(coin.id)),
        [coins, selected]
    );
    const activeCoin = selectedCoins.find(coin => coin.id === activeCoinId);

    useEffect(() => {
        if (coins.length > 0) return;

        coinService.getAllCoins()
            .then(all => dispatch(initCoinsAction(all)))
            .catch(() => undefined);
    }, [coins.length, dispatch]);

    useEffect(() => {
        if (selectedCoins.length === 0) {
            setActiveCoinId("");
            return;
        }

        if (!selectedCoins.some(coin => coin.id === activeCoinId)) {
            setActiveCoinId(selectedCoins[0].id);
        }
    }, [activeCoinId, selectedCoins]);

    useEffect(() => {
        if (!props.open || !activeCoinId) return;
        askAi(activeCoinId);
    }, [activeCoinId, props.open]);

    // Loads market data and asks the AI for the selected coin.
    async function askAi(id: string): Promise<void> {
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

    // Selects a coin and refreshes its advice when it is selected again.
    function selectCoin(coin: CoinModel): void {
        setActiveCoinId(coin.id);

        if (coin.id === activeCoinId) {
            askAi(coin.id);
        }
    }

    return (
        <div className="AiAdviceWidget">
            {!props.open &&
                <button className="ai-launcher" type="button" onClick={props.onOpen}>
                    <span className="ai-launcher-icon">AI</span>
                    <span>AI Advice</span>
                    <span className="ai-launcher-dot" />
                </button>
            }

            {props.open &&
                <section className="ai-popup" aria-label="AI Advice chat">
                    <header className="ai-popup-header">
                        <div className="ai-popup-title">
                            <span className="ai-launcher-icon">AI</span>
                            <span>
                                <strong>AI Advice</strong>
                                <small>Market assistant</small>
                            </span>
                        </div>
                        <div className="ai-popup-header-actions">
                            <span className="ai-status"><span /> Online</span>
                            <button className="ai-popup-close" type="button" onClick={props.onClose} aria-label="Close AI Advice">
                                x
                            </button>
                        </div>
                    </header>

                    {selectedCoins.length === 0 &&
                        <div className="ai-popup-empty">
                            <strong>No coins selected</strong>
                            <span>Select up to five coins on Home to start.</span>
                        </div>
                    }

                    {selectedCoins.length > 0 &&
                        <>
                            <div className="ai-popup-coins">
                                {selectedCoins.map(coin =>
                                    <button
                                        className={`ai-popup-coin ${coin.id === activeCoinId ? "active" : ""}`}
                                        key={coin.id}
                                        type="button"
                                        onClick={() => selectCoin(coin)}
                                    >
                                        <img src={coin.image} alt="" />
                                        <span>{coin.symbol.toUpperCase()}</span>
                                    </button>
                                )}
                            </div>

                            {activeCoin &&
                                <div className="ai-chat-content">
                                    <div className="ai-chat-coin">
                                        <img src={activeCoin.image} alt={activeCoin.name} />
                                        <span>
                                            <strong>{activeCoin.name}</strong>
                                            <small>{activeCoin.symbol.toUpperCase()} analysis</small>
                                        </span>
                                    </div>

                                    <div className="ai-user-message">
                                        Review {activeCoin.symbol.toUpperCase()} and give me a market outlook.
                                    </div>

                                    {loadingId === activeCoin.id &&
                                        <div className="ai-loading" aria-live="polite">
                                            <span className="ai-loading-avatar">AI</span>
                                            <span className="ai-loading-content">
                                                <strong>Reviewing {activeCoin.symbol.toUpperCase()}</strong>
                                                <span className="ai-loading-dots"><i /><i /><i /></span>
                                                <span className="ai-loading-line line-wide" />
                                                <span className="ai-loading-line line-short" />
                                            </span>
                                        </div>
                                    }

                                    {error && <p className="ai-widget-error">{error}</p>}

                                    {advice && loadingId === "" &&
                                        <div className="ai-widget-advice">
                                            <span className="ai-response-label">AI market outlook</span>
                                            <strong>{advice.recommendation}</strong>
                                            <p>{advice.explanation}</p>
                                        </div>
                                    }
                                </div>
                            }
                        </>
                    }

                    <Link className="ai-full-link" to="/ai-advice" onClick={props.onClose}>
                        Full AI Advice
                    </Link>
                </section>
            }
        </div>
    );
}
