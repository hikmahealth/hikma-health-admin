import { DiagnosisSelect } from '@/components/FormBuilder/DiagnosisPicker';
import { MedicineInput } from '@/components/FormBuilder/MedicineInput';
import { deduplicateOptions } from '@/utils/misc';
import { FileInput, NumberInput, Select, TextInput, Textarea } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconCalendar,
  IconList,
  IconMedicineSyrup,
  IconNotes,
  IconNumbers,
  IconReportMedical,
  IconTextSize,
} from '@tabler/icons-react';
import { OptionsInput } from './components/input';
import {
  TextField,
  createDateField,
  createDiagnosisField,
  createMedicineField,
  createOptionsField,
  createTextField,
  fieldFile,
} from './fields';
import { createComponent } from './utils';

const FreeTextInput = function ({ field }: { field: TextField }) {
  const inputProps = {
    // @ts-expect-error
    placeholder: field?.placeholder,
    label: field.name,
    description: field.description,
    required: field.required,
    // value: field.value,
  };

  switch (field.inputType) {
    case 'textarea':
      return <Textarea minRows={4} {...inputProps} />;
    case 'number': {
      // @ts-expect-error
      const units = field?.units ?? [];
      const hasUnits = units && units.length > 0;
      const dedupUnits = deduplicateOptions(units);
      return (
        <div className={`flex flex-row ${hasUnits ? 'space-x-4' : ''}`}>
          <div className="flex-1">
            {' '}
            <NumberInput {...inputProps} />
            {hasUnits && <Select label="Units" description=" " data={dedupUnits} />}
          </div>
        </div>
      );
    }
    case 'text':
    default:
      return <TextInput {...inputProps} />;
  }
};

// List of components a user can use to build
// forms
const ComponentRegistry = [
  createComponent(createTextField(), {
    label: 'Text',
    icon: <IconTextSize />,
    render: FreeTextInput,
  }),
  createComponent(createTextField({ inputType: 'textarea' }), {
    label: 'Text Long',
    icon: <IconNotes />,
    render: FreeTextInput,
  }),
  createComponent(createTextField({ name: 'Number', inputType: 'number' }), {
    label: 'Number',
    icon: <IconNumbers />,
    render: FreeTextInput,
  }),
  createComponent(createDateField(), {
    label: 'Date',
    icon: <IconCalendar />,
    render: function ({ field }) {
      return (
        <DatePickerInput
          valueFormat="YYYY MMM DD"
          description={field.description}
          label={field.name}
          required={field.required}
          placeholder="Pick date"
          mx="auto"
        />
      );
    },
  }),
  // @ts-expect-error
  createComponent(createOptionsField({ inputType: 'radio' }), {
    label: 'Options',
    icon: <IconList />,
    render: OptionsInput,
  }),

  // @ts-expect-error
  createComponent(createOptionsField({ inputType: 'select', multi: true }), {
    label: 'Select / Dropdown',
    icon: <IconList />,
    render: OptionsInput,
  }),
  // @ts-expect-error
  createComponent(createMedicineField(), {
    label: 'Medicine',
    icon: <IconMedicineSyrup />,
    render: MedicineInput,
  }),
  // @ts-expect-error
  createComponent(createDiagnosisField(), {
    label: 'Diagnosis',
    icon: <IconReportMedical />,
    render: DiagnosisSelect,
  }),
  createComponent(fieldFile(), {
    label: 'File',
    icon: <IconCalendar />,
    render: function ({ field }) {
      return (
        <FileInput
          accept={field.allowedMimeTypes ? field.allowedMimeTypes.join(',') : undefined}
          multiple={field.multiple}
          label={field.name}
          required={field.required}
          description={field.description}
        />
      );
    },
  }),
];

export default ComponentRegistry;
