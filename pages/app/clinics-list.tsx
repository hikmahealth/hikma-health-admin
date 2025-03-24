import { Button, Loader, Table } from '@mantine/core';
import { IconCircleMinus, IconEdit } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import { FAB } from '../../components/FAB';
import AppLayout from '../../components/Layout';
import { Clinic, useClinicsList } from '../../hooks/useClinicsList';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

const deleteClinic = async (id: string, token: string): Promise<Clinic> => {
  const response = await fetch(`${HIKMA_API}/v1/admin/clinics/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: token,
    },
  });
  if (!response.ok) {
    const error = await response.json();
    return Promise.reject(error);
  }
  return await response.json();
};

export default function UsersList() {
  const router = useRouter();
  const { clinics, loading, refresh } = useClinicsList();

  const openRegisterClinicForm = () => {
    router.push('/app/new-clinic');
  };

  const confirmDelete = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this clinic?')) return;
    const token = localStorage.getItem('token');
    if (token) {
      deleteClinic(id, token)
        .then((res) => {
          console.log(res);
          refresh();
        })
        .catch((err) => console.log(err));
    }
  };

  const ths = (
    <Table.Tr>
      <Table.Th>ID</Table.Th>
      <Table.Th style={{ width: '60%' }}>Name</Table.Th>
      <Table.Th>Actions</Table.Th>
    </Table.Tr>
  );

  const editClinic = (clinic: Clinic) =>
    router.push({
      pathname: `/app/new-clinic`,
      query: { id: clinic.id },
    });

  // /app/new-clinic
  // app/new-clinic

  const rows = clinics.map((clinic) => (
    <Table.Tr key={clinic.id}>
      <Table.Td>{clinic.id}</Table.Td>
      <Table.Td>{clinic.name}</Table.Td>
      <Table.Td>
        <div className="flex gap-4">
          {/* Clinic deletion is disabled for now */}
          {/* <ActionIcon variant="transparent" onClick={() => confirmDelete(clinic.id)}>
            <IconTrash size="1rem" color="red" />
          </ActionIcon> */}
          <Button
            leftSection={<IconEdit size="1rem" />}
            variant="transparent"
            onClick={() => editClinic(clinic)}
          >
            Edit
          </Button>
          <Button
            leftSection={<IconCircleMinus size="1rem" />}
            variant="transparent"
            onClick={() => confirmDelete(clinic.id)}
            style={{ color: '#e60000' }}
          >
            Delete
          </Button>
        </div>
      </Table.Td>
    </Table.Tr>
  ));
  return (
    <>
      <AppLayout title="Clinics List">
        <div>
          <Table striped highlightOnHover>
            <Table.Thead>{ths}</Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </div>
        <div className="flex justify-center my-6 w-full">{loading && <Loader size="xl" />}</div>
      </AppLayout>
      <FAB onClick={openRegisterClinicForm} />
    </>
  );
}
