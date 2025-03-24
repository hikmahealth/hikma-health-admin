import { Box, Button, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '../../components/Layout';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

type Clinic = {
  id: string;
  name: string;
};

/**
 * Update clinic
 * @param id
 * @param token
 * @param name
 * @returns
 */
const updateClinic = async (id: string, token: string, name: string): Promise<Clinic> => {
  try {
    const response = await axios.put(
      `${HIKMA_API}/v1/admin/clinics/${id}`,
      {
        id,
        name,
      },
      {
        headers: {
          Authorization: token,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
};

export default function RegisterClinic() {
  const router = useRouter();
  const { id } = router.query;
  const [loadingSubmission, setLoadingSubmission] = useState(false);
  const [isLoadingClinic, setIsLoadingClinic] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<Clinic>({
    mode: 'controlled',
    initialValues: {
      id: '',
      name: '',
    },

    validate: {
      name: (value) => (value.trim().length < 3 ? 'Name must be at least 3 characters long' : null),
    },
  });

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      // Fetch clinic data and populate form
      fetchClinicData(id as string);
    } else {
      setIsEditing(false);
      setIsLoadingClinic(false);
    }
  }, [id]);

  const fetchClinicData = async (clinicId: string) => {
    try {
      setIsLoadingClinic(true);
      const response = await axios.get(`${HIKMA_API}/v1/admin/clinics/${clinicId}`, {
        headers: {
          Authorization: String(localStorage.getItem('token')),
        },
      });

      if (response.data && response.data.clinic) {
        form.setValues(response.data.clinic);
      } else {
        alert('Clinic not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching clinic data:', error);
      alert('Error fetching clinic data');
      router.back();
    } finally {
      setIsLoadingClinic(false);
    }
  };

  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (values: Clinic) => {
    try {
      setLoadingSubmission(true);
      if (isEditing) {
        await updateClinic(values.id, String(localStorage.getItem('token')), values.name.trim());
        alert('Clinic updated successfully');
      } else {
        await axios.post(`${HIKMA_API}/v1/admin/clinics`, values, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: String(localStorage.getItem('token')),
          },
        });
        alert('Clinic created successfully');
      }
      setLoadingSubmission(false);
      router.push('/app/clinics-list');
    } catch (error) {
      console.error(error);
      alert(`Error ${isEditing ? 'updating' : 'creating'} clinic`);
      setLoadingSubmission(false);
    }
  };

  return (
    <AppLayout title="Register Clinic" isLoading={isLoadingClinic}>
      <form onSubmit={form.onSubmit(handleSubmit)} ref={formRef}>
        <Box style={{ maxWidth: 500 }} className="space-y-4">
          <TextInput label="Name" {...form.getInputProps('name')} />

          <Button type="submit" loading={loadingSubmission} className="primary" fullWidth>
            Submit
          </Button>
        </Box>
      </form>
    </AppLayout>
  );
}
