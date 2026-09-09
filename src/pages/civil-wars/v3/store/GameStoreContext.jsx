import { createContext, useContext } from "react";
import useGameStore from "./useGameStore.js";

export const GameStoreContext = createContext(useGameStore);

export function useActiveGameStore(selector) {
  const store = useContext(GameStoreContext);
  return store(selector);
}
