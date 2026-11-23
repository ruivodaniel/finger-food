/**
 * What each chat's pending answer is doing now, by chat id: thinking, or reading data. Held here and not in a hook because
 * the service hears it on the real-time connection, whichever page is open.
 *
 * Only the application service sets it, through the mutations below. A component reads it, bound through a selector.
 */

import { create } from "zustand";
import type { LiveState } from "../shared/helpers/live";

export const useChatLive = create<{ byChat: Record<string, LiveState> }>(() => ({ byChat: {} }));

/** The store's mutations: for the application service only. */
export const chatLive = {
  set: (chatId: string, state: LiveState) => useChatLive.setState((store) => ({ byChat: { ...store.byChat, [chatId]: state } })),
  clear: (chatId: string) =>
    useChatLive.setState((store) => {
      if (!(chatId in store.byChat)) return store;
      const { [chatId]: _cleared, ...rest } = store.byChat;
      return { byChat: rest };
    }),
};
