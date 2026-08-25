import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";
import type { ThemeMode } from "@/theme/tokens";

function getInitialMode(): ThemeMode {
  const stored = localStorage.getItem("scsc-theme-mode");
  return stored === "dark" ? "dark" : "light";
}

const themeSlice = createSlice({
  name: "theme",
  initialState: { mode: getInitialMode() } as { mode: ThemeMode },
  reducers: {
    toggleThemeMode(state) {
      state.mode = state.mode === "light" ? "dark" : "light";
      localStorage.setItem("scsc-theme-mode", state.mode);
    },
  },
});

export const { toggleThemeMode } = themeSlice.actions;
export default themeSlice.reducer;

export const selectThemeMode = (state: RootState) => state.theme.mode;
