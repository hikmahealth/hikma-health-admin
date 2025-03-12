import { Button, Select, TextInput } from '@mantine/core';
import axios from 'axios';
import { upperFirst } from 'lodash';
import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/Layout';
import { User } from '../../types/User';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

const addUser = async (user: User & { password: string }, token: string): Promise => {
  const response = await fetch(`${HIKMA_API}/admin_api/user`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: user.name,
      role: user.role.toLowerCase(),
      email: user.email,
      clinic_id: user.clinic_id,
      password: user.password,
    }),
  });
  // TODO: Handle non ok response
  const result = await response.json();
  return result;
};

export const userRoles = ['provider', 'admin'];

type Clinic = {
  id: string;
  name: string;
};

export default function NewUser() {
  const [user, setUser] = useState<User & { password: string }>({
    id: '',
    name: '',
    role: 'admin',
    email: '',
    clinic_id: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [clinics, setClinics] = useState<Clinic[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    axios
      .get(`${HIKMA_API}/admin_api/get_clinics`, {
        headers: {
          Authorization: String(token),
        },
      })
      .then((res) => {
        console.log(res.data);
        setClinics(res.data?.clinics || []);
      })
      .catch((error) => console.error(error));
  }, []);

  const updateField = (e: React.ChangeEvent) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  const confirmSubmit = async (e: any) => {
    e.preventDefault();
    if (loading) {
      return;
    }
    if (!user.name || !user.role || !user.email || !user.password) {
      return;
    }
    setLoading(true);
    const token = localStorage.getItem('token');
    if (token) {
      await addUser(user, token).then((result) => {
        console.log(result);
        alert('User registered successfully.');
        setUser({
          id: '',
          name: '',
          role: 'Admin',
          email: '',
          clinic_id: '',
          password: '',
        });
      });
    }
    setLoading(false);
  };

  return (
    <AppLayout title="New User">
      <form onSubmit={confirmSubmit}>
        <div className="max-w-md space-y-4">
          <TextInput onChange={updateField} label="Username" name="name" required />
          <Select
            label="User Role"
            placeholder="Pick one"
            onChange={(value) => setUser({ ...user, role: value || '' })}
            data={userRoles.map((role) => ({ label: upperFirst(role), value: role }))}
          />
          <Select
            label="Clinic"
            placeholder="Select one"
            onChange={(value) => setUser({ ...user, clinic_id: value || '' })}
            data={clinics.map((clinic) => ({
              value: clinic.id,
              label: upperFirst(clinic.name),
            }))}
          />
          <TextInput label="Email" name="email" required onChange={updateField} />
          <TextInput label="Password" name="password" required onChange={updateField} />

          <Button onClick={confirmSubmit} loading={loading} fullWidth className="primary">
            Submit
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
