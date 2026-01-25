'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SearchParams {
  q?: string;
  category?: string;
  location?: string;
  page?: string;
  pageSize?: string;
}

interface SearchParamsContextType {
  params: SearchParams;
  updateParams: (updates: Partial<SearchParams>) => void;
  resetParams: () => void;
}

const SearchParamsContext = createContext<SearchParamsContextType | undefined>(undefined);

interface SearchParamsProviderProps {
  children: ReactNode;
  initialParams: SearchParams;
}

export function SearchParamsProvider({ children, initialParams }: SearchParamsProviderProps) {
  const [params, setParams] = useState<SearchParams>(initialParams);

  const updateParams = (updates: Partial<SearchParams>) => {
    setParams(prev => ({ ...prev, ...updates, page: '1' })); // Reset to page 1 when filters change
  };

  const resetParams = () => {
    setParams({});
  };

  return (
    <SearchParamsContext.Provider value={{ params, updateParams, resetParams }}>
      {children}
    </SearchParamsContext.Provider>
  );
}

export function useSearchParams() {
  const context = useContext(SearchParamsContext);
  if (context === undefined) {
    throw new Error('useSearchParams must be used within a SearchParamsProvider');
  }
  return context;
}