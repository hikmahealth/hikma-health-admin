import { Box, Button, Flex, Pagination, Select, Table } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { endOfDay, format, isValid, startOfDay } from 'date-fns';
import { useMemo, useRef, useState } from 'react';
import AppLayout from '../../../components/Layout';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

import { usePagination } from '@mantine/hooks';
import axios from 'axios';
import { upperFirst } from 'lodash';
import If from '../../../components/If';
import { useClinicsList } from '../../../hooks/useClinicsList';
import { Prescription, PrescriptionStatus, statusValues } from '../../../types/Prescription';
import { camelCaseKeys, safeJSONParse, tryParseDate } from '../../../utils/misc';
import { tableToCSV } from '../exports';

const getPrescriptions = async (token: string, filters: SearhFilters): Promise => {
  try {
    const response = await axios.get(`${HIKMA_API}/v1/admin/prescriptions/search`, {
      params: filters,
      headers: {
        'Content-Type': 'application/json',
        Authorization: String(token),
      },
    });

    return response.data.prescriptions;
  } catch (error) {
    console.error(error);
    return [];
  }
};

/**
 * Update the status of a prescription
 * @param token The user's token
 * @param prescriptionId The prescription to update
 * @param status The new status
 */
const updatePrescriptionStatus = async (
  token: string,
  prescriptionId: string,
  status: PrescriptionStatus
): Promise => {
  try {
    await axios.put(
      `${HIKMA_API}/v1/admin/prescriptions/${prescriptionId}`,
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

const prescriptionStatusList: (PrescriptionStatus | 'all')[] = [...statusValues, 'all'];

type DBPrescriptionItem = Prescription & {
  patient: {
    id: string;
    givenName: string;
    surname: string;
    dateOfBirth: Date;
    sex: string;
    phone: string;
  };
  // The provider (user) that created the prescription
  provider: {
    name: string;
  };
  // The clinic where the prescription is
  pickupClinic: {
    name: string;
  };

  // camelcased keys that are relevant
  patientId: string;
};

type SearhFilters = {
  startDate: Date;
  endDate: Date;
  patientId: string | null;
  clinicId: string | null;
  status: string;
};

export default function PrescriptionsList() {
  const [searchFilters, setSearchFilters] = useState<SearhFilters>({
    startDate: startOfDay(new Date()),
    endDate: endOfDay(new Date()),
    patientId: null,
    clinicId: null,
    status: 'all',
  });
  const [loading, setLoading] = useState(false);
  const { clinics, loading: loadingClinics } = useClinicsList();
  const [prescriptions, setPrescriptions] = useState<DBPrescriptionItem[]>([]);

  const pageSize = useRef(30);
  const pagination = usePagination({
    total: Math.ceil(prescriptions.length / pageSize.current),
    initialPage: 1,
  });

  const handleSearch = () => {
    const token = localStorage.getItem('token');

    if (token) {
      setLoading(true);
      getPrescriptions(token, searchFilters)
        .then((presc) => {
          setPrescriptions(presc.map((pres) => camelCaseKeys(pres) as DBPrescriptionItem));
        })
        .catch((error) => {
          console.error(error);
          notifications.show({
            title: 'Error',
            message: 'Failed to fetch prescriptions',
            color: 'red',
            position: 'top-right',
          });
        })
        .finally(() => setLoading(false));
    }
  };

  const togglePrescriptionStatus = (prescriptionId: string, status: PrescriptionStatus) => {
    const token = localStorage.getItem('token');
    if (token) {
      setLoading(true);
      updatePrescriptionStatus(token, prescriptionId, status)
        .then(() => {
          setPrescriptions(
            prescriptions.map((pres) => (pres.id === prescriptionId ? { ...pres, status } : pres))
          );
          handleSearch();
        })
        .catch((error) => {
          console.error(error);
          notifications.show({
            title: 'Error',
            message: 'Failed to update prescription status',
            color: 'red',
            position: 'top-right',
          });
          setLoading(false);
        });
    }
  };

  /** Download all the prescriptions from this specific selected form and within this date range */
  const downloadPrescriptions = () => {
    const { startDate: startDateVal, endDate: endDateVal } = searchFilters;
    const startDate = isValid(startDateVal) ? format(startDateVal as any, 'yyyy MM dd') : '__';
    const endDate = isValid(endDateVal) ? format(endDateVal as any, 'yyyy MM dd') : '__';
    const fileName = `${startDate}-${endDate}-prescriptions`;

    tableToCSV(fileName);
  };

  const pagedPrescriptions = useMemo(
    () =>
      prescriptions.slice(
        (pagination.active - 1) * pageSize.current,
        pagination.active * pageSize.current
      ),
    [prescriptions, pagination.active, pageSize.current]
  );

  //   console.log(prescriptions);

  return (
    <AppLayout title="Prescriptions List">
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
          data={prescriptionStatusList.map((status) => ({
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

      <If show={prescriptions.length > 0}>
        <Button variant="transparent" onClick={downloadPrescriptions} loading={loading}>
          Download Data
        </Button>
      </If>

      <Box py="lg">
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Patient Id</Table.Th>
              <Table.Th>Patient Name</Table.Th>
              <Table.Th>Medications</Table.Th>
              <Table.Th>Prescribed By</Table.Th>
              <Table.Th>Pickup Clinic</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {pagedPrescriptions.map((prescription) => (
              <Table.Tr key={prescription.id}>
                <Table.Td colSpan={1}>
                  {isValid(new Date(prescription.prescribed_at))
                    ? format(
                        tryParseDate(prescription.prescribed_at, new Date()),
                        'dd MMM yyyy, HH:mm'
                      )
                    : ''}
                </Table.Td>
                <Table.Td colSpan={1}>{prescription.patientId}</Table.Td>
                <Table.Td
                  colSpan={1}
                >{`${prescription.patient.givenName} ${prescription.patient.surname}`}</Table.Td>
                <Table.Td colSpan={1}>
                  {safeJSONParse<Prescription['items']>(prescription.items, []).map((item) => (
                    <div key={item.id}>
                      {item.name} {item.dose}
                      {item.doseUnits} ({item.frequency} {item.duration} {item.durationUnits})
                    </div>
                  ))}
                </Table.Td>
                <Table.Td colSpan={1}>{prescription.provider.name}</Table.Td>
                <Table.Td colSpan={1}>{prescription.pickupClinic.name}</Table.Td>
                <Table.Td colSpan={1}>
                  <Select
                    value={prescription.status}
                    data={statusValues.map((status) => ({
                      value: status,
                      label: upperFirst(status?.replace('_', ' ')) || '',
                    }))}
                    onChange={(value) =>
                      togglePrescriptionStatus(prescription.id, value as PrescriptionStatus)
                    }
                  />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Pagination
          total={Math.ceil(prescriptions.length / pageSize.current)}
          value={pagination.active}
          onChange={pagination.setPage}
          mt="sm"
        />
      </Box>
    </AppLayout>
  );
}
