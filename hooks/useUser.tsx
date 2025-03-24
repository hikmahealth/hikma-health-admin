import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { User } from '../types/User';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

const fetcher = (url: string, token: string) =>
  fetch(url, {
    method: 'GET',
    headers: {
      Authorization: token,
    },
  }).then((res) => res.json());

export function useUser(token: string) {
  const { data, error, mutate } = useSWR<User | null, Error>(
    [`${HIKMA_API}/admin_api/is_authenticated`, token],
    // @ts-ignore
    fetcher
  );

  return {
    user: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useAuthStatus() {
  const [loadingAuth, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    setLoading(true);
    if (token) {
      fetch(`${HIKMA_API}/admin_api/is_authenticated`, {
        method: 'GET',
        headers: {
          Authorization: token,
        },
      })
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          console.log('DATAL ', data);
          if (data && data.message.toLowerCase() === 'ok') {
            setAuthenticated(true);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
      setAuthenticated(false);
    }

    return () => {
      setLoading(true);
      setAuthenticated(false);
    };
  }, []);

  return {
    loadingAuth,
    authenticated,
  };
}
