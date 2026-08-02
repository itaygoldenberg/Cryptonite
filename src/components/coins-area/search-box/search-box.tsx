import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { CoinModel } from "../../../models/coin-model";
import { coinService } from "../../../services/coin-service";
import { initCoinsAction } from "../../../redux/coins-slice";
import { setSearchAction } from "../../../redux/search-slice";
import type { AppState } from "../../../redux/store";
import "./search-box.css";

// Navbar search field, updating the shared search term on every keystroke.
export function SearchBox() {

    const search = useSelector<AppState, string>(state => state.search);
    const coins = useSelector<AppState, CoinModel[]>(state => state.coins);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        if (coins.length > 0) return;

        coinService.getAllCoins()
            .then(all => dispatch(initCoinsAction(all)))
            .catch(() => undefined);
    }, [coins.length, dispatch]);

    const results = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return [];

        return coins.filter(coin =>
            coin.name.toLowerCase().includes(term) ||
            coin.symbol.toLowerCase().includes(term)
        ).slice(0, 8);
    }, [coins, search]);

    // Selects a result and opens its filtered card list on Home.
    function selectResult(coin: CoinModel): void {
        dispatch(setSearchAction(coin.symbol));
        setShowResults(false);

        if (location.pathname !== "/home") {
            navigate("/home");
        }
    }

    return (
        <div className="SearchBox">
            <input
                type="text"
                placeholder="Search coin..."
                value={search}
                onFocus={() => setShowResults(true)}
                onChange={e => {
                    dispatch(setSearchAction(e.target.value));
                    setShowResults(true);
                }}
            />

            {showResults && search.trim() &&
                <div className="search-results" role="listbox">
                    {results.map(coin =>
                        <button
                            className="search-result"
                            key={coin.id}
                            type="button"
                            onClick={() => selectResult(coin)}
                        >
                            <img src={coin.image} alt="" />
                            <span>
                                <strong>{coin.symbol.toUpperCase()}</strong>
                                <small>{coin.name}</small>
                            </span>
                        </button>
                    )}

                    {results.length === 0 && <p className="search-empty">No coins found</p>}
                </div>
            }
        </div>
    );
}
