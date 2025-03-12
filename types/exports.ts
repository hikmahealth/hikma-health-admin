export namespace DataExport {
  type Appointment = {
    clinic_id: string;
    created_at: string;
    current_visit_id: string;
    deleted_at: string | null;
    duration: number;
    fulfilled_visit_id: string | null;
    id: string;
    is_deleted: boolean;
    last_modified: string;
    metadata: string;
    notes: string;
    patient_id: string;
    provider_id: string | null;
    reason: string;
    server_created_at: string;
    status: string;
    timestamp: string;
    updated_at: string;
    user_id: string;
  };

  type Clinic = {
    created_at: string;
    deleted_at: string | null;
    id: string;
    is_deleted: boolean;
    last_modified: string;
    name: string;
    server_created_at: string;
    updated_at: string;
  };

  type EventForm = {
    created_at: string;
    deleted_at: string | null;
    description: string;
    form_fields: string; // Keep as string for now, this is actually a JSON object
    id: string;
    is_deleted: boolean;
    is_editable: boolean;
    is_snapshot_form: boolean;
    language: string;
    last_modified: string;
    metadata: Record; // Or a more specific type if known
    name: string;
    server_created_at: string;
    updated_at: string;
  };

  type PatientEvent = {
    created_at: string;
    deleted_at: string | null;
    event_type: string;
    form_data: FormData[];
    form_id: string;
    id: string;
    is_deleted: boolean;
    last_modified: string;
    metadata: Record; // Or a more specific type if known
    patient_id: string;
    server_created_at: string;
    updated_at: string;
    visit_id: string;
  };

  type PatientAttribute = {
    attribute: string;
    attribute_id: string;
    boolean_value: boolean | null;
    created_at: string;
    date_value: string | null;
    deleted_at: string | null;
    id: string;
    is_deleted: boolean;
    last_modified: string;
    metadata: Record; // Or a more specific type if known
    number_value: number | null;
    patient_id: string;
    server_created_at: string;
    string_value: string | null;
    updated_at: string;
  };

  type Label = {
    ar: string;
    en: string;
    es: string;
  };

  type Option = {
    ar: string;
    en: string;
    es: string;
  };

  type Field = {
    baseField: boolean;
    column: string;
    fieldType: string;
    id: string;
    isSearchField?: boolean; // Optional
    label: Label;
    options: Option[];
    position: number;
    required: boolean;
    visible: boolean;
    deleted?: boolean; // Optional for deleted fields
    showsInSummary?: boolean; // Optional
  };

  type PatientRegistrationForm = {
    clinic_id: string | null;
    created_at: string;
    deleted_at: string | null;
    fields: Field[];
    id: string;
    is_deleted: boolean;
    last_modified: string;
    metadata: Record;
    name: string;
    server_created_at: string;
    updated_at: string;
  };

  export type Export = {
    data: {
      appointments: Appointment[];
      clinics: Clinic[];
      event_forms: EventForm[];
      events: PatientEvent[];
      patient_additional_attributes: PatientAttribute[];
      patients: Patient[];
      patient_registration_forms: PatientRegistrationForm[];
      string_content: [];
      string_ids: [];
      users: User[];
      visits: Visit[];
    };
    exported_at: string;
    schema_version: string;
  };

  type User = {
    clinic_id: string;
    created_at: string;
    deleted_at: string | null;
    email: string;
    hashed_password: string;
    id: string;
    instance_url: string | null;
    is_deleted: boolean;
    last_modified: string;
    name: string;
    role: string; // You might want to use an enum for roles
    server_created_at: string;
    updated_at: string;
  };

  type Visit = {
    check_in_timestamp: string;
    clinic_id: string;
    created_at: string;
    deleted_at: string | null;
    id: string;
    is_deleted: boolean;
    last_modified: string;
    metadata: Record; // Or a more specific type if known
    patient_id: string;
    provider_id: string;
    provider_name: string;
    server_created_at: string;
    updated_at: string;
  };

  type Patient = {
    additional_data: Record;
    camp: string;
    citizenship: string;
    created_at: string;
    date_of_birth: string;
    deleted_at: string | null;
    external_patient_id: string;
    given_name: string;
    government_id: string;
    hometown: string;
    id: string;
    image_timestamp: string | null;
    is_deleted: boolean;
    last_modified: string;
    metadata: Record;
    phone: string;
    photo_url: string | null;
    server_created_at: string;
    sex: string; // Consider using an enum here as well (e.g., "male", "female", "other")
    surname: string;
    updated_at: string;
  };
}

let emptyExportData: DataExport.Export = {
  data: {
    appointments: [],
    clinics: [],
    event_forms: [],
    events: [],
    patient_additional_attributes: [],
    patients: [],
    patient_registration_forms: [],
    string_content: [],
    string_ids: [],
    users: [],
    visits: [],
  },
  exported_at: '2024-11-17T16:33:24.836576+00:00',
  schema_version: '1.0',
};
