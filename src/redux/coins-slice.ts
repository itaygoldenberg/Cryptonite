import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { CoinModel } from "../models/coin-model";

// Stores the coin list once, so moving between pages does not trigger another request.
function initCoins(_currentState: CoinModel[], action: PayloadAction<CoinModel[]>): CoinModel[] {
    return action.payload;
}

export const coinsSlice = createSlice({
    name: "coins",
    initialState: [] as CoinModel[],
    reducers: { initCoins }
});

export const { initCoins: initCoinsAction } = coinsSlice.actions;
