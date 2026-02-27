"use client";

import { createContext, useContext } from "react";

interface ViewAsGuestContextType {
    viewAsGuest: boolean;
}

const ViewAsGuestContext = createContext<ViewAsGuestContextType>({ viewAsGuest: false });

export const ViewAsGuestProvider = ViewAsGuestContext.Provider;
export const useViewAsGuest = () => useContext(ViewAsGuestContext);
