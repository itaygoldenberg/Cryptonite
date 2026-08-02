import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CoinModel } from "../../../models/coin-model";
import { coinService } from "../../../services/coin-service";
import { initCoinsAction } from "../../../redux/coins-slice";
import type { AppState } from "../../../redux/store";
import { CoinCard } from "../../coins-area/coin-card/coin-card";
import "./home.css";

// Home page showing a card for every coin that matches the search term.
export function Home() {

    const coins = useSelector<AppState, CoinModel[]>(state => state.coins);
    const search = useSelector<AppState, string>(state => state.search);
    const dispatch = useDispatch();

    useEffect(() => {
        if (coins.length > 0) return;

        coinService.getAllCoins()
            .then(all => dispatch(initCoinsAction(all)))
            .catch(() => undefined);
    }, [coins.length, dispatch]);

    const filtered = coins.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.symbol.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="Home">

            <div className="home-heading">
                <div>
                    <span className="home-eyebrow">MARKET WATCH</span>
                    <h2>Market Overview</h2>
                    <p>Top 100 cryptocurrencies by market activity</p>
                </div>
                <span className="home-count">{filtered.length} coins</span>
            </div>

            <div className="coins-list">
                {filtered.map(c => <CoinCard key={c.id} coin={c} />)}
            </div>

        </div>
    );
}
