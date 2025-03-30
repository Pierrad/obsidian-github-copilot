import { create } from "zustand";
import { StateCreator } from "zustand";
import { AuthSlice, createAuthSlice } from "./slices/auth";
import { MessageSlice, createMessageSlice } from "./slices/message";

type StoreState = AuthSlice & MessageSlice;

type BoundStateCreator<T> = StateCreator<StoreState, [], [], T>;

const boundAuthSlice: BoundStateCreator<AuthSlice> = (...a) => ({
	...createAuthSlice(...a),
});

const boundMessageSlice: BoundStateCreator<MessageSlice> = (...a) => ({
	...createMessageSlice(...a),
});

export const useCopilotStore = create<StoreState>()((...a) => ({
	...boundAuthSlice(...a),
	...boundMessageSlice(...a),
}));

export const useAuthStore = useCopilotStore;
