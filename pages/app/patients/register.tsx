import {
  Box,
  Button,
  Flex,
  Loader,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { DatePickerInput, DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconCalendar, IconCircleCheck, IconUserPlus } from '@tabler/icons-react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { v1 as uuidV1 } from 'uuid';
import If from '../../../components/If';
import AppLayout from '../../../components/Layout';
import { useClinicsList } from '../../../hooks/useClinicsList';
import { usePatientRegistrationForm } from '../../../hooks/usePatientRegistrationForm';
import { getTranslation, RegistrationFormField } from './registration-form';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

type PatientAttributeRow = {
  id: string; // uuid,
  patient_id: string; // uuid
  attribute_id: string;
  attribute: string;
  number_value: number | null;
  string_value: string | null;
  date_value: Date | null;
  boolean_value: boolean | null;
  metadata: Record<string, any>;
};

/**
Given a column type (a field type) of an input entry, return the default value to display
@param {RegistrationFormField["fieldType"]} fieldType
@returns {boolean | number | string | Date}
*/
function getDefaultFormValue(
  fieldType: RegistrationFormField['fieldType']
): boolean | number | string | Date {
  if (['text', 'select'].includes(fieldType)) {
    return '';
  } else if (fieldType === 'number') {
    return 0;
  } else if (fieldType === 'boolean') {
    return false;
  } else if (fieldType === 'date') {
    return new Date();
  }

  // something went wrong
  console.warn('Encountered new fieldType for patient registration');
  return '';
}

export default function RegisterPatient() {
  const {
    form: patientRegistrationForm,
    isLoading: isLoadingForm,
    refresh: refreshForm,
  } = usePatientRegistrationForm();
  const [opened, { open, close }] = useDisclosure(false);

  // patient id is null before the patient is created, and then set to the patient id after the patient is created
  const [patientId, setPatientId] = useState<string | null>(null);
  const [loadingSubmission, setLoadingSubmission] = useState(false);

  // Register patient => show option to create appointment or register another patient => if register another patient, reset form
  // => if create appointment, open modal to select clinic, date/time, duration, reason, and notes
  // => create appointment, reset form
  const [registrationState, setRegistrationState] = useState<
    | 'register-patient'
    | 'registration-complete'
    | 'creating-appointment'
    | 'creating-appointment-complete'
  >('register-patient');

  // if the registration state is ever set to 'register-patient', reset the form and patientId then close the modal
  useEffect(() => {
    if (registrationState === 'register-patient') {
      setPatientId(null);
      form.reset();
      form.setValues({});
      close();
    }
  }, [registrationState]);

  // if the form ever closes, reset the registration state to 'register-patient'
  useEffect(() => {
    if (opened === false) {
      setRegistrationState('register-patient');
    }
  }, [opened]);

  const form = useForm({
    mode: 'controlled',
    initialValues: {},

    validate: {},
  });

  // once the registration form has loaded, set the initial values of the form
  useEffect(() => {
    if (isLoadingForm === false && patientRegistrationForm !== null) {
      // get the registration form and data types, then set the default
      const defaultValues = patientRegistrationForm.fields.reduce((prev, curr) => {
        const key = curr.column;
        const defaultValue = getDefaultFormValue(curr.fieldType);
        prev[key] = defaultValue;
        return prev;
      }, {} as Record<string, any>);

      form.setInitialValues(defaultValues);
    }
  }, [isLoadingForm, patientRegistrationForm]);

  const formRef = useRef<HTMLFormElement>(null);

  const createPatient = (values: any) => {
    if (loadingSubmission) return;
    // construct the base patient data
    const patientBaseData = {};
    const additionalAttributes: PatientAttributeRow[] = [];
    const token = localStorage.getItem('token');

    patientRegistrationForm?.fields
      .filter((field) => field.deleted !== true && field.visible)
      .forEach((field) => {
        if (field.baseField) {
          // @ts-ignore
          patientBaseData[field.column] = values[field.column];
        } else {
          const row: PatientAttributeRow = {
            id: uuidV1(),
            patient_id: '',
            attribute_id: field.id,
            attribute: field.column,
            number_value: field.fieldType === 'number' ? Number(values[field.column]) : null,
            string_value: ['text', 'select'].includes(field.fieldType)
              ? String(values[field.column])
              : null,
            date_value: field.fieldType === 'date' ? new Date(values[field.column]) : null,
            boolean_value: field.fieldType === 'boolean' ? Boolean(values[field.column]) : null,
            metadata: {},
          };
          additionalAttributes.push(row);
        }
      });

    setLoadingSubmission(true);
    axios
      .post(
        `${HIKMA_API}/v1/admin/patients`,
        {
          data: {
            baseFields: patientBaseData,
            attributeFields: additionalAttributes,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: String(token),
          },
        }
      )
      .then((res) => {
        console.log({ res });
        setPatientId(res.data.patient_id);
        setRegistrationState('registration-complete');
        open();
        form.setValues({});
        form.reset();
        formRef?.current?.reset();
      })
      .catch((error) => {
        console.error(error);
        alert(
          'Error registering patient. Please make sure you have internet access and your server is up to date.'
        );
      })
      .finally(() => {
        setLoadingSubmission(false);
      });
  };

  // FIXME: handle case where the form is not created yet
  if (isLoadingForm === false && patientRegistrationForm === null) {
    return (
      <AppLayout title="Register New Patient" isLoading={isLoadingForm}>
        Please create a patient registration form first before proceeding.
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Register New Patient" isLoading={isLoadingForm}>
      <Modal opened={opened} onClose={close} title="Next steps" closeOnClickOutside={false}>
        {/* Patient registration is complete. show options */}
        <If show={registrationState === 'registration-complete'}>
          <Flex justify="center" align="center" direction="column" gap="lg">
            <IconCircleCheck color="green" size={100} />
            <Title order={2}>Patient Registered</Title>
            <Text size="sm">What would you like to do next?</Text>
          </Flex>
          <Stack my="lg" gap="lg">
            <Button
              leftSection={<IconCalendar size={16} />}
              onClick={() => setRegistrationState('creating-appointment')}
              variant="outline"
              fullWidth
            >
              Create appointment
            </Button>
            <Button
              leftSection={<IconUserPlus size={16} />}
              onClick={() => setRegistrationState('register-patient')}
              variant="outline"
              fullWidth
            >
              Register another patient
            </Button>
          </Stack>
        </If>

        {/* Creating appointment option chosen */}
        <If show={registrationState === 'creating-appointment'}>
          <NewAppointmentForm
            visitId={null}
            patientId={patientId as string}
            onAppointmentCreated={() => setRegistrationState('creating-appointment-complete')}
          />
        </If>

        {/* Creating appointment is complete */}
        <If show={registrationState === 'creating-appointment-complete'}>
          <Flex justify="center" align="center" direction="column" gap="lg">
            <IconCircleCheck color="green" size={100} />
            <Title order={2}>Appointment Created</Title>
            <Text size="sm">What would you like to do next?</Text>
          </Flex>

          <Stack my="lg" gap="lg">
            <Button
              leftSection={<IconCalendar size={16} />}
              onClick={() => setRegistrationState('creating-appointment')}
              variant="outline"
              fullWidth
            >
              Create another appointment
            </Button>
            <Button
              leftSection={<IconUserPlus size={16} />}
              onClick={() => setRegistrationState('register-patient')}
              variant="outline"
              fullWidth
            >
              Register another patient
            </Button>
          </Stack>
        </If>
      </Modal>

      <form onSubmit={form.onSubmit(createPatient)} ref={formRef}>
        <Box style={{ maxWidth: 500 }} className="space-y-4">
          {patientRegistrationForm?.fields
            .filter((field) => field.visible && field.deleted !== true)
            .map((field) => {
              if (field.fieldType === 'text') {
                return (
                  <TextInput
                    key={field.id}
                    label={getTranslation(field.label, 'en')}
                    {...form.getInputProps(field.column)}
                  />
                );
              }
              if (field.fieldType === 'number') {
                return (
                  <NumberInput
                    key={field.id}
                    label={getTranslation(field.label, 'en')}
                    {...form.getInputProps(field.column)}
                  />
                );
              }
              if (field.fieldType === 'select') {
                return (
                  <Select
                    key={field.id}
                    label={getTranslation(field.label, 'en')}
                    data={field.options.map((opt) => ({
                      label: getTranslation(opt, 'en'),
                      value: getTranslation(opt, 'en'),
                    }))}
                    {...form.getInputProps(field.column)}
                  />
                );
              }
              if (field.fieldType === 'date') {
                return (
                  <DatePickerInput
                    valueFormat="YYYY MMM DD"
                    description={''}
                    label={getTranslation(field.label, 'en')}
                    required={field.required}
                    placeholder="Pick date"
                    mx="auto"
                    {...form.getInputProps(field.column)}
                  />
                );
              }
              return <Box></Box>;
            })}

          <Button type="submit" loading={loadingSubmission} className="primary" fullWidth>
            Submit
          </Button>
        </Box>
      </form>
    </AppLayout>
  );
}

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

/**
 * Default appointment object
 */
const defaultAppointment: Appointment = {
  id: '',
  providerId: null,
  clinicId: '',
  patientId: '',
  userId: '',
  currentVisitId: '',
  fulfilledVisitId: '',
  timestamp: new Date(),
  duration: 0,
  reason: '',
  notes: '',
  status: 'pending',
  metadata: {},
  isDeleted: false,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

type NewAppointmentFormProps = {
  visitId: string | null;
  patientId: string;
  onAppointmentCreated: () => void;
};

const durationOptions = [
  { label: 'Unknown', value: 0 },
  { label: '15 Minutes', value: 15 },
  { label: '30 Minutes', value: 30 },
  { label: '45 Minutes', value: 45 },
  { label: '1 Hour', value: 60 },
  { label: '2 Hours', value: 60 * 2 },
  { label: '3 Hours', value: 60 * 3 },
  { label: '8 Hours', value: 60 * 8 },
];

const reasonOptions = [
  { label: 'Screening', value: 'screening' },
  { label: 'Checkup', value: 'checkup' },
  { label: 'Follow-up', value: 'follow-up' },
  { label: 'Counselling', value: 'counselling' },
  { label: 'Procedure', value: 'procedure' },
  { label: 'Investigation', value: 'investigation' },
  { label: 'Other', value: 'other' },
];

function NewAppointmentForm({ visitId, patientId, onAppointmentCreated }: NewAppointmentFormProps) {
  const { clinics, loading: isLoadingClinics } = useClinicsList();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm({
    mode: 'controlled',
    initialValues: {
      ...defaultAppointment,
      duration: 0,
      patientId,
      visitId,
      reason: '',
      providerId: null,
      notes: '',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    },

    validate: {},
  });

  const createAppointment = async (values: any) => {
    if (isSubmitting) return;
    const validationError = validateAppointmentForm(values);
    if (validationError) {
      alert(validationError);
      return;
    }

    const duration = parseInt(String(values.duration), 0);
    setIsSubmitting(true);

    const token = localStorage.getItem('token');
    console.log({ token });

    try {
      const response = await axios.post(
        `${HIKMA_API}/v1/admin/appointments`,
        {
          ...values,
          duration,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: String(token),
          },
        }
      );

      console.log({ response });

      onAppointmentCreated?.();
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Failed to create appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingClinics) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  return (
    <Box>
      <Title order={3}>New Appointment</Title>

      <form onSubmit={form.onSubmit(createAppointment)} className="space-y-3">
        <DateTimePicker label="Appointment Time" {...form.getInputProps('timestamp')} />
        <Select
          label="Duration"
          {...form.getInputProps('duration')}
          data={durationOptions.map((d) => ({ label: d.label, value: d.value.toString() }))}
        />
        <Select
          label="Reason"
          {...form.getInputProps('reason')}
          data={reasonOptions.map((r) => ({ label: r.label, value: r.value }))}
        />
        <Select
          label="Clinic"
          {...form.getInputProps('clinicId')}
          data={clinics.map((c) => ({ label: c.name, value: c.id }))}
        />
        <Textarea label="Notes" {...form.getInputProps('notes')} />

        <Button type="submit" loading={isSubmitting} mt="lg" mb="md" className="primary" fullWidth>
          Create Appointment
        </Button>
      </form>
    </Box>
  );
}

/**
 * Validates the appointment form values
 * @param {Object} values - The form values to validate
 * @param {string} values.patientId - The patient ID
 * @param {string} values.clinicId - The clinic ID
 * @param {Date} values.timestamp - The appointment timestamp
 * @param {string|number} values.duration - The appointment duration
 * @returns {string|null} An error message if validation fails, or null if validation passes
 */
function validateAppointmentForm(values: {
  patientId: string;
  clinicId: string;
  timestamp: Date;
  duration: string | number;
}): string | null {
  if (!values.patientId || !values.clinicId || !values.timestamp) {
    return 'Please fill in all the required fields';
  }

  if (
    typeof values.patientId !== 'string' ||
    values.patientId.length <= 5 ||
    typeof values.clinicId !== 'string' ||
    values.clinicId.length <= 5
  ) {
    return 'Invalid patient ID or clinic ID';
  }

  if (!(values.timestamp instanceof Date) || isNaN(values.timestamp.getTime())) {
    return 'Invalid appointment time';
  }

  const duration = parseInt(String(values.duration), 10);
  if (isNaN(duration)) {
    return 'Invalid duration';
  }

  return null;
}
