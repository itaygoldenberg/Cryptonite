import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { CoinModel } from "../../../models/coin-model";
import { removeCoinAction, toggleCoinAction } from "../../../redux/selected-slice";
import type { AppState } from "../../../redux/store";
import "./limit-dialog.css";

interface LimitDialogProps {
    onClose: () => void;
    newCoinId: string;
}

// Dialog shown when a sixth coin is selected, letting the user swap it with a selected one.
export function LimitDialog(props: LimitDialogProps) {

    const coins = useSelector<AppState, CoinModel[]>(state => state.coins);
    const selected = useSelector<AppState, string[]>(state => state.selected);
    const dispatch = useDispatch();

    const selectedCoins = coins.filter(c => selected.includes(c.id));

    // Removes the chosen coin before adding the new one, so the limit is never exceeded.
    function replaceCoin(oldId: string) {
        dispatch(removeCoinAction(oldId));
        dispatch(toggleCoinAction(props.newCoinId));
        props.onClose();
    }

    // The dialog is rendered into the body, because the card around it uses transform and
    // backdrop-filter, and those turn a fixed position into a position inside the card.
    return createPortal(
        <div className="LimitDialog">
            <div className="dialog-box">
                <h3>You can select up to 5 coins</h3>
                <p>Choose a coin to remove:</p>

                {selectedCoins.map(c =>
                    <button key={c.id} onClick={() => replaceCoin(c.id)}>
                        {c.symbol.toUpperCase()} - {c.name}
                    </button>
                )}

                <button className="cancel" onClick={props.onClose}>Cancel</button>
            </div>
        </div>,
        document.body
    );
}
