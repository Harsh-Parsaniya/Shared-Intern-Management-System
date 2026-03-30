import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DeptState {
  deptId: string;
  deptName: string;
  userId: string;
}

const initialState: DeptState = {
  deptId: "",
  deptName: "",
  userId: "",
};

const deptSlice = createSlice({
  name: "dept",
  initialState,
  reducers: {
    setDeptData(state, action: PayloadAction<Partial<DeptState>>) {
      return { ...state, ...action.payload };
    },
    clearDeptData() {
      return initialState;
    },
  },
});

export const { setDeptData, clearDeptData } = deptSlice.actions;
export default deptSlice.reducer;
