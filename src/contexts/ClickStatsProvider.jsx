import React, { createContext, useContext } from 'react';
import { useClickStats } from '../hooks/useClickStats';

const ClickStatsContext = createContext();

export const useClickStatsContext = () => {
  const context = useContext(ClickStatsContext);
  if (!context) {
    throw new Error('useClickStatsContext must be used within ClickStatsProvider');
  }
  return context;
};

export const ClickStatsProvider = ({ children }) => {
  const statsHook = useClickStats();

  return (
    <ClickStatsContext.Provider value={statsHook}>
      {children}
    </ClickStatsContext.Provider>
  );
};
