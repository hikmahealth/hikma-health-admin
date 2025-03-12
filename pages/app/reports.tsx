import { Box, Button, Collapse, Flex, Group, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import axios from 'axios';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import { useEffect, useState } from 'react';
import AppLayout from '../../components/Layout';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

export default function Reports() {
  const [startDate, setStartDate] = useState(subDays(new Date(), 1).toISOString());
  const [endDate, setEndDate] = useState(new Date().toISOString());

  const [openedPatients, { toggle: togglePatients }] = useDisclosure(false);
  const [openedEvents, { toggle: toggleEvents }] = useDisclosure(false);
  const [openedDiagnosesCounts, { toggle: toggleDiagnosesCounts }] = useDisclosure(false);
  const [openedPrescriptionsCounts, { toggle: togglePrescriptionsCounts }] = useDisclosure(false);

  // data from the server
  const [patients, setPatients] = useState([]);
  const [events, setEvents] = useState({});
  const [diagnosesCounts, setDiagnosesCounts] = useState({});
  const [prescriptionsCounts, setPrescriptionsCounts] = useState({});

  // counter var to trigger useEffect
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const from = startOfDay(startDate).toISOString();
    const to = endOfDay(endDate).toISOString();

    // get patients and attributes
    axios
      .get(`${HIKMA_API}/v1/admin/ahr/patients_breakdown`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: String(token),
        },
      })
      .then((res) => {
        setPatients(res.data);
      });

    // get the events by clinic
    //   axios.get(`${HIKMA_API}/v1/admin/ahr/events_by_clinic?start_date=2023-12-31&end_date=2023-12-31`, {
    axios
      .get(
        `${HIKMA_API}/v1/admin/ahr/events_by_clinic_through_appointments?start_date=${from}&end_date=${to}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: String(token),
          },
        }
      )
      .then((res) => {
        setEvents(res.data);
      });

    // diagnoses_counts
    axios
      .get(`${HIKMA_API}/v1/admin/ahr/diagnoses_counts?start_date=${from}&end_date=${to}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: String(token),
        },
      })
      .then((res) => {
        setDiagnosesCounts(res.data);
      });

    //prescriptions_counts
    axios
      .get(`${HIKMA_API}/v1/admin/ahr/prescriptions_counts?start_date=${from}&end_date=${to}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: String(token),
        },
      })
      .then((res) => {
        setPrescriptionsCounts(res.data);
      });
  }, [counter]);

  const handleFetchData = () => {
    setCounter(counter + 1);
  };

  return (
    <AppLayout title="Reports">
      <Flex gap="md">
        <DatePickerInput
          label="Start Date"
          value={new Date(startDate)}
          onChange={(value) => setStartDate(value?.toISOString() || new Date().toISOString())}
        />
        <DatePickerInput
          label="End Date"
          value={new Date(endDate)}
          onChange={(value) => setEndDate(value?.toISOString() || new Date().toISOString())}
        />

        <Button onClick={handleFetchData}>Fetch Data</Button>
      </Flex>

      <Box p="md">
        <Text size="lg">Patients</Text>
        <Group mb={5}>
          <Button onClick={togglePatients}>Open Patients</Button>
        </Group>
        <pre>{JSON.stringify(calculateAgeHistogram(patients as any), null, 2)}</pre>
        <pre>{JSON.stringify(tallyPatientsBySex(patients as any), null, 2)}</pre>
        <Collapse in={openedPatients}>
          <pre>{JSON.stringify(patients, null, 2)}</pre>
        </Collapse>
      </Box>

      <Box p="md">
        <Text size="lg">Events</Text>
        <Group mb={5}>
          <Button onClick={toggleEvents}>Open Events</Button>
        </Group>
        <Collapse in={openedEvents}>
          <pre>{JSON.stringify(events, null, 2)}</pre>
        </Collapse>
      </Box>

      <Box p="md">
        <Text size="lg">Diagnoses Counts</Text>
        <Group mb={5}>
          <Button onClick={toggleDiagnosesCounts}>Open Diagnoses Counts</Button>
        </Group>
        <Collapse in={openedDiagnosesCounts}>
          <pre>{JSON.stringify(sortDiagnosesCounts(diagnosesCounts as any), null, 2)}</pre>
        </Collapse>
      </Box>

      <Box p="md">
        <Text size="lg">Prescriptions Counts</Text>
        <Group mb={5}>
          <Button onClick={togglePrescriptionsCounts}>Open Prescriptions Counts</Button>
        </Group>

        <Collapse in={openedPrescriptionsCounts}>
          <pre>{JSON.stringify(tallyPrescriptions(prescriptionsCounts as any), null, 2)}</pre>
        </Collapse>
      </Box>
    </AppLayout>
  );
}

interface Patient {
  additional_attributes: {
    [key: string]: {
      attribute: string;
      string_value: string | null;
    };
  };
  date_of_birth: string;
  sex: string;
}

interface ApiResponse {
  patients: Patient[];
}

function calculateAgeHistogram(data: ApiResponse): Record {
  const currentDate = new Date();
  const ageHistogram: Record = {};

  data.patients?.forEach((patient) => {
    let age: number | null = null;

    // Check for age in additional_attributes
    for (const key in patient.additional_attributes) {
      const attr = patient.additional_attributes[key];
      if (attr.attribute === 'Age' && attr.string_value) {
        age = parseInt(attr.string_value, 10);
        break;
      }
    }

    // If age not found in additional_attributes, calculate from date_of_birth
    if (age === null) {
      const birthDate = new Date(patient.date_of_birth);
      age = currentDate.getFullYear() - birthDate.getFullYear();

      // Adjust age if birthday hasn't occurred this year
      const monthDiff = currentDate.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Increment the count for this age
    if (age !== null) {
      ageHistogram[age] = (ageHistogram[age] || 0) + 1;
    }
  });

  return ageHistogram;
}

interface DiagnosesData {
  diagnoses_counts: Record;
  end_date: string | null;
  start_date: string | null;
}

function sortDiagnosesCounts(
  data: DiagnosesData = { diagnoses_counts: {}, end_date: null, start_date: null }
): [string, number][] {
  // Extract the diagnoses_counts object
  const { diagnoses_counts } = data;

  // Convert the object to an array of [key, value] pairs
  try {
    const diagnosesArray = Object.entries(diagnoses_counts);

    // Sort the array based on the count (value) in descending order
    diagnosesArray.sort((a, b) => b[1] - a[1]);

    return diagnosesArray;
  } catch (error) {
    console.error('Error sorting diagnoses counts:', error);
    return [];
  }
}

interface SexTally {
  male: number;
  female: number;
  other: number;
}

function tallyPatientsBySex(data: ApiResponse): SexTally {
  const tally: SexTally = {
    male: 0,
    female: 0,
    other: 0,
  };

  data.patients?.forEach((patient) => {
    switch (patient.sex.toLowerCase()) {
      case 'male':
        tally.male++;
        break;
      case 'female':
        tally.female++;
        break;
      default:
        tally.other++;
    }
  });

  return tally;
}

interface PrescriptionsResponse {
  prescriptions_counts: Record;
  start_date: string | null;
  end_date: string | null;
}

function tallyPrescriptions(data: PrescriptionsResponse): [string, number][] {
  // Extract the prescriptions_counts object
  const { prescriptions_counts } = data;

  try {
    // Convert the object to an array of [prescription, count] pairs
    const prescriptionsArray = Object.entries(prescriptions_counts);

    // Sort the array based on the count in descending order
    prescriptionsArray.sort((a, b) => b[1] - a[1]);

    return prescriptionsArray;
  } catch (error) {
    console.error('Error tallying prescriptions:', error);
    return [];
  }
}
