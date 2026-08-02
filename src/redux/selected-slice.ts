import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Reads the previously selected coins so the switches stay on after the browser is reopened.
function loadFromStorage(): string[] {
    try {
        const saved = localStorage.getItem("selectedCoins");
        const ids: unknown = saved ? JSON.parse(saved) : [];

        return Array.isArray(ids) && ids.every(id => typeof id === "string") ? ids : [];
    }
    catch {
        return [];
    }
}

// Persists the selection, since Redux state alone does not survive a refresh.
function save(ids: string[]): void {
    try {
        localStorage.setItem("selectedCoins", JSON.stringify(ids));
    }
    catch {
        return;
    }
}

// Adds the coin if it is not selected yet, removes it if it already is.
function toggleCoin(currentState: string[], action: PayloadAction<string>): string[] {
    const id = action.payload;

    const newState = currentState.includes(id)
        ? currentState.filter(x => x !== id)
        : [...currentState, id];

    save(newState);
    return newState;
}

// Removes one coin, used by the dialog when replacing a coin at the five coin limit.
function removeCoin(currentState: string[], action: PayloadAction<string>): string[] {
    const newState = currentState.filter(x => x !== action.payload);
    save(newState);
    return newState;
}

export const selectedSlice = createSlice({
    name: "selected",
    initialState: loadFromStorage(),
    reducers: { toggleCoin, removeCoin }
});

export const { toggleCoin: toggleCoinAction, removeCoin: removeCoinAction } = selectedSlice.actions;
