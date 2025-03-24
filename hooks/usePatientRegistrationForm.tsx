import axios from 'axios';
import { useEffect, useState } from 'react';
import { RegistrationForm } from '../pages/app/patients/registration-form';
import { mapObjectValues } from '../utils/misc';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

/**
Data hook for easily loading the patient registration form
*/
export function usePatientRegistrationForm(): {
  form: RegistrationForm | null;
  isLoading: boolean;
  refresh: () => void;
} {
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [loadingForm, setLoadingForm] = useState(true);

  function fetchData() {
    return axios.get(`${HIKMA_API}/admin_api/get_patient_registration_forms`, {
      headers: {
        Authorization: String(localStorage.getItem('token')),
      },
    });
  }

  useEffect(() => {
    fetchData()
      .then((res) => {
        console.log({ forms: res.data });
        const { forms } = res.data;
        if (forms.length < 1) {
          return console.warn('There are no forms in the database');
        } else if (forms.length > 1) {
          console.warn('There are more than one forms in the database');
        }
        const form = forms[0] as unknown as RegistrationForm;
        // TODO: Extract out code for converting db object into usable object for re-use in the mobile client
        const savedForm: RegistrationForm = {
          id: form.id,
          name: decodeURI(form.name),
          fields: form.fields.map((field) => ({
            ...field,
            label: mapObjectValues(field.label, decodeURI),
            options: field.options.map((opt) => mapObjectValues(opt, decodeURI)),
            column: decodeURI(field.column),
          })),
          createdAt: form.createdAt,
          updatedAt: form.updatedAt,
          metadata: form.metadata,
        };

        setForm(savedForm);
      })
      .catch((error) => {
        console.error(error);
        setForm(null);
      })
      .finally(() => {
        setLoadingForm(false);
      });
  }, []);

  return {
    form,
    isLoading: loadingForm,
    refresh: fetchData,
  };
}
