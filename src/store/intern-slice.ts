import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface InternState {
  userId: string;
  name: string;
  email: string;
  department: string;
  collegeName: string;
  startDate: string;
  endDate: string;
  internId: string;
}

const initialState: InternState = {
  userId: "",
  name: "",
  email: "",
  department: "",
  collegeName: "",
  startDate: "",
  endDate: "",
  internId: "",
};

const internSlice = createSlice({
  name: "intern",
  initialState,
  reducers: {
    setInternData(state, action: PayloadAction<Partial<InternState>>) {
      return { ...state, ...action.payload };
    },
    clearInternData() {
      return initialState;
    },
  },
});

export const { setInternData, clearInternData } = internSlice.actions;
export default internSlice.reducer;
