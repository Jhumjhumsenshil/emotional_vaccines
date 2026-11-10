import { useState, useCallback } from 'react';

export function useFilters(initialState = {}) {
  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    platform: 'All',
    sort: 'recent',
    ...initialState
  });

  const setSearch = useCallback((search) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const setCategory = useCallback((category) => {
    setFilters(prev => ({ ...prev, category }));
  }, []);

  const setPlatform = useCallback((platform) => {
    setFilters(prev => ({ ...prev, platform }));
  }, []);

  const setSort = useCallback((sort) => {
    setFilters(prev => ({ ...prev, sort }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      category: 'All',
      platform: 'All',
      sort: 'recent'
    });
  }, []);

  return {
    filters,
    setFilters,
    setSearch,
    setCategory,
    setPlatform,
    setSort,
    resetFilters
  };
}

export default useFilters;
