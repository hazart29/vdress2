import React, { createContext, useContext, useState } from 'react';

const RefreshContext = createContext<{ refresh: () => void }>({ refresh: () => {} });

export const RefreshProvider = ({ children }: { children: React.ReactNode }) => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <RefreshContext.Provider value={{ refresh }}>
            {children}
        </RefreshContext.Provider>
    );
};

export const useRefresh = () => {
    return useContext(RefreshContext);
};