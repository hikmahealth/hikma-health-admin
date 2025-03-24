import { Button, Select, TextInput } from '@mantine/core';
import axios from 'axios';
import { upperFirst } from 'lodash';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/Layout';
import { useClinicsList } from '../../hooks/useClinicsList';
import { User } from '../../types/User';
import { userRoles } from './new-user';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

const changePassword = async (email: string, password: string, token: string): Promise<any> => {
  const response = await fetch(`${HIKMA_API}/admin_api/change_password`, {
    method: 'POST',
    headers: {
      Authorization: token,
    },
    body: JSON.stringify({
      email: email,
      new_password: password,
    }),
  });
  return await response.json();
};

export default function EditUser() {
  const router = useRouter();
  const { user: userProps } = router.query;
  const [user, setUser] = useState<User>({
    ...JSON.parse(userProps as string),
  });
  const { clinics, loading: loadingClinics } = useClinicsList();
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log({ user });
  }, []);

  const updateField = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  const confirmResetPassword = () => {
    if (password.length < 4) {
      alert('Password must be at least 4 characters');
      return;
    }
    if (window.confirm("Are you sure you want to reset this user's password?")) {
      const token = localStorage.getItem('token') || '';
      setLoading(true);
      changePassword(user.email, password, token)
        .then((res) => {
          console.log(res);
          setLoading(false);
          alert('Password reset successfully.');
        })
        .catch((e) => {
          console.log(e);
          alert('Error resetting password. Please try again.');
          setLoading(false);
        });
    }
  };

  const confirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to update this user?')) {
      setLoading(true);
      const token = localStorage.getItem('token') || '';
      // calling: /users/<uid>/manage
      axios
        .put(
          `${HIKMA_API}/v1/admin/users/${user.id}/manage`,
          {
            name: user.name.trim(),
            role: user.role.trim(),
            email: user.email.trim().toLowerCase(),
            clinic_id: user.clinic_id,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: token,
            },
          }
        )
        .then((response) => {
          console.log(response.data);
          setLoading(false);
          alert('User updated successfully.');
          router.push('/app/users-list');
        })
        .catch((error) => {
          console.error('Error updating user:', error);
          setLoading(false);
          alert('Error updating user. Please try again.');
        });
    }
  };

  return (
    <AppLayout title="Edit User" isLoading={loadingClinics}>
      <form onSubmit={confirmSubmit}>
        <div className="max-w-md space-y-4">
          <TextInput
            value={user.name}
            onChange={updateField}
            label="Username"
            name="name"
            required
          />
          <Select
            label="User Role"
            required
            value={user.role}
            placeholder="Pick one"
            onChange={(value) => setUser({ ...user, role: value || '' })}
            data={userRoles.map((role) => ({ label: upperFirst(role), value: role }))}
          />

          <Select
            label="Clinic"
            placeholder="Select one"
            required
            value={user.clinic_id}
            onChange={(value) => setUser({ ...user, clinic_id: value || '' })}
            data={clinics.map((clinic) => ({
              value: clinic.id,
              label: upperFirst(clinic.name),
            }))}
          />

          <TextInput
            label="Email"
            value={user.email}
            name="email"
            required
            onChange={updateField}
          />

          <Button onClick={confirmSubmit} loading={loading} fullWidth className="primary">
            Update User
          </Button>
        </div>
      </form>

      <hr className="my-8" />

      {/* Reset Password */}
      <div className="">
        <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
        <div className="max-w-md space-y-4">
          <TextInput
            label="Password"
            name="password"
            value={password}
            required
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <Button onClick={confirmResetPassword} loading={loading} fullWidth className="primary">
            Reset Password
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
