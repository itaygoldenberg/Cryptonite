import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Holds the search term, shared between the SearchBox in the navbar and the Home page.
function setSearch(_currentState: string, action: PayloadAction<string>): string {
    return action.payload;
}

export const searchSlice = createSlice({
    name: "search",
    initialState: "",
    reducers: { setSearch }
});

export const { setSearch: setSearchAction } = searchSlice.actions;
