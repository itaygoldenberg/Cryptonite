import { configureStore } from "@reduxjs/toolkit";
import { coinsSlice } from "./coins-slice";
import { selectedSlice } from "./selected-slice";
import { searchSlice } from "./search-slice";

// The single global store holding the coin list, the selected coins and the search term.
export const store = configureStore({
    reducer: {
        coins: coinsSlice.reducer,
        selected: selectedSlice.reducer,
        search: searchSlice.reducer
    }
});

export type AppState = ReturnType<typeof store.getState>;
