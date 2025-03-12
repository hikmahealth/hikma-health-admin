import { ICD11Diagnosis, InputType, Medication } from './misc';
import { Patient } from './Patient';

export const eventTypes = [
  'Patient Summary',
  'Camp',
  'Visit Type',
  'Vitals',
  'Examination',
  'Examination Full',
  'Medicine',
  'Complaint',
  'Treatment',
  'Diagnosis',
  'Medicine Dispensed',
  'Prescriptions',
  'Allergies',
  'Medical History',
  'Medical History Full',
  'Notes',
  'COVID-19 Screening',
  'Dental Treatment',
  'Physiotherapy',
] as const;

export type EventTypes = (typeof eventTypes)[number];

export type Event = {
  id: string;
  patientId: string;
  visitId: string;
  eventType: EventTypes;
  eventMetadata: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type EventRow = {
  columns: string[]; // a list of the column names (human readble prefferable)
  values: Array; // (list of the values)
};

export type MultipleEventRows = {
  columns: string[];
  values: Array;
};

type FormDataEntry = {
  fieldId: string;
  fieldType: string; // TODO: convert to correct type
  inputType: InputType;
  name: string;
  value: string | number | ICD11Diagnosis[] | Medication[];
};

export type EventResponse = {
  formId: string;
  eventType: string;
  formData: FormDataEntry[];
  isDeleted: boolean;
  patientId: string;
  visitId: string;
  patient: Patient & {
    additional_attributes: {
      [uuid: string]: {
        attribute: string;
        boolean_value: null | boolean | string;
        date_value: null | Date | string;
        number_value: null | number | string;
        string_value: null | string;
      };
    };
    additional_data: Record;
    metadata: Record;
    [key: string]: any;
  };
  [key: string]: any;
};
