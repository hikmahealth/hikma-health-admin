import { useEffect, useState } from 'react';
import { camelCaseKeys } from '../utils/misc';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

export type Clinic = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Hook to get the clinics list
 * @returns
 */
export function useClinicsList(): { clinics: Clinic[]; loading: boolean; refresh: () => void } {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAndSetClinics = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      getClinics(token)
        .then((clinics) => {
          setClinics(clinics.map((clinic) => camelCaseKeys(clinic) as Clinic));
          setLoading(false);
        })
        .catch((err) => console.log(err));
    }
  };

  useEffect(() => {
    fetchAndSetClinics();
  }, []);

  return { clinics, loading, refresh: fetchAndSetClinics };
}

const getClinics = async (token: string): Promise<Clinic[]> => {
  const response = await fetch(`${HIKMA_API}/v1/admin/clinics`, {
    method: 'GET',
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(error);
    return Promise.resolve([]);
  }

  const result = await response.json();
  return result.clinics;
};
