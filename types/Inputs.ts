import { FileField } from '../forms/fields';

// INPUT TYPES FOR CUSTOM FORMS & WORKFLOWS
export type InputType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'password'
  | 'date'
  | 'time'
  | 'datetime'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'file'
  | 'image'
  | 'url'
  | 'tel'
  | 'color'
  | 'range'
  | 'hidden'
  | 'submit'
  | 'reset'
  | 'button'
  | 'search'
  | 'month'
  | 'week'
  | 'datetime-local'
  | 'custom';

export type FieldType =
  | 'binary'
  | 'medicine'
  | 'diagnosis'
  | 'dosage'
  | 'free-text'
  | 'input-group'
  | 'file'
  | 'options'
  | 'date'
  | 'custom';

export type HHFieldBase = {
  id: string;
  name: string;
  description: string;
  required: boolean;
};

export type DurationUnit = 'hours' | 'days' | 'weeks' | 'months' | 'years';
export type MeasurementUnit =
  | 'cm'
  | 'm'
  | 'kg'
  | 'lb'
  | 'in'
  | 'ft'
  | 'mmHg'
  | 'cmH2O'
  | 'mmH2O'
  | '°C'
  | '°F'
  | 'BPM'
  | 'P'
  | 'mmol/L'
  | 'mg/dL'
  | '%'
  | 'units';
export type DoseUnit = 'mg' | 'g' | 'mcg' | 'mL' | 'L' | 'units';

export type MedicineRoute =
  | 'oral'
  | 'sublingual'
  | 'rectal'
  | 'topical'
  | 'inhalation'
  | 'intravenous'
  | 'intramuscular'
  | 'intradermal'
  | 'subcutaneous'
  | 'nasal'
  | 'ophthalmic'
  | 'otic'
  | 'vaginal'
  | 'transdermal'
  | 'other';
export type MedicineForm =
  | 'tablet'
  | 'syrup'
  | 'ampule'
  | 'suppository'
  | 'cream'
  | 'drops'
  | 'bottle'
  | 'spray'
  | 'gel'
  | 'lotion'
  | 'inhaler'
  | 'capsule'
  | 'injection'
  | 'patch'
  | 'other';

export type FieldOption = {
  label: string;
  value: string;
  options?: FieldOption[];
};

export type BinaryField = HHFieldBase & {
  fieldType: 'binary';
  inputType: 'checkbox' | 'radio' | 'select';
  options: FieldOption[];
};

export type OptionsField = HHFieldBase &
  (
    | {
        fieldType: 'options';
        inputType: 'radio';
        multi: false;
        options: FieldOption[];
      }
    | {
        fieldType: 'options';
        inputType: 'checkbox' | 'select';
        multi: boolean;
        options: FieldOption[];
      }
  );

export type DiagnosisField = HHFieldBase & {
  fieldType: 'diagnosis';
  inputType: 'select';
  options: FieldOption[];
};

export type TextField = HHFieldBase &
  (
    | {
        fieldType: 'free-text';
        inputType: 'text' | 'number' | 'email' | 'password' | 'tel';
        length: 'short';
        units?: DoseUnit[] | DurationUnit[];
      }
    | {
        fieldType: 'free-text';
        inputType: 'textarea';
        length: 'long';
        units?: DoseUnit[] | DurationUnit[];
      }
  );

export type MedicineFieldOptions = string[] | FieldOption[];

export type MedicineField = HHFieldBase & {
  fieldType: 'medicine';
  inputType: 'input-group';
  options: MedicineFieldOptions;
  fields: {
    name: TextField;
    route: MedicineRoute;
    form: MedicineForm;
    frequency: TextField;
    intervals: TextField;
    dose: TextField;
    doseUnits: DoseUnit;
    duration: TextField;
    durationUnits: DurationUnit;
  };
};

type MedicationEntry = {
  name: string;
  route: MedicineRoute;
  form: MedicineForm;
  frequency: number;
  intervals: number;
  dose: number;
  doseUnits: DoseUnit;
  duration: number;
  durationUnits: DurationUnit;
};

export type DateField = HHFieldBase & {
  fieldType: 'date';
  inputType: 'date';
  min?: Date;
  max?: Date;
};

export type HHField =
  | BinaryField
  | TextField
  | MedicineField
  | DiagnosisField
  | DateField
  | OptionsField;

export type HHFieldWithPosition = (
  | BinaryField
  | TextField
  | MedicineField
  | DiagnosisField
  | OptionsField
  | DateField
  | FileField
) & { position: number };

// Two letter iso639-2 language code
// as seen here: https://www.loc.gov/standards/iso639-2/php/code_list.php
export type Language =
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'pt'
  | 'ru'
  | 'zh'
  | 'ja'
  | 'ar'
  | 'hi'
  | 'bn'
  | 'pa'
  | 'jv'
  | 'ko'
  | 'vi'
  | 'ta'
  | 'ur'
  | 'fa'
  | 'tr'
  | 'pl'
  | 'uk'
  | 'ro'
  | 'nl'
  | 'hu'
  | 'el'
  | 'cs'
  | 'sv'
  | 'ca'
  | 'fi'
  | 'he'
  | 'no'
  | 'id'
  | 'ms'
  | 'da'
  | 'sk'
  | 'lt'
  | 'hr'
  | 'sr'
  | 'sl'
  | 'et'
  | 'lv'
  | 'th'
  | 'az'
  | 'hy'
  | 'ka'
  | 'eu'
  | 'gl'
  | 'be'
  | 'mk'
  | 'bs'
  | 'is'
  | 'sq'
  | 'kk'
  | 'ky'
  | 'tg'
  | 'uz'
  | 'tk'
  | 'mn'
  | 'ja'
  | 'ko'
  | 'zh'
  | 'vi'
  | 'th'
  | 'lo'
  | 'km'
  | 'my'
  | 'km'
  | 'my'
  | 'ne'
  | 'si'
  | 'am'
  | 'ti'
  | 'so'
  | 'sw'
  | 'rw'
  | 'ny'
  | 'mg'
  | 'eo'
  | 'cy'
  | 'gd'
  | 'ga'
  | 'gd'
  | 'ga'
  | 'af'
  | 'zu'
  | 'xh'
  | 'st'
  | 'tn'
  | 'ts'
  | 'ss'
  | 've'
  | 'nr'
  | 'wo'
  | 'fy';

export type LanguageOption = {
  label: string;
  value: Language;
};

export type HHForm = {
  id: string;
  name: string;
  description: string;
  language: Language;
  is_editable: boolean;
  is_snapshot_form: boolean;
  fields: HHField[];
  form_fields: HHField[];
  createdAt: Date;
  updatedAt: Date;
};
