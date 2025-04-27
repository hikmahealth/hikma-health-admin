import { BinaryField, DateField, InputType, MedicineField, OptionsField } from '@/types/Inputs';
import { nanoid } from 'nanoid';
import { withRequiredFields } from './utils';

const MIME_IMAGE_TYPES = ['image/png', 'image/jpeg'] as const;
const MIME_DOCUMENT_TYPES = ['application/pdf'] as const;

const ALL_MIME_TYPES = [...MIME_IMAGE_TYPES, ...MIME_DOCUMENT_TYPES];
type SupportedMIMEType = (typeof ALL_MIME_TYPES)[number];

/**
 * Description of a field that accepts a file as input
 * @param opts
 * @returns
 */
export const fieldFile = function (
  opts: Partial<
    {
      name: string;
      description: string;
      fileType: 'image' | 'documents' | 'all';
    } & (
      | {
          allowMultiple: false;
        }
      | { allowMultiple: true; max: number; min: number }
    )
  > = {}
) {
  let [minItems, maxItems] = [1, 1];

  if (opts.allowMultiple) {
    [minItems, maxItems] = [opts.min ?? 1, opts.max ?? 1];
    if (!(minItems <= maxItems)) {
      throw new Error('invalid component types. `min` can not be greater than `max`.');
    }
  }

  let allowedMimeTypes: SupportedMIMEType[] | null = null;
  if (opts.fileType) {
    if (opts.fileType === 'image') {
      // @ts-ignore readonly array
      allowedMimeTypes = MIME_IMAGE_TYPES;
    }

    if (opts.fileType === 'documents') {
      // @ts-ignore readonly array
      allowedMimeTypes = MIME_DOCUMENT_TYPES;
    }

    if (opts.fileType === 'all') {
      allowedMimeTypes = ALL_MIME_TYPES;
    }
  }

  // NOTE: depending on how this goes, we might as well just have `zod`.
  //  I think it's a good ideal to ensure the types can be validated on a JS level,
  //
  // Optionally, You can use information from `InputType` and `FieldType`
  return withRequiredFields<{ fieldType: 'file' | 'image'; inputType: 'file' }>()({
    name: opts.name ?? '',
    description: opts.description ?? '',
    required: true,
    fieldType: 'file',
    inputType: 'file',
    allowedMimeTypes: allowedMimeTypes,
    multiple: opts?.allowMultiple ?? true,
    minItems: minItems,
    maxItems: maxItems,
  });
};

export type FileField = ReturnType<typeof fieldFile>;

// for it to quality as a field
// it must have the following
export type BasicField = { fieldType: string; inputType: string };

export function createTextField(
  opts?: Partial<{
    name: string;
    description: string;
    inputType: InputType;
  }>
) {
  const _type = opts?.inputType ?? 'text';
  let length: 'long' | 'short';
  switch (_type) {
    case 'textarea': {
      length = 'long';
    }
    default: {
      length = 'short';
    }
  }

  return withRequiredFields<{
    fieldType: 'free-text';
    inputType: InputType;
  }>()({
    fieldType: 'free-text',
    inputType: _type,
    name: opts?.name ?? '',
    description: opts?.description ?? '',
    length,
  });
}

export type TextField = ReturnType<typeof createTextField>;

export function createBinaryField(
  name = '',
  description = '',
  inputType: BinaryField['inputType'] = 'checkbox',
  options: BinaryField['options'] = []
): BinaryField {
  return {
    id: nanoid(),
    name,
    description,
    inputType,
    required: true,
    fieldType: 'binary',
    options,
  };
}

// TODO: Add createSelectField Method
// TODO: Add createRadioField Method

export function createMedicineField(
  name = 'Medicine',
  description = '',
  inputType: MedicineField['inputType'] = 'input-group',
  options: MedicineField['options'] = []
): MedicineField {
  return {
    id: nanoid(),
    name,
    description,
    inputType,
    required: true,
    fieldType: 'medicine',
    options,
    fields: {
      name: createTextField('Name', 'Name of the medicine'),
      route: createOptionsField('Route', 'Route of the medicine', 'dropdown', [
        'Oral',
        'Intravenous',
        'Intramuscular',
        'Subcutaneous',
        'Topical',
        'Inhalation',
        'Rectal',
        'Ophthalmic',
        'Otic',
        'Nasal',
        'Intranasal',
        'Intradermal',
        'Intraosseous',
        'Intraperitoneal',
        'Intrathecal',
        'Intracardiac',
        'Intracavernous',
        'Intracerebral',
        'Intracere',
      ]),
      form: createOptionsField('Form', 'Form of the medication', 'dropdown', [
        'Tablet',
        'Capsule',
        'Liquid',
        'Powder',
        'Suppository',
        'Inhaler',
        'Patch',
        'Cream',
        'Gel',
        'Ointment',
        'Lotion',
        'Drops',
        'Spray',
        'Syrup',
        'Suspension',
        'Injection',
        'Implant',
        'Implantable pump',
        'Implantable reservoir',
        'Implantable infusion system',
        'Implantable drug delivery system',
        'Implantable drug d',
      ]),
      dose: createTextField('Dose', 'Dose of the medicine'),
      doseUnits: createOptionsField('Dosage Units', 'Units for the dosage', 'dropdown', [
        'mg',
        'g',
        'ml',
        'l',
      ]),
      frequency: createTextField('Frequency', 'Frequency of the medicine'),
      intervals: createTextField('Intervals', 'Intervals of the medicine'),
      duration: createTextField('Duration', 'Duration of the medicine'),
      durationUnits: createOptionsField('Duration Units', 'Units for the duration', 'dropdown', [
        'hours',
        'days',
        'weeks',
        'months',
        'years',
      ]),
    },
  };
}

export const createOptionsField = (
  name = '',
  description = '',
  inputType: OptionsField['inputType'] = 'dropdown',
  options: OptionsField['options'] = []
): OptionsField => {
  return {
    id: nanoid(),
    name,
    description,
    inputType,
    required: true,
    fieldType: 'options',
    multi: false,
    options,
  };
};

export const createDiagnosisField = (
  name = 'Diagnosis',
  description = '',
  inputType: OptionsField['inputType'] = 'dropdown',
  options: OptionsField['options'] = []
): OptionsField => {
  return {
    id: nanoid(),
    name,
    description,
    inputType,
    required: true,
    fieldType: 'diagnosis',
    options,
  };
};

export const createDateField = (name = '', description = '', inputType = 'date'): DateField => {
  return {
    id: nanoid(),
    name,
    description,
    inputType,
    required: true,
    fieldType: 'date',
  };
};
