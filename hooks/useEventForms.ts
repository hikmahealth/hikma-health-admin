import { useCallback, useEffect, useState } from 'react';
import { getAllForms } from '../pages/app/forms-list';
import { HHForm } from '../types/Inputs';

/**
 * Hook that fetches all event forms from the database
 *
 * @returns {{forms: HHForm[], isLoading: boolean, refetch: () => void}}
 */
export function useEventForms(): {
  forms: HHForm[];
  isLoading: boolean;
  refetch: () => void;
} {
  const [forms, setForms] = useState<HHForm[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getAllForms(token).then((forms) => {
        setForms(forms as unknown as HHForm[]);
        setIsLoading(false);
      });
    }
  }, []);

  const refetch = useCallback(() => {
    const token = localStorage.getItem('token');
    if (token) {
      return getAllForms(token).then((forms) => {
        setForms(forms as unknown as HHForm[]);
        setIsLoading(false);
      });
    }
  }, []);
  return {
    forms,
    isLoading,
    refetch,
  };
}
