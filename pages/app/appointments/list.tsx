import { Box, Button, Flex, Select, Table } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { endOfDay, format, startOfDay } from 'date-fns';
import { useState } from 'react';
import AppLayout from '../../../components/Layout';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

import axios from 'axios';
import { upperFirst } from 'lodash';
import { useClinicsList } from '../../../hooks/useClinicsList';
import { camelCaseKeys } from '../../../utils/misc';

const getAppointments = async (token: string, filters: SearhFilters): Promise<Appointment[]> => {
  try {
    const response = await axios.get(`${HIKMA_API}/v1/admin/appointments/search`, {
      params: filters,
      headers: {
        'Content-Type': 'application/json',
        Authorization: String(token),
      },
    });

    return response.data.appointments;
  } catch (error) {
    console.error(error);
    return [];
  }
};

/**
 * Update the status of an appointment
 * @param token The user's token
 * @param appointmentId The appointment to update
 * @param status The new status
 */
const updateAppointmentStatus = async (
  token: string,
  appointmentId: string,
  status: AppointmentStatus
): Promise<void> => {
  try {
    await axios.put(
      `${HIKMA_API}/v1/admin/appointments/${appointmentId}`,
      { status },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: String(token),
        },
      }
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'checked_in';

export type Appointment = {
  id: string;
  providerId: string | null;
  clinicId: string;
  patientId: string;
  userId: string;
  currentVisitId: string;
  fulfilledVisitId: string | null;
  timestamp: Date;
  duration: number; // in minutes
  reason: string;
  notes: string;
  status: AppointmentStatus;
  metadata: Record<string, any>;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

const appointmentStatusList: (AppointmentStatus | 'all')[] = [
  'all',
  'pending',
  // "confirmed", // removed confirmed - not sure how to handle it yet
  'cancelled',
  'checked_in',
  'completed',
];

type DBAppointmentItem = Appointment & {
  patient: {
    givenName: string;
    surname: string;
    dateOfBirth: Date;
    sex: string;
    phone: string;
  };
  // The user that created the appointment
  user: {
    name: string;
  };
  // The clinic where the appointment is
  clinic: {
    name: string;
  };
};

type SearhFilters = {
  startDate: Date;
  endDate: Date;
  patientId: string | null;
  clinicId: string | null;
  status: string;
};

export default function AppointmentsList() {
  const [searchFilters, setSearchFilters] = useState<SearhFilters>({
    startDate: startOfDay(new Date()),
    endDate: endOfDay(new Date()),
    patientId: null,
    clinicId: null,
    status: 'all',
  });
  const [loading, setLoading] = useState(false);
  const { clinics, loading: loadingClinics } = useClinicsList();
  const [appointments, setAppointments] = useState<DBAppointmentItem[]>([]);

  const handleSearch = () => {
    const token = localStorage.getItem('token');

    if (token) {
      setLoading(true);
      getAppointments(token, searchFilters)
        .then((appointments) => {
          setAppointments(appointments.map((app) => camelCaseKeys(app) as DBAppointmentItem));
        })
        .catch((error) => {
          console.error(error);
          notifications.show({
            title: 'Error',
            message: 'Failed to fetch appointments',
            color: 'red',
            position: 'top-right',
          });
        })
        .finally(() => setLoading(false));
    }
  };

  const toggleAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => {
    const token = localStorage.getItem('token');
    if (token) {
      setLoading(true);
      updateAppointmentStatus(token, appointmentId, status)
        .then(() => {
          setAppointments(
            appointments.map((app) => (app.id === appointmentId ? { ...app, status } : app))
          );
          handleSearch();
        })
        .catch((error) => {
          console.error(error);
          notifications.show({
            title: 'Error',
            message: 'Failed to update appointment status',
            color: 'red',
            position: 'top-right',
          });
          setLoading(false);
        });
    }
  };

  console.log(appointments);

  return (
    <AppLayout title="Appointments List">
      <Flex dir="row" gap="md" align="flex-end">
        <DateInput
          label="Start Date"
          value={searchFilters.startDate}
          onChange={(date) =>
            setSearchFilters({
              ...searchFilters,
              startDate: startOfDay(new Date(date as Date)) as Date,
            })
          }
        />
        <DateInput
          label="End Date"
          minDate={searchFilters.startDate}
          value={searchFilters.endDate}
          onChange={(date) =>
            setSearchFilters({
              ...searchFilters,
              endDate: endOfDay(new Date(date as Date)) as Date,
            })
          }
        />
        <Select
          label="Status"
          data={appointmentStatusList.map((status) => ({
            value: status,
            label: upperFirst(status.replace('_', ' ')),
          }))}
          value={searchFilters.status}
          onChange={(value) => setSearchFilters({ ...searchFilters, status: value as string })}
        />
        <Select
          label="Clinic"
          data={clinics.map((clinic) => ({ value: clinic.id, label: clinic.name }))}
          value={searchFilters.clinicId}
          clearable
          onChange={(value) => setSearchFilters({ ...searchFilters, clinicId: value as string })}
        />
        <Button onClick={handleSearch} loading={loading} className="primary">
          Search
        </Button>
      </Flex>

      <Box py="lg">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Patient Name</Table.Th>
              <Table.Th>Created By</Table.Th>
              <Table.Th>Clinic</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {appointments.map((appointment) => (
              <Table.Tr key={appointment.id}>
                <Table.Td colSpan={1}>
                  {format(appointment.timestamp, 'dd MMM yyyy, HH:mm')}
                </Table.Td>
                <Table.Td
                  colSpan={1}
                >{`${appointment.patient.givenName} ${appointment.patient.surname}`}</Table.Td>
                <Table.Td colSpan={1}>{appointment.user.name}</Table.Td>
                <Table.Td colSpan={1}>{appointment.clinic.name}</Table.Td>
                <Table.Td colSpan={1}>
                  <Select
                    value={appointment.status}
                    data={['pending', 'cancelled', 'completed', 'checked_in'].map((status) => ({
                      value: status,
                      label: upperFirst(status?.replace('_', ' ')) || '',
                    }))}
                    onChange={(value) =>
                      toggleAppointmentStatus(appointment.id, value as AppointmentStatus)
                    }
                  />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>
    </AppLayout>
  );
}
