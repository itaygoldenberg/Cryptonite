import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CoinModel } from "../../../models/coin-model";
import { CoinDetailsModel } from "../../../models/coin-details-model";
import { coinService } from "../../../services/coin-service";
import { toggleCoinAction } from "../../../redux/selected-slice";
import type { AppState } from "../../../redux/store";
import { LimitDialog } from "../limit-dialog/limit-dialog";
import "./coin-card.css";

interface CoinCardProps {
    coin: CoinModel;
}

// A single coin card showing its icon, symbol, name, More Info button and tracking switch.
export function CoinCard(props: CoinCardProps) {

    const [isOpen, setIsOpen] = useState(false);
    const [details, setDetails] = useState<CoinDetailsModel>();
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState("");
    const [showDialog, setShowDialog] = useState(false);

    const selected = useSelector<AppState, string[]>(state => state.selected);
    const dispatch = useDispatch();

    const isSelected = selected.includes(props.coin.id);

    // Selects or unselects the coin, and blocks a sixth selection by opening the dialog.
    function handleToggle() {

        if (isSelected) {
            dispatch(toggleCoinAction(props.coin.id));
            return;
        }

        if (selected.length >= 5) {
            setShowDialog(true);
            return;
        }

        dispatch(toggleCoinAction(props.coin.id));
    }

    // Opens or closes the price panel, fetching the prices only on the first open.
    async function toggleInfo() {

        if (isOpen) {
            setIsOpen(false);
            return;
        }

        if (!details) {
            try {
                setDetailsLoading(true);
                setDetailsError("");
                const data = await coinService.getCoinDetails(props.coin.id);
                setDetails(data);
            }
            catch {
                setDetailsError("Could not load prices right now.");
            }
            finally {
                setDetailsLoading(false);
            }
        }

        setIsOpen(true);
    }

    return (
        <div className="CoinCard">
            <img src={props.coin.image} alt={props.coin.name} />
            <span className="symbol">{props.coin.symbol.toUpperCase()}</span>
            <span className="name">{props.coin.name}</span>

            <button onClick={toggleInfo} disabled={detailsLoading}>
                {detailsLoading ? "Loading..." : isOpen ? "Less Info" : "More Info"}
            </button>

            <label className="switch">
                <input type="checkbox" checked={isSelected} onChange={handleToggle} />
            </label>

            {isOpen && details && <div className="details">
                <span>$ {details.usd}</span>
                <span>€ {details.eur}</span>
                <span>₪ {details.ils}</span>
            </div>}

            {detailsError && <p className="details-error">{detailsError}</p>}

            {showDialog && <LimitDialog
                onClose={() => setShowDialog(false)}
                newCoinId={props.coin.id}
            />}

        </div>
    );
}
