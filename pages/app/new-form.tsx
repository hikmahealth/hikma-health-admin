// @ts-nocheck
import {
  Button,
  Checkbox,
  Divider,
  Flex,
  Grid,
  Group,
  MultiSelect,
  NumberInput,
  Radio,
  Select,
  Textarea,
  TextInput,
} from '@mantine/core';
import axios from 'axios';
import { eq, omit } from 'lodash';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { v1 as uuidV1 } from 'uuid';
import { InputSettingsList } from '../../components/FormBuilder/InputSettingsList';
import AppLayout from '../../components/Layout';
import { languageOptions } from '../../data/languages';

import ComponentRegistry from '@/forms/components-registry';
import { FormBuilderContextProvider, useFormBuilderContext } from '../../forms/builder-context';
import { DoseUnit, FieldOption, HHField, HHFieldWithPosition } from '../../types/Inputs';
import { deduplicateOptions, safeJSONParse } from '../../utils/misc';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

// function createTextField(name = '', description = '', inputType: InputType = 'text'): TextField {
//   const baseInput: HHFieldBase = {
//     id: nanoid(),
//     name,
//     description,
//     inputType,
//     required: true,
//   };
//   switch (inputType) {
//     case 'textarea':
//       return { ...baseInput, fieldType: 'free-text', inputType, length: 'long' };
//     case 'text':
//     case 'number':
//     case 'email':
//     case 'password':
//     case 'tel':
//     default:
//       return { ...baseInput, fieldType: 'free-text', inputType, length: 'short' };
//   }
// }

// function createBinaryField(
//   name = '',
//   description = '',
//   inputType: BinaryField['inputType'] = 'checkbox',
//   options: BinaryField['options'] = []
// ): BinaryField {
//   return {
//     id: nanoid(),
//     name,
//     description,
//     inputType,
//     required: true,
//     fieldType: 'binary',
//     options,
//   };
// }

// TODO: Add createSelectField Method
// TODO: Add createRadioField Method

// function createMedicineField(
//   name = 'Medicine',
//   description = '',
//   inputType: MedicineField['inputType'] = 'input-group',
//   options: MedicineField['options'] = []
// ): MedicineField {
//   return {
//     id: nanoid(),
//     name,
//     description,
//     inputType,
//     required: true,
//     fieldType: 'medicine',
//     options,
//     fields: {
//       name: createTextField('Name', 'Name of the medicine'),
//       route: createOptionsField('Route', 'Route of the medicine', 'dropdown', [
//         'Oral',
//         'Intravenous',
//         'Intramuscular',
//         'Subcutaneous',
//         'Topical',
//         'Inhalation',
//         'Rectal',
//         'Ophthalmic',
//         'Otic',
//         'Nasal',
//         'Intranasal',
//         'Intradermal',
//         'Intraosseous',
//         'Intraperitoneal',
//         'Intrathecal',
//         'Intracardiac',
//         'Intracavernous',
//         'Intracerebral',
//         'Intracere',
//       ]),
//       form: createOptionsField('Form', 'Form of the medication', 'dropdown', [
//         'Tablet',
//         'Capsule',
//         'Liquid',
//         'Powder',
//         'Suppository',
//         'Inhaler',
//         'Patch',
//         'Cream',
//         'Gel',
//         'Ointment',
//         'Lotion',
//         'Drops',
//         'Spray',
//         'Syrup',
//         'Suspension',
//         'Injection',
//         'Implant',
//         'Implantable pump',
//         'Implantable reservoir',
//         'Implantable infusion system',
//         'Implantable drug delivery system',
//         'Implantable drug d',
//       ]),
//       dose: createTextField('Dose', 'Dose of the medicine'),
//       doseUnits: createOptionsField('Dosage Units', 'Units for the dosage', 'dropdown', [
//         'mg',
//         'g',
//         'ml',
//         'l',
//       ]),
//       frequency: createTextField('Frequency', 'Frequency of the medicine'),
//       intervals: createTextField('Intervals', 'Intervals of the medicine'),
//       duration: createTextField('Duration', 'Duration of the medicine'),
//       durationUnits: createOptionsField('Duration Units', 'Units for the duration', 'dropdown', [
//         'hours',
//         'days',
//         'weeks',
//         'months',
//         'years',
//       ]),
//     },
//   };
// }

// const createOptionsField = (
//   name = '',
//   description = '',
//   inputType: OptionsField['inputType'] = 'dropdown',
//   options: OptionsField['options'] = []
// ): OptionsField => {
//   return {
//     id: nanoid(),
//     name,
//     description,
//     inputType,
//     required: true,
//     fieldType: 'options',
//     multi: false,
//     options,
//   };
// };

// const createDiagnosisField = (
//   name = 'Diagnosis',
//   description = '',
//   inputType: OptionsField['inputType'] = 'dropdown',
//   options: OptionsField['options'] = []
// ): OptionsField => {
//   return {
//     id: nanoid(),
//     name,
//     description,
//     inputType,
//     required: true,
//     fieldType: 'diagnosis',
//     options,
//   };
// };

// const createDateField = (name = '', description = '', inputType = 'date'): DateField => {
//   return {
//     id: nanoid(),
//     name,
//     description,
//     inputType,
//     required: true,
//     fieldType: 'date',
//   };
// };

// let inputFieldOptions: Partial[] = ['binary', 'free-text', 'medicine'];

// type State = {
//   [id: string]: HHFieldWithPosition;
// };

// type Action =
//   /** Method used to override all internal fields with new fields. usefull for syncing with server/db */
//   | { type: 'set-form-state'; payload: { fields: HHFieldWithPosition[] } }
//   | { type: 'add-field'; payload: HHField }
//   | { type: 'remove-field'; payload: string }
//   /** For a drop down, update its options that are rendered in a select */
//   | { type: 'set-dropdown-options'; payload: { id: string; value: FieldOption[] } }
//   | { type: 'set-field-key-value'; payload: { id: string; key: string; value: any } }
//   | { type: 'add-units'; payload: { id: string; value: DoseUnit[] } }
//   | { type: 'remove-units'; payload: { id: string } }
//   | { type: 'reorder-fields'; payload: { ids: string[] } };

// const reducer = (state: State, action: Action) => {
//   switch (action.type) {
//     case 'set-form-state':
//       const { fields } = action.payload;
//       const formState = fields.reduce((prev, curr) => {
//         return {
//           ...prev,
//           [curr.id]: curr,
//         };
//       }, {});
//       return formState;
//     case 'add-field':
//       return {
//         ...state,
//         [action.payload.id]: {
//           position: Object.keys(state).length, // adds position after adding field
//           ...action.payload,
//         },
//       };
//     case 'remove-field':
//       const newState = { ...state };
//       delete newState[action.payload];
//       return newState;
//     case 'set-field-key-value':
//       return {
//         ...state,
//         [action.payload.id]: {
//           ...state[action.payload.id],
//           [action.payload.key]: action.payload.value,
//         },
//       };
//     case 'set-dropdown-options':
//       return {
//         ...state,
//         [action.payload.id]: {
//           ...state[action.payload.id],
//           options: action.payload.value,
//         },
//       };
//     case 'add-units':
//       return {
//         ...state,
//         [action.payload.id]: {
//           ...state[action.payload.id],
//           units: action.payload.value,
//         },
//       };
//     case 'remove-units':
//       return {
//         ...state,
//         [action.payload.id]: {
//           ...omit(state[action.payload.id], 'units'),
//         },
//       };
//     case 'reorder-fields':
//       const { ids } = action.payload;
//       const newOrder = ids.reduce((prev, curr, idx) => {
//         prev[curr] = {
//           ...prev[curr],
//           position: idx,
//         };
//         return prev;
//       }, state);
//       return { ...newOrder };
//     default:
//       return state;
//   }
// };

export default function NewFormBuilder() {
  const [err, setErr] = React.useState<null | string>(null);
  const [loading, setLoading] = React.useState(false);
  const [formFieldsState, setFormFieldsState] = React.useState<
    | undefined
    | {
        fields: any[];
        description: string;
        name: string;
        isSnapshot: boolean;
        isEditable: boolean;
      }
  >();
  const [formId, setFormId] = React.useState<null | string>(null);

  useEffect(() => {
    setFormId(null);
    const token = localStorage.getItem('token');
    if (!token) {
      alert("make sure you've logged in first");
      return;
    }

    const formId = new URLSearchParams(window.location.search).get('formId');
    if (formId != null && formId.length > 0) {
      setFormId(formId);
      setLoading(true);
      axios
        // TODO: change to new API
        .get(`${HIKMA_API}/admin_api/get_event_form?id=${formId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: String(token),
          },
        })
        .then((res) => {
          if (!res.data?.event_form) {
            throw new Error('This form does not seem to exist. Contact support.');
          }

          const event_form = res.data?.event_form;
          const { description, name, is_editable, is_snapshot_form, language } = event_form;

          // event_form.form_fields could be either an array, or a stringified JSON or neither
          // if it is a stringified array, try to parse it, if it fails, set it to an empty array
          let form_fields = [];
          try {
            form_fields = safeJSONParse<HHField[]>(event_form?.form_fields, []);
          } catch (e) {
            console.error(e);
            form_fields = [];
          }

          // Any form fields that are of fieldType "options", do not allow any duplicate options
          form_fields = form_fields.map((field: HHField) => {
            if (field.fieldType === 'options') {
              field.options = deduplicateOptions(field.options);
            }
            return field;
          });

          return {
            fields: form_fields,
            name,
            description,
            isEditable: is_editable,
            isSnapshot: is_snapshot_form,
          };
        })
        .then(setFormFieldsState)
        // dispatch({ type: 'set-form-state', payload: { fields: form_fields } });
        // setFormDescription(description);
        // setFormIsEditable(is_editable);
        // setFormName(name);
        // setFormIsSnapshot(is_snapshot_form);
        .catch((err) => {
          alert(err.message);
          console.error(err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [formId]);

  if (loading) {
    return <>Loading contents for a form with id={formId}</>;
  }

  if (err) {
    return <>Something went wrong. Couldn't load the contents {err}</>;
  }

  return (
    <FormBuilderContextProvider
      initialState={formFieldsState ? { fields: formFieldsState.fields } : undefined}
    >
      <AppLayout title="Form Builder" isLoading={loading}>
        <FormBuilderViewerLayout formId={formId} formData={omit(formFieldsState ?? {}, 'fields')} />
      </AppLayout>
    </FormBuilderContextProvider>
  );
}

function FormBuilderViewerLayout({ formId, formData }) {
  const router = useRouter();
  const [formName, setFormName] = useState(formData.name);
  const [language, setLanguage] = useState('en');
  const [formDescription, setFormDescription] = useState(formData.description);
  const [formIsEditable, setFormIsEditable] = useState(formData.isEditable);
  const [formIsSnapshot, setFormIsSnapshot] = useState(formData.isSnapshot);
  const [loadingSave, setLoadingSave] = useState(false);
  const [state, dispatch] = useFormBuilderContext();

  const addField = (field) => () => {
    dispatch({ type: 'add-field', payload: field });
  };

  const handleFieldRemove = (id: number) => {
    dispatch({ type: 'remove-field', payload: id });
  };

  const handleFieldChange = (id: number, key: string, value: any) => {
    dispatch({ type: 'set-field-key-value', payload: { index: id, key, value } });
  };

  const handleFieldOptionChange = (id: number, options: FieldOption[]) => {
    dispatch({ type: 'set-dropdown-options', payload: { index: id, value: options } });
  };

  const handleFieldUnitChange = (id: number, units: DoseUnit[] | false) => {
    if (!units) {
      dispatch({ type: 'remove-units', payload: { index: id } });
      return;
    }
    dispatch({ type: 'add-units', payload: { index: id, value: units } });
  };

  const handleFieldsReorder = (ids: number[]) => {
    dispatch({ type: 'reorder-fields', payload: { indices: ids } });
  };

  // const dndData = sortBy(Object.values(state), ['position']).map((field) => ({
  //   ...field,
  // }));
  // const dndData = useMemo(() => sortBy(Object.values(state), ['position']), [Object.values(state)]);

  const handleSaveForm = () => {
    if (loadingSave) return;
    const form = {
      // if the formId exists, use that one. the backend will update the value
      id: formId ? formId : uuidV1(),
      name: formName,
      description: formDescription,
      language,
      is_editable: formIsEditable,
      is_snapshot_form: formIsSnapshot,
      form_fields: JSON.stringify(state.fields),
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLoadingSave(true);
    const token = localStorage.getItem('token') || '';

    let result: Promise;

    if (formId && formId.length > 5) {
      // a form is being edited.
      result = axios.post(
        `${HIKMA_API}/admin_api/update_event_form`,
        {
          id: formId,
          updates: {
            ...omit(form, ['createdAt', 'id', 'updatedAt']),
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: String(token),
          },
        }
      );
    } else {
      result = axios.post(
        `${HIKMA_API}/admin_api/save_event_form`,
        {
          event_form: form,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: String(token),
          },
        }
      );
    }
    result
      .then(function (response) {
        alert('Form saved!');
        setLoadingSave(false);
        router.back();
        console.log(response);
      })
      .catch(function (error) {
        alert('Error saving form. Please try signing in first.');
        setLoadingSave(false);
        console.log(error);
      });
  };

  console.log('FORM DATA', formData);

  return (
    <Grid className="m-0 " gap="4">
      <Grid.Col span={5} className="overflow-y-scroll h-screen px-2 pt-4">
        {/*           <h4 className='text-2xl mb-2'>Form Builder</h4> */}
        <TextInput
          label="Form Title"
          className="mb-4"
          onChange={(e) => setFormName(e.target.value)}
          value={formName}
          placeholder="Form Name"
        />
        <Select
          label="Form Language"
          searchable
          onChange={setLanguage}
          className="mb-4"
          placeholder="Pick one"
          value={language}
          data={languageOptions}
        />
        <Textarea
          label="Form Description"
          value={formDescription}
          className="mb-4"
          onChange={(e) => setFormDescription(e.target.value)}
          placeholder="Form Description"
        />
        <Checkbox
          checked={formIsEditable}
          label="This form can be edited/updated after being submitted by clinicians"
          className="mb-4"
          onChange={(event) => setFormIsEditable(event.currentTarget.checked)}
        />

        <Checkbox
          checked={formIsSnapshot}
          label="This form should appear on the quick snapshot view of the patient file"
          className="mb-4"
          onChange={(event) => setFormIsSnapshot(event.currentTarget.checked)}
        />

        <InputSettingsList
          fields={state.fields}
          onRemoveField={handleFieldRemove}
          onFieldChange={handleFieldChange}
          onFieldOptionChange={handleFieldOptionChange}
          onFieldUnitChange={handleFieldUnitChange}
          onReorder={handleFieldsReorder}
        />
        <br />
        <Divider my="sm" label="Add Input To Form" labelPosition="center" />
        <AddFormInputButtons addField={addField} />
        <Button loading={loadingSave} onClick={handleSaveForm} fullWidth className="my-8 primary">
          Save Form
        </Button>
      </Grid.Col>
      <Grid.Col
        dir={isRtlLanguage(language) ? 'rtl' : 'ltr'}
        span={7}
        className="space-y-4 px-12 py-8 overflow-y-scroll h-screen"
      >
        <FormPreviewer name={formName} />
      </Grid.Col>
    </Grid>
  );
}

function FormPreviewer({ name }: { name: string }) {
  const [state] = useFormBuilderContext();

  return (
    <>
      <h4 className="text-2xl mb-2">{name}</h4>
      {state.fields.map((field, idx) => {
        // FUTURE: might want to pass the component into state tree
        // instead of ALWAYS doing a .find
        const component = ComponentRegistry.find(
          (d) => d.field.fieldType === field.fieldType && d.field.inputType === field.inputType
        );

        if (component) {
          // this doesn't work properly
          // name isn't being populated. please check this
          return (
            <React.Fragment key={field.id + '_' + idx}>
              <component.render field={field} />
            </React.Fragment>
          );
        }

        return null;
      })}
    </>
  );
}

/**
 * Bottom row containing the list of components a user can choose from
 */
const AddFormInputButtons = ({ addField }: { addField: (field: any) => void }) => {
  return (
    <Flex wrap="wrap" gap="sm">
      <>
        {ComponentRegistry.map(({ button, field }, ix) => (
          <Button
            size="md"
            key={ix}
            onClick={addField(field)}
            leftIcon={button.icon}
            className="primary"
          >
            {button.label}
          </Button>
        ))}
      </>
    </Flex>
  );
};

type FreeTextInputProps = {
  field: HHFieldWithPosition | HHField;
};

const WithUnits = ({
  field,
  children,
}: {
  field: HHFieldWithPosition | HHField;
  children: React.ReactNode;
}) => {
  const hasUnits = field.units && field.units.length > 0;
  console.log('Has units: ', field.units);
  const dedupUnits = deduplicateOptions(field?.units || []);
  return (
    <div className={`flex flex-row ${hasUnits ? 'space-x-4' : ''}`}>
      <div className="flex-1"> {children}</div>
      {hasUnits && <Select label="Units" description=" " data={dedupUnits} />}
    </div>
  );
};

export const FreeTextInput = React.memo(
  ({ field }: FreeTextInputProps) => {
    const inputProps = {
      placeholder: field.placeholder,
      label: field.name,
      description: field.description,
      required: field.required,
      // value: field.value,
    };
    switch (field.inputType) {
      case 'textarea':
        return <Textarea {...inputProps} field={field} />;
      case 'number':
        return (
          <WithUnits field={field}>
            {' '}
            <NumberInput {...inputProps} field={field} />{' '}
          </WithUnits>
        );
      case 'text':
      default:
        return <TextInput {...inputProps} field={field} />;
    }
  },
  (prev, next) => eq(prev.field, next.field)
);

type OptionsInputProps = {
  field: HHFieldWithPosition | HHField;
};

export const OptionsInput = React.memo(
  ({ field }: OptionsInputProps) => {
    const inputProps = {
      placeholder: field.placeholder,
      label: field.name,
      description: field.description,
      required: field.required,
      multi: field.multi,
      // value: field.value,
    };

    switch (field.inputType) {
      case 'radio':
        return (
          <Radio.Group name={field.name} {...inputProps} field={field}>
            <Group mt="xs">
              {field.options.map((option) => (
                <Radio key={option.value} value={option.value} label={option.label} />
              ))}
            </Group>
          </Radio.Group>
        );
      case 'select':
      default:
        if (field.multi) {
          return (
            <MultiSelect
              data={field.options}
              multiple={field.multi}
              {...inputProps}
              field={field}
            />
          );
        } else {
          return (
            <Select data={field.options} multiple={field.multi} {...inputProps} field={field} />
          );
        }
    }
  },
  (pres, next) => eq(pres.field, next.field)
);

const isRtlLanguage = (language: string) => {
  return language === 'ar';
};
