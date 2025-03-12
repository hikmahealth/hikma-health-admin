export type Patient = {
  id: string;
  givenName: string;
  surname: string;
  dateOfBirth: string;
  country: string;
  hometown: string;
  sex: string;
  phone: string;
  camp: string;
  additional_data: Record[];
  createdAt: Date;
  updatedAt: Date;

  // convenience fields for the data from directly from the server
  given_name: string;
  date_of_birth: string;
  created_at: string;
  updated_at: string;
};

export type PatientRow = {
  columns: string[]; // a list of the column names (human readble prefferable)
  values: Array; // (list of the values)
};

export type MultiplePatientRows = {
  columns: string[];
  values: Array;
};

export type PatientRes = {
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
