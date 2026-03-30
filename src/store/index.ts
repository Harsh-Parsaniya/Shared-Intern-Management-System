import { configureStore } from "@reduxjs/toolkit";
import internReducer from "./intern-slice";
import deptReducer from "./dept-slice";

export const store = configureStore({
  reducer: {
    intern: internReducer,
    dept: deptReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
