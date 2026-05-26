import { useEffect, useRef, useState } from 'react';
import type { UserSearchResponse } from '../../shared/api';

type UserSuggestion = {
  username: string;
  karma?: number;
  accountAgeDays?: number;
};

type UseUserAutocompleteOptions = {
  query: string;
  enabled?: boolean;
};

type CacheEntry = {
  users: UserSuggestion[];
  createdAt: number;
};

const MAX_CACHE_SIZE = 50;

const normalizeQuery = (value: string) =>
  value.replace(/^u\//i, '').trim();

export const useUserAutocomplete = ({ query, enabled = true }: UseUserAutocompleteOptions) => {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      setActiveIndex(-1);
      return;
    }

    const trimmed = query.trim();
    const normalized = normalizeQuery(trimmed);
    if (!normalized) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      setActiveIndex(-1);
      return;
    }

    const cacheKey = normalized.toLowerCase();
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setSuggestions(cached.users);
      setIsOpen(true);
      setIsLoading(false);
      setActiveIndex(-1);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);
    setIsOpen(true);
    setActiveIndex(-1);

    const timeoutId = window.setTimeout(async () => {
      try {
        console.log('[RuleWatch] autocomplete query', {
          raw: trimmed,
          normalized,
        });
        const response = await fetch(
          `/api/user-search?q=${encodeURIComponent(normalized)}`
        );
        if (!response.ok) {
          throw new Error('Failed to load suggestions');
        }
        const data = (await response.json()) as UserSearchResponse;
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        console.log('[RuleWatch] autocomplete results', data.users ?? []);
        const users = (data.users ?? []).slice(0, 5).map((username) => {
          const meta = data.meta?.[username];
          return {
            username,
            karma: meta?.karma,
            accountAgeDays: meta?.accountAgeDays,
          } as UserSuggestion;
        });

        cacheRef.current.set(cacheKey, { users, createdAt: Date.now() });
        if (cacheRef.current.size > MAX_CACHE_SIZE) {
          const oldestKey = Array.from(cacheRef.current.entries()).sort(
            (a, b) => a[1].createdAt - b[1].createdAt
          )[0]?.[0];
          if (oldestKey) {
            cacheRef.current.delete(oldestKey);
          }
        }

        setSuggestions(users);
      } catch {
        if (currentRequestId === requestIdRef.current) {
          setSuggestions([]);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [enabled, query]);

  return {
    suggestions,
    isOpen,
    isLoading,
    activeIndex,
    setActiveIndex,
    setIsOpen,
  };
};
