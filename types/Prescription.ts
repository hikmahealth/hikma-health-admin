export const priorityValues = ['high', 'low', 'normal', 'emergency'] as const;
export const statusValues = [
  'pending',
  'prepared',
  'picked-up',
  'not-picked-up',
  'partially-picked-up',
  'cancelled',
  'other',
] as const;

export type PrescriptionStatus = (typeof statusValues)[number];
export type PrescriptionPriority = (typeof priorityValues)[number];

export type Prescription = {
  id: string; // UUID
  patient_id: string; // UUID
  provider_id: string; // UUID
  filled_by: string | null; // UUID
  pickup_clinic_id: string; // UUID
  visit_id: string | null; // UUID
  priority: PrescriptionPriority; // defaults to 'normal'
  expiration_date: string | null; // ISO DateTime string with timezone
  prescribed_at: string; // ISO DateTime string with timezone
  filled_at: string | null; // ISO DateTime string with timezone
  status: PrescriptionStatus; // defaults to 'pending'
  items: any[]; // JSON array
  notes: string;
  metadata: Record<string, any>; // JSON object
  is_deleted: boolean;
  created_at: string; // ISO DateTime string with timezone
  updated_at: string; // ISO DateTime string with timezone
  deleted_at: string | null; // ISO DateTime string with timezone
  last_modified: string; // ISO DateTime string with timezone
  server_created_at: string; // ISO DateTime string with timezone
};
