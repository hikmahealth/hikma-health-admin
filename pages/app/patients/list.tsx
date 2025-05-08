import { ActionIcon, Box, Button, Loader, rem, Table, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowRight, IconPlus, IconSearch, IconTrash, IconX } from '@tabler/icons-react';
import axios from 'axios';
import { format } from 'date-fns';
import { differenceBy, replace } from 'lodash';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '../../../components/Layout';
import { usePatientRegistrationForm } from '../../../hooks/usePatientRegistrationForm';
import { MultiplePatientRows, Patient } from '../../../types/Patient';
import { orderedList } from '../../../utils/misc';
import { formatPatientsIntoRows } from '../../../utils/patient';
import { tableToCSV } from '../exports';
import { baseFields, getTranslation } from './registration-form';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

export const getAllPatients = async (token: string): Promise<Patient[]> => {
  const response = await fetch(`${HIKMA_API}/admin_api/all_patients`, {
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
  return result.patients;
};

/**
Get the colulmns of the patient records
This is a heavy process O(n)

@param {Patient[]} patientsList
@return {string[]} columns
*/
export function getPatientColumns(patientsList: Patient[]): string[] {
  const cols = new Set();
  patientsList.slice(0, 200).forEach((pt) => {
    const allKeys = Object.keys(pt);
    const excluded = ['additional_data', 'additional_attributes'];
    allKeys.forEach((k) => !excluded.includes(k) && cols.add(k));
    Object.keys(pt['additional_data'] || {}).forEach((k) => cols.add(k));
    // Object.keys(pt['additional_attributes'] || {}).forEach((k) => cols.add(k));
  });
  return Array.from(cols) as string[];
}

export default function PatientsList() {
  const [columns, setColumns] = useState<string[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchCounter, setSearchCounter] = useState<number>(0); // used to re-fetch patients when search is reset
  const [searchState, setSearchState] = useState<{
    isSearching: boolean;
    showingResults: boolean;
  }>({
    isSearching: false,
    showingResults: false,
  });
  const router = useRouter();

  const { form: patientRegistrationForm } = usePatientRegistrationForm();

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    getAllPatients(token)
      .then((patientsList: Patient[]) => {
        setPatients(patientsList);
        // console.log(patientsList);

        // setColumns(getPatientColumns(patientsList));

        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, [searchCounter]);

  // deleted fields in the registration form (we will filter these out from the display)
  const [deletedFieldIds, deletedFieldColumn] = useMemo(() => {
    let fields = patientRegistrationForm?.fields.filter((f) => f.deleted) || [];
    return [fields.map((f) => f.id), fields.map((f) => f.column)];
  }, [patientRegistrationForm]);

  console.log(
    'patient: ',
    formatPatientsIntoRows(patients as any, deletedFieldIds)
    // patients.map((p) => formatPatientRow(p))
  );

  const {
    columnIds,
    patientRows,
  }: { columnIds: string[]; patientRows: MultiplePatientRows['values'] } = useMemo(() => {
    const { columns, values } = formatPatientsIntoRows(patients as any, deletedFieldIds);
    return {
      columnIds: orderedList(columns, ['id', 'given_name', 'surname', 'date_of_birth']),
      patientRows: values,
    };
  }, [patients.length]);

  /* mapping of field_ids to their current label */
  // TOMBSTONE: March 23, 2025
  // const registrationIdToField: Record = useMemo(() => {
  //   if (patientRegistrationForm === null) return {};
  //   const { fields } = patientRegistrationForm;
  //   return fields.reduce((prev, curr) => {
  //     const key = curr.id;
  //     prev[key] = getTranslation(curr.label, 'en') || '';
  //     return prev;
  //   }, {} as Record);
  // }, [patientRegistrationForm]);

  /* mapping of columns to their current label */
  const registrationColToField: Record<string, string> = useMemo(() => {
    if (patientRegistrationForm === null) return {};
    const { fields } = patientRegistrationForm;
    return fields.reduce(
      (prev, curr) => {
        const key = curr.column;
        prev[key] = getTranslation(curr.label, 'en') || curr.column || '';
        return prev;
      },
      {} as Record<string, string>
    );
  }, [patientRegistrationForm]);

  /** Download all the loaded patients */
  const downloadPatients = () => {
    const fileName = format(new Date(), 'yyyy-MM-dd') + '-PatientsList';

    tableToCSV(fileName);
  };

  /** The base fields columns */
  // const basePatientFields = [
  //   'created_at',
  //   'id',
  //   'given_name',
  //   'surname',
  //   'date_of_birth',
  //   'country',
  //   'hometown',
  //   'sex',
  //   'phone',
  //   'updated_at',
  // ];
  /** Fields to ignore from the base fields */
  const ignoreFields = [
    'metadata',
    'deleted_at',
    'additional_attributes',
    'is_deleted',
    'last_modified',
    'photo_url',
    'server_created_at',
    'image_timestamp',
  ];
  const basePatientFields = baseFields
    .filter((field) => field.baseField === true)
    .map((field) => field.column);
  /** Add id created_at, updated_at manually to the base fields */
  basePatientFields.unshift('id', 'created_at');
  basePatientFields.push('updated_at');

  /** The custom / dynamic fields that are in the additional_data column */
  const additionalData = differenceBy(columns, basePatientFields).filter(
    (colId) => !deletedFieldIds.includes(colId) || !ignoreFields.includes(colId)
  );

  console.log({ additionalData });
  console.log({ columnIds, deletedFieldIds, deletedFieldColumn });

  const goToRegisterPatient = () => {
    router.push('/app/patients/register');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // get the search query
    // @ts-expect-error Property 'elements' does not exist on type 'EventTarget & Element'.
    const searchInput = e.currentTarget.elements.namedItem('search') as HTMLInputElement;
    const searchQuery = searchInput.value;

    const token = localStorage.getItem('token') || '';

    setSearchState({ isSearching: true, showingResults: true });

    axios
      .get(`${HIKMA_API}/v1/admin/search/patients`, {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        params: {
          query: searchQuery,
        },
      })
      .then((res) => {
        setPatients(res.data?.patients || []);
      })
      .catch((err) => {
        console.error(err);
        setPatients([]);
        notifications.show({
          title: 'Error',
          message: 'An error occurred while searching for patients',
          color: 'red',
          position: 'top-right',
        });
      })
      .finally(() => {
        setSearchState({ isSearching: false, showingResults: true });
      });
  };

  const resetSearch = () => {
    setSearchState({ isSearching: false, showingResults: false });
    setPatients([]);
    // clear the search input form
    const searchInput = document.querySelector('input[name="search"]') as HTMLInputElement;
    searchInput.value = '';
    setSearchCounter((prev) => prev + 1);
  };

  const handlePatientClicked = (patient: Patient) => () => {
    console.log(patient);
  };

  const handleDelete = (patientId: string) => () => {
    console.log(patientId);
    if (!window.confirm('Are you sure you want to delete this patient?')) return;

    const token = localStorage.getItem('token');
    axios
      .delete(`${HIKMA_API}/v1/admin/patients/${patientId}`, {
        headers: {
          Authorization: token,
        },
      })
      .then(() => {
        setPatients((prev) => prev.filter((p) => p.id !== patientId));
        notifications.show({
          title: 'Success',
          message: 'Patient deleted successfully',
          color: 'green',
          position: 'top-right',
        });
      })
      .catch((err) => {
        console.error(err);
        notifications.show({
          title: 'Error',
          message: 'An error occurred while deleting patient',
          color: 'red',
          position: 'top-right',
        });
      });
  };

  const ths = (
    <Table.Tr>
      <Table.Th style={{ width: 50 }}>Actions</Table.Th>
      {columnIds?.map((col) => (
        <Table.Th style={{ minWidth: 250 }} key={col}>
          {registrationColToField[col] || replace(col || '', '_', ' ')}
        </Table.Th>
      ))}
    </Table.Tr>
  );

  // const ths = (
  //   <Table.Tr>
  //     {basePatientFields.map((col) => (
  //       <Table.Th style={{ minWidth: 250 }} key={col}>
  //         {registrationColToField[col] || replace(col || '', '_', ' ')}
  //       </Table.Th>
  //     ))}
  //     {additionalData.map((col) => (
  //       <Table.Th style={{ minWidth: 250 }} key={col}>
  //         {registrationIdToField[col] || col}
  //       </Table.Th>
  //     ))}
  //   </Table.Tr>
  // );

  const rows = patientRows.map((patient, idx) => {
    return (
      <Table.Tr
        style={{ cursor: 'pointer' }}
        // onClick={handlePatientClicked(patient)}
        key={'patient_row_' + idx}
      >
        <Table.Td>
          <ActionIcon
            variant="transparent"
            color="red"
            onClick={handleDelete(patient.id as string)}
            // onClick={() => console.log(patient.id)}
          >
            <IconTrash size="1rem" />
          </ActionIcon>
        </Table.Td>
        {columnIds?.map((colId) => (
          <Table.Td key={patient.id + colId}>
            {String(patient[colId as keyof Patient] || '')}
          </Table.Td>
        ))}
      </Table.Tr>
    );
  });

  const rows2 = patients.map((patient: Patient) => (
    <Table.Tr
      style={{ cursor: 'pointer' }}
      onClick={handlePatientClicked(patient)}
      key={patient.id}
    >
      {/*
      {basePatientFields.map((field) => (
        <Table.Td key={patient.id + field}>
          {String(patient[field as keyof Patient] || '')}
        </Table.Td>
      ))}
      {additionalData.map((col) => (
        <Table.Td key={col}>
          {String(patient.additional_data[col as any] || patient[col as keyof Patient] || '')}
        </Table.Td>
      ))}
      {/*
      <td>{format(patient.created_at, 'dd MMM yyyy')}</td>
      <td>{patient.id}</td>
      <td>{patient.given_name}</td>
      <td>{patient.surname}</td>
      <td>{format(patient.date_of_birth, 'dd MMM yyyy')}</td>
      <td>{patient.country}</td>
      <td>{patient.hometown}</td>
      <td>{patient.sex}</td>
      <td>{patient.phone}</td>
  */}
      {/* additionalData.map((f) => (
        // @ts-ignore
        <td key={f}>{patient.additional_data[f as any] || ''}</td>
      )) */}
    </Table.Tr>
  ));

  return (
    <>
      <AppLayout title="Patients List">
        <Button onClick={downloadPatients} variant={'light'}>
          Download data
        </Button>
        <Box py={'md'}>
          <form onSubmit={handleSearch}>
            <TextInput
              radius="xl"
              size="md"
              name="search"
              placeholder="Search patients by name"
              rightSectionWidth={42}
              leftSection={<IconSearch style={{ width: rem(18), height: rem(18) }} stroke={1.5} />}
              rightSection={
                searchState.isSearching ? (
                  <Loader size="xs" />
                ) : searchState.showingResults ? (
                  <ActionIcon
                    type="button"
                    onClick={resetSearch}
                    size={32}
                    radius="xl"
                    color={'blue'}
                    variant="filled"
                  >
                    <IconX style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                  </ActionIcon>
                ) : (
                  <ActionIcon type="submit" size={32} radius="xl" color={'blue'} variant="filled">
                    <IconArrowRight style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
                  </ActionIcon>
                )
              }
            />
          </form>
        </Box>
        <Table.ScrollContainer minWidth={500}>
          <Table
            horizontalSpacing={'md'}
            striped
            stickyHeader
            stickyHeaderOffset={60}
            highlightOnHover
          >
            <thead>{ths}</thead>
            <tbody>{rows}</tbody>
          </Table>
        </Table.ScrollContainer>

        <div className="flex justify-center my-6 w-full">{loading && <Loader size="xl" />}</div>
      </AppLayout>
      <ActionIcon
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
        }}
        onClick={goToRegisterPatient}
        variant="filled"
        className="primary"
        size="xl"
        radius="xl"
        aria-label="Settings"
      >
        <IconPlus style={{ width: '60%', height: '60%' }} stroke={1.5} />
      </ActionIcon>
    </>
  );
}
