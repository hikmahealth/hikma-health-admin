import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Grid,
  InputLabel,
  Loader,
  LoadingOverlay,
  Paper,
  Popover,
  Radio,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDebouncedValue } from '@mantine/hooks';
import {
  IconCalendarBolt,
  IconList,
  IconMedicineSyrup,
  IconMinus,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUser,
} from '@tabler/icons-react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';
import { max } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { v4 as uuidv4 } from 'uuid';
import If from '../../components/If';
import AppLayout from '../../components/Layout';
import { useEventForms } from '../../hooks/useEventForms';
import { usePatientRegistrationForm } from '../../hooks/usePatientRegistrationForm';
import { Event } from '../../types/Event';
import { FieldOption, HHForm } from '../../types/Inputs';
import { Patient } from '../../types/Patient';
import { Prescription } from '../../types/Prescription';
import { getTopNWithOther } from '../../utils/misc';
import { Appointment } from './appointments/list';
import { RegistrationForm, RegistrationFormField } from './patients/registration-form';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

type ExplorerOperator =
  | 'contains'
  | 'does not contain'
  | 'is empty'
  | 'is not empty'
  | '='
  | '<'
  | '>'
  | '<='
  | '>='
  | '!=';

const operators: { value: ExplorerOperator; label: string }[] = [
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '=', label: '=' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: '!=', label: '≠' },
  { value: 'contains', label: 'contains' },
  { value: 'does not contain', label: 'does not contain' },
  { value: 'is empty', label: 'is empty' },
  { value: 'is not empty', label: 'is not empty' },
];

/**
 * Returns a registration form field by id
 * @param fieldId
 * @param form
 * @returns
 */
const getPatientFormField = (
  fieldId: string,
  form: RegistrationForm
): RegistrationFormField | undefined => {
  return form.fields.find((f) => f.id === fieldId);
};

type PatientFiltersProps = {
  form: RegistrationForm;
  filterFieldRules: FilterRule[];
  onRemove: () => void;
  onUpdateRule: (rule: FilterRule) => void;
  onAddRule: () => void;
  onRemoveRule: (id: string) => void;
  dateRanges: [Date | null, Date | null];
  setPatientDateRanges: (dateRanges: [Date | null, Date | null]) => void;
};
function PatientFilters({
  form,
  filterFieldRules,
  onRemove,
  onUpdateRule,
  onAddRule,
  onRemoveRule,
  dateRanges,
  setPatientDateRanges,
}: PatientFiltersProps) {
  const fieldNames = form.fields
    .filter((f) => f.deleted !== true && f.label?.en)
    .map((f) => ({ label: f?.label?.en || 'error', value: f.id }))
    .filter((f) => f.label !== 'error' && f.value);

  const handleUpdateRuleField = (field: FilterRule, columnId: string) => {
    const columnName = form.fields.find((f) => f.id === columnId)?.column;
    if (!columnName) {
      return;
    }
    const fieldType = form.fields.find((f) => f.id === columnId)?.fieldType;
    const newRule: FilterRule = {
      ...field,
      // VERY IMPORTANT TO CHANGE THE ID TO MATCH THE COLUMN
      fieldId: columnId,
      field: columnName,
      dataType: explorerDataTypes.includes(fieldType as any) ? fieldType : ('text' as any),
      value: '',
    };
    onUpdateRule(newRule);
  };

  const valueOptions = (fieldId: string, form: RegistrationForm) => {
    const formField = getPatientFormField(fieldId, form);
    if (!formField) return [];

    console.log({ formField });
    return formField.options.map((o) => ({ value: o.en, label: o.en }));
  };

  const getFormValueField = (field: FilterRule, form: RegistrationForm) => {
    const formField = getPatientFormField(field.fieldId, form);
    const defaultInput = (
      <TextInput
        defaultValue={field.value}
        label="Value"
        onChange={(e) => onUpdateRule({ ...field, value: e.target.value })}
      />
    );

    if (!formField) return defaultInput;

    if (formField.fieldType === 'select') {
      return (
        <>
          <InputLabel>Value</InputLabel>
          <Select
            classNamePrefix="dark-select"
            className="dark-select-container"
            defaultValue={field.value}
            // @ts-ignore
            options={valueOptions(field.fieldId as any, form)}
            // @ts-ignore
            onChange={(opt) => onUpdateRule({ ...field, value: opt?.value || ('' as any) })}
          />
        </>
      );
    } else if (formField.fieldType === 'date') {
      const value = field.value ? new Date(field.value) : null;
      return (
        <DatePickerInput
          value={value}
          onChange={(date) => onUpdateRule({ ...field, value: date?.toISOString() || '' })}
          label="Value"
        />
      );
    }
    return defaultInput;
  };

  return (
    <Paper shadow="sm" p={10}>
      <Flex justify="space-between">
        <Title order={3}>Patients</Title>
        <ActionIcon onClick={onRemove} color="red">
          <IconTrash size={15} color="orange" />
        </ActionIcon>
      </Flex>

      <div>
        <DatePickerInput
          type="range"
          label="Set patient registration date range"
          placeholder="Pick dates range"
          value={dateRanges}
          onChange={setPatientDateRanges}
        />
      </div>

      <div>
        {filterFieldRules.map((f) => {
          return (
            <Grid key={f.id}>
              <Grid.Col span={4}>
                <InputLabel>Field</InputLabel>
                <Select
                  defaultValue={f.fieldId as any}
                  options={fieldNames as any}
                  className="dark-select-container"
                  classNamePrefix="dark-select"
                  onChange={(opt) => {
                    handleUpdateRuleField(f, opt?.value || '');
                  }}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <InputLabel>Operator</InputLabel>
                <Select
                  classNamePrefix="dark-select"
                  className="dark-select-container"
                  defaultValue={f.operator}
                  // @ts-ignore
                  options={operators as FieldOption[]}
                  // @ts-ignore
                  onChange={(opt) => onUpdateRule({ ...f, operator: opt?.value || ('' as any) })}
                />
              </Grid.Col>
              <Grid.Col span={4}>{getFormValueField(f, form)}</Grid.Col>
              <Grid.Col sx={{ display: 'flex', alignItems: 'flex-end' }} span={1}>
                <ActionIcon onClick={() => onRemoveRule(f.id)} color="red">
                  <IconMinus size={15} color="orange" />
                </ActionIcon>
              </Grid.Col>
            </Grid>
          );
        })}
      </div>

      <Button fullWidth mt={10} variant="transparent" onClick={onAddRule}>
        Add rule
      </Button>
    </Paper>
  );
}

// FIXME: Should the custom fields and their grid be a separate component?

type EventFiltersProps = {
  forms: HHForm[];
  filterFieldRules: FilterRule[];
  onRemove: () => void;
  onUpdateRule: (rule: FilterRule) => void;
  onAddRule: () => void;
  onRemoveRule: (id: string) => void;
  dateRanges: [Date | null, Date | null];
  setEventDateRanges: (dateRanges: [Date | null, Date | null]) => void;
};
function EventFilters({
  forms,
  filterFieldRules,
  onRemove,
  onUpdateRule,
  onAddRule,
  onRemoveRule,
  dateRanges,
  setEventDateRanges,
}: EventFiltersProps) {
  const formOptions = forms
    .filter((f) => f.form_fields.length > 0)
    .map((f) => {
      const fieldOptions = f.form_fields.map((ff) => ({
        label: ff.name,
        value: f.id + ';' + ff.id,
      }));
      return {
        label: f.name,
        options: fieldOptions,
      };
    });

  const findFormField = (fieldId: string) => {
    const [formId, formFieldId] = fieldId.split(';');
    const form = forms.find((f) => f.id === formId);
    return form?.form_fields.find((f) => f.id === formFieldId);
  };

  const valueOptions = (fieldId: string) => {
    const field = findFormField(fieldId);
    console.log({ field });
    // @ts-ignore
    return field?.options?.map((o) => ({ label: o.label, value: o.value })) || [];
  };

  const getFormValueField = (field: FilterRule) => {
    const formField = findFormField(field.fieldId);
    const defaultInput = (
      <TextInput
        value={field.value}
        label="Value"
        onChange={(e) => onUpdateRule({ ...field, value: e.target.value })}
      />
    );

    if (!formField) return defaultInput;

    if (formField.fieldType === 'options') {
      return (
        <>
          <InputLabel>Value</InputLabel>
          <Select
            classNamePrefix="dark-select"
            className="dark-select-container"
            defaultValue={field.value}
            options={valueOptions(field.fieldId as any)}
            // @ts-ignore
            onChange={(opt) => onUpdateRule({ ...field, value: opt?.value || ('' as any) })}
          />
        </>
      );
    } else if (formField.fieldType === 'date') {
      const value = field.value ? new Date(field.value) : null;
      return (
        <DatePickerInput
          value={value}
          onChange={(date) => onUpdateRule({ ...field, value: date?.toISOString() || '' })}
          label="Value"
        />
      );
    }
    return defaultInput;
  };

  return (
    <Paper shadow="sm" p={10}>
      <Flex justify="space-between">
        <Title order={3}>Events</Title>
        <ActionIcon onClick={onRemove} color="red">
          <IconTrash size={15} color="orange" />
        </ActionIcon>
      </Flex>

      <div>
        <DatePickerInput
          type="range"
          label="Set event date range"
          placeholder="Pick dates range"
          value={dateRanges}
          onChange={setEventDateRanges}
        />
      </div>

      <div>
        {filterFieldRules.map((f) => {
          return (
            <Grid key={f.id}>
              <Grid.Col span={4}>
                <InputLabel>Field</InputLabel>
                <Select
                  defaultValue={f.fieldId as any}
                  options={formOptions as any}
                  className="dark-select-container"
                  classNamePrefix="dark-select"
                  onChange={(opt) => {
                    const field = findFormField(opt?.value || '');
                    onUpdateRule({
                      ...f,
                      fieldId: opt?.value || '',
                      field: opt?.value || '',
                      dataType: field?.fieldType || ('text' as any),
                    });
                  }}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <InputLabel>Operator</InputLabel>
                <Select
                  classNamePrefix="dark-select"
                  className="dark-select-container"
                  defaultValue={f.operator}
                  // @ts-ignore
                  options={operators as FieldOption[]}
                  // @ts-ignore
                  onChange={(opt) => onUpdateRule({ ...f, operator: opt?.value || ('' as any) })}
                />
              </Grid.Col>
              <Grid.Col span={4}>{getFormValueField(f)}</Grid.Col>
              <Grid.Col sx={{ display: 'flex', alignItems: 'flex-end' }} span={1}>
                <ActionIcon onClick={() => onRemoveRule(f.id)} color="red">
                  <IconMinus size={15} color="orange" />
                </ActionIcon>
              </Grid.Col>
            </Grid>
          );
        })}
      </div>

      <Button fullWidth mt={10} variant="transparent" onClick={onAddRule}>
        Add rule
      </Button>
    </Paper>
  );
}

type ExplorerModule = 'patient' | 'event' | 'appointment' | 'prescription';

const explorerDataTypes = ['text', 'number', 'date', 'boolean'] as const;
type ExplorerDataType = (typeof explorerDataTypes)[number];

const explorerModules: {
  icon: any;
  name: string;
  value: ExplorerModule;
  isActive: boolean;
}[] = [
  { icon: IconUser, name: 'Patient', value: 'patient', isActive: true },
  { icon: IconList, name: 'Event', value: 'event', isActive: true },
  {
    icon: IconCalendarBolt,
    name: 'Appointment (Coming soon)',
    value: 'appointment',
    isActive: false,
  },
  {
    icon: IconMedicineSyrup,
    name: 'Prescription (Coming soon)',
    value: 'prescription',
    isActive: false,
  },
];

// FilterField is a '.' separated string where the first part is the table name and the second part is the column name
type FilterField = string;

type FilterRule = {
  id: string; // the id of the rule (nothing to do with the actual data itself)
  fieldId: string; // The id of the field / column
  field: FilterField;
  operator: ExplorerOperator;
  dataType: ExplorerDataType;
  value: string;
};

type ExplorerFilters = {
  rules: Record<ExplorerModule, FilterRule[]>;

  /** Date ranges for the filters - [start, end] */
  dateRanges: Record<ExplorerModule, [Date | null, Date | null]>;
};

type PatientFilter = {
  // Core patient fields
  baseFields: FilterRule[];

  // Additional attributes
  attributeFields: FilterRule[];
};

type EventFilter = FilterRule[];

type AppointmentFilter = FilterRule[];

type PrescriptionFilter = FilterRule[];

type ExploreQuery = {
  patient: PatientFilter;
  event: EventFilter;
  appointment: AppointmentFilter;
  prescription: PrescriptionFilter;
};

type SlicerData = {
  patients: Patient[];
  events: Event[];
  prescriptions: Prescription[];
  appointments: Appointment[];
};

export default function DataExplorer() {
  const { form: registrationForm, isLoading: isLoadingRegistrationForm } =
    usePatientRegistrationForm();
  const { forms: eventForms, isLoading: isLoadingForms, refetch: refetchForms } = useEventForms();
  const [filters, setFilters] = useState<ExplorerFilters>({
    rules: {
      patient: [] as FilterRule[],
      event: [],
      appointment: [],
      prescription: [],
    },
    // date ranges for the filters - [start, end]
    dateRanges: {
      patient: [null, null],
      event: [null, null],
      appointment: [null, null],
      prescription: [null, null],
    },
  });
  const [activeFilterModules, setActiveFilterModules] = useState<ExplorerModule[]>([]);
  const [debouncedFilters] = useDebouncedValue(filters, 1500);

  const [slicerDataId, setSlicerDataId] = useState<string>(uuidv4());
  const [slicerData, setSlicerData] = useState<SlicerData>({
    patients: [],
    events: [],
    prescriptions: [],
    appointments: [],
  });

  const [loadingServerData, setLoadingServerData] = useState(false);

  const addFilterModule = (moduleName: ExplorerModule) => () => {
    if (activeFilterModules.includes(moduleName)) {
      return;
    }
    setActiveFilterModules([...activeFilterModules, moduleName]);
    addRule(moduleName)();
  };

  const addRule = (moduleName: ExplorerModule) => () => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      rules: {
        ...prevFilters.rules,
        [moduleName]: [
          ...prevFilters.rules[moduleName],
          { id: uuidv4(), fieldId: '', field: '', operator: '', value: '' },
        ],
      },
    }));
  };

  const removeRule = (moduleName: ExplorerModule) => (id: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      rules: {
        ...prevFilters.rules,
        [moduleName]: prevFilters.rules[moduleName].filter((r) => r.id !== id),
      },
    }));
  };

  const removeFilterModule = (moduleName: ExplorerModule) => () => {
    setActiveFilterModules(activeFilterModules.filter((mod) => mod !== moduleName));
    setFilters((prevFilters) => ({
      ...prevFilters,
      rules: {
        ...prevFilters.rules,
        [moduleName]: [],
      },
    }));
  };

  const setRule = (moduleName: ExplorerModule) => (rule: FilterRule) => {
    setFilters((prevFilters) => {
      const moduleRules = prevFilters.rules[moduleName];
      const existingRuleIndex = moduleRules.findIndex((r) => r.id === rule.id);

      let updatedModuleRules;
      if (existingRuleIndex !== -1) {
        updatedModuleRules = [...moduleRules];
        updatedModuleRules[existingRuleIndex] = rule;
      } else {
        updatedModuleRules = [...moduleRules, rule];
      }

      return {
        ...prevFilters,
        rules: {
          ...prevFilters.rules,
          [moduleName]: updatedModuleRules,
        },
      };
    });
  };

  const rerun = async () => {
    // Format patient filters into a query string
    const patientFilters: PatientFilter = filters.rules.patient.reduce(
      (acc, rule) => {
        const formField = registrationForm?.fields.find((f) => f.id === rule.fieldId);
        console.log({ formField, rule, registrationForm });
        // if the field doesn't exist, don't add it
        if (!formField) return acc;

        // if the field is an empty string, dont add it
        if (rule.field === '') return acc;

        // if the operator is an empty string, dont add it
        // @ts-expect-error we are setting the string to empty even though it has a type
        if (rule.operator === '') return acc;

        // if the value is an empty string, dont add it
        if (rule.value === '') return acc;

        if (formField.baseField) {
          acc.baseFields.push(rule);
        } else {
          acc.attributeFields.push(rule);
        }

        return acc;
      },
      { baseFields: [], attributeFields: [] } as PatientFilter
    );

    // Format event filters into a query string
    const eventFilters: EventFilter = filters.rules.event.reduce((acc, rule) => {
      // if the field is an empty string, dont add it
      if (rule.field === '') return acc;
      if (rule.fieldId === '') return acc;

      // if the operator is an empty string, dont add it
      // @ts-expect-error we are setting the string to empty even though it has a type
      if (rule.operator === '') return acc;

      // if the value is an empty string, dont add it
      if (rule.value === '') return acc;

      acc.push(rule);
      return acc;
    }, [] as EventFilter);

    const queryFilters: ExploreQuery = {
      patient: patientFilters,
      event: eventFilters,
      appointment: [],
      prescription: [],
    };

    console.log(JSON.stringify(queryFilters, null, 2));

    // TODO: if the base fields and attribute fields are empty, don't send the query
    if (
      queryFilters.patient.baseFields.length === 0 &&
      queryFilters.patient.attributeFields.length === 0 &&
      queryFilters.event.length === 0
    ) {
      return;
    }

    setLoadingServerData(true);

    const res = await axios.post(
      `${HIKMA_API}/v1/admin/data-explorer`,
      {
        filters: queryFilters,
        dateRanges: filters.dateRanges,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: String(localStorage.getItem('token')),
        },
      }
    );

    setLoadingServerData(false);

    const { patients, events, prescriptions, appointments } = res.data.data || {
      patients: [],
      events: [],
      prescriptions: [],
      appointments: [],
    };

    setSlicerData({
      patients: patients || [],
      events: events || [],
      prescriptions: prescriptions || [],
      appointments: appointments || [],
    });

    setSlicerDataId(uuidv4());
  };

  useEffect(() => {
    rerun();
  }, [debouncedFilters]);

  const loadingData = isLoadingRegistrationForm || isLoadingForms || loadingServerData;

  console.log({ filters });

  return (
    <AppLayout title="Data Explorer">
      <Text>
        Data Explorer is a tool that allows you to filter and slice data from your Hikma Health
        database.
      </Text>

      <Text>
        This tool is <strong>*still in development*</strong>, if you need something to appear here,
        please send a VERY detailed email to ally@hikmahealth.org requesting it.
      </Text>
      <Grid pt={32}>
        <Grid.Col span={5} py={18}>
          <Stack gap={32}>
            {activeFilterModules.map((mod) => {
              switch (mod) {
                case 'patient':
                  return registrationForm ? (
                    <PatientFilters
                      key={mod}
                      onUpdateRule={setRule(mod)}
                      onAddRule={addRule(mod)}
                      onRemoveRule={removeRule(mod)}
                      filterFieldRules={filters.rules.patient}
                      form={registrationForm}
                      onRemove={removeFilterModule(mod)}
                      dateRanges={filters.dateRanges.patient}
                      setPatientDateRanges={(dateRanges) => {
                        setFilters((prevFilters) => ({
                          ...prevFilters,
                          dateRanges: {
                            ...prevFilters.dateRanges,
                            patient: dateRanges,
                          },
                        }));
                      }}
                    />
                  ) : (
                    <div key={mod}>
                      Error: There are no saved registration forms, please save a form first to
                      proceed.
                    </div>
                  );
                case 'event':
                  return (
                    <EventFilters
                      key={mod}
                      forms={eventForms}
                      onUpdateRule={setRule(mod)}
                      onAddRule={addRule(mod)}
                      onRemoveRule={removeRule(mod)}
                      filterFieldRules={filters.rules.event}
                      onRemove={removeFilterModule(mod)}
                      dateRanges={filters.dateRanges.event}
                      setEventDateRanges={(dateRanges) => {
                        setFilters((prevFilters) => ({
                          ...prevFilters,
                          dateRanges: {
                            ...prevFilters.dateRanges,
                            event: dateRanges,
                          },
                        }));
                      }}
                    />
                  );
                default:
                  return <div key={mod}></div>;
              }
            })}

            <Popover width={300} trapFocus position="bottom" withArrow shadow="md">
              <Popover.Target>
                <Button className="primary" leftSection={<IconPlus size={16} />} fullWidth>
                  Add Module
                </Button>
              </Popover.Target>
              <Popover.Dropdown>
                {explorerModules
                  .filter((mod) => !activeFilterModules.includes(mod.value))
                  .map((mod) => (
                    <div key={mod.name}>
                      <Button
                        variant="transparent"
                        disabled={!mod.isActive}
                        leftSection={<mod.icon size={16} />}
                        onClick={addFilterModule(mod.value)}
                      >
                        {mod.name}
                      </Button>
                    </div>
                  ))}
              </Popover.Dropdown>
            </Popover>
          </Stack>
        </Grid.Col>
        <Grid.Col span={7}>
          <Flex justify="space-between">
            <Button onClick={rerun} leftSection={<IconRefresh size={16} />}>
              Rerun
            </Button>
          </Flex>
          <DataSlicer
            loading={loadingData}
            data={slicerData}
            dataId={slicerDataId}
            patientRegistrationForm={registrationForm}
            eventForms={eventForms}
          />
        </Grid.Col>
      </Grid>
    </AppLayout>
  );
}

function getYAxisMax(maxValue: number): number {
  // Add 10% buffer above the max value
  const withBuffer = Math.ceil(maxValue * 1.25);
  if (withBuffer < 10) {
    return 10;
  } else if (withBuffer < 100) {
    // round up to the nearest 10
    return Math.ceil(withBuffer / 10) * 10;
  } else {
    // round up to the nearest 100
    return Math.ceil(withBuffer / 100) * 100;
  }
}

const DataSlicer = ({
  data,
  dataId,
  patientRegistrationForm,
  eventForms,
  loading,
}: {
  data: SlicerData;
  dataId: string;
  patientRegistrationForm: RegistrationForm | null;
  eventForms: HHForm[];
  loading: boolean;
}) => {
  // ';' separated string of formId;formFieldId or 'patients;fieldId' in the case of patients
  const [sliceBy, setSliceBy] = useState<string | null>(null);
  const isEmptyData = useMemo(() => {
    return (
      data.patients.length === 0 &&
      data.events.length === 0 &&
      data.prescriptions.length === 0 &&
      data.appointments.length === 0
    );
  }, [dataId]);

  console.log({ len: data.patients.length });

  const sliceData = useMemo(() => {
    if (sliceBy === null) {
      return data;
    }
    const [sliceType, sliceId] = sliceBy.split(';');
    if (sliceType === 'patients') {
      console.log(sliceId, groupAndCount(data.patients, sliceId));
      return groupAndCount(data.patients, sliceId);
    }
    return null;
  }, [sliceBy, dataId]);

  console.log({ sliceData });

  return (
    <div>
      <If show={patientRegistrationForm !== null && !isEmptyData}>
        <Box>
          <Flex justify="space-between">
            <Text size="md" fw={700}>
              Patient Slices
            </Text>

            <Button variant="subtle" onClick={() => setSliceBy(null)}>
              Clear
            </Button>
          </Flex>

          <Flex wrap="wrap" gap="sm" py={22}>
            {patientRegistrationForm?.fields
              .filter((field) => !field.deleted)
              .map((field) => (
                <div key={field.id}>
                  <Radio
                    label={field.label.en}
                    name="patient-slice"
                    value={'patients;' + (field.baseField ? field.column : field.id)}
                    onChange={(e) => setSliceBy(e.target.value)}
                    checked={sliceBy === 'patients;' + (field.baseField ? field.column : field.id)}
                  />
                </div>
              ))}
          </Flex>
        </Box>

        <If show={data?.events?.length > 0}>
          <Box>
            <Flex justify="space-between">
              <Text size="md">Total Events Returned: {data.events.length}</Text>
            </Flex>
          </Box>
        </If>
      </If>

      <Box pos="relative" pt={20}>
        <LoadingOverlay visible={loading} loaderProps={{ children: <Loader type="dots" /> }} />
        <If show={isEmptyData}>
          <Box>
            <ReactECharts key={dataId} option={getOptions(['Patients'], [0])} />
          </Box>
        </If>

        <If show={!isEmptyData}>
          <Box>
            <ReactECharts
              key={dataId}
              option={
                sliceBy && sliceData
                  ? // @ts-ignore
                    getSlicedOptions(getTopNWithOther(sliceData, 5)) // Potentially have this number set by the user
                  : getOptions(['Patients'], [data.patients.length])
              }
            />
          </Box>
        </If>
      </Box>
    </div>
  );
};

// TODO: move to utility functions
/**
 * Get Echarts options
 * @param xAxisData
 * @param yAxisData
 * @returns
 */
const getOptions = (xAxisData: string[], yAxisData: number[]) => ({
  color: [
    '#5470c6',
    '#91cc75',
    '#fac858',
    '#ee6666',
    '#73c0de',
    '#3ba272',
    '#fc8452',
    '#9a60b4',
    '#ea7ccc',
    '#bda29a',
    '#6e7074',
  ],
  grid: { top: 8, right: 8, bottom: 24, left: 0, containLabel: true },
  xAxis: {
    type: 'category',
    data: xAxisData,
    axisLabel: {
      interval: 0,
      rotate: xAxisData.length > 5 ? 30 : 0,
    },
  },
  yAxis: {
    type: 'value',
    max: getYAxisMax(max(yAxisData) || 0),
  },
  series: [
    {
      // name: '2011',
      type: 'bar',
      // data: yAxisData,
      data: yAxisData.map((value, index) => ({
        value,
        itemStyle: {
          color: undefined, // This will automatically use colors from the palette
        },
      })),
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
  ],
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
    },
  },
  toolbox: {
    show: true,
    feature: {
      dataView: { readOnly: false },
      restore: {},
      saveAsImage: {
        title: 'HH Explorer Data',
        name: 'HH Explorer',
      },
    },
  },
  legend: {
    data: ['Patients'],
    bottom: 0,
  },
});

const getSlicedOptions = (data: Record<string, number>) => {
  const xAxisData = Object.keys(data);
  const yAxisData = Object.values(data);
  const options = getOptions(xAxisData, yAxisData);

  // return {
  //   ...options,
  //   legend: {
  //     ...options.legend,
  //     data: xAxisData,
  //   },
  // };
  return {
    ...options,
    legend: {
      ...options.legend,
      data: xAxisData,
    },
    series: [
      {
        ...options.series[0],
        data: yAxisData.map((value, index) => ({
          value,
          name: xAxisData[index],
          itemStyle: {
            color: options.color[index % options.color.length],
          },
        })),
      },
    ],
  };
};

const eg = [
  {
    additional_attributes: {
      '6e000dc0-130b-11ef-9002-27cca56014c1': {
        attribute: 'Color of eyes',
        boolean_value: null,
        date_value: null,
        number_value: null,
        string_value: 'White',
      },
    },
    camp: 'Manawfa',
    citizenship: 'Ugandan',
    created_at: '2024-09-29T05:54:46+00:00',
    date_of_birth: '2023-04-05',
    deleted_at: null,
    external_patient_id: '',
    given_name: 'Among',
    government_id: '',
    hometown: '',
    id: '54c05590-7e27-11ef-af40-819cf3d230b8',
    last_modified: '2024-10-18T13:19:35+00:00',
    phone: '0780669274',
    server_created_at: 'Thu, 17 Oct 2024 10:29:32 GMT',
    sex: 'female',
    surname: 'Peace',
    updated_at: '2024-10-06T10:23:08+00:00',
  },
];

/**
 * Groups and counts items in a collection based on a specified key.
 * If the key is not found at the root level, it searches in additional_attributes.
 *
 * @param collection - Array of objects containing patient data
 * @param key - The key to group by (can be a root level key or an additional_attribute UUID)
 * @returns An object with counts grouped by the values of the specified key
 *
 * @example
 * // Group by sex
 * const result1 = groupAndCount(patients, 'sex');
 * // Returns: { male: 25, female: 33, other: 3 }
 *
 * // Group by an additional attribute (e.g., eye color)
 * const result2 = groupAndCount(patients, '6e000dc0-130b-11ef-9002-27cca56014c1');
 * // Returns: { white: 22, brown: 99, green: 2 }
 */
const groupAndCount = (collection: any[], key: string): Record<string, number> => {
  return collection.reduce((acc: Record<string, number>, item: any) => {
    let value: string | null = null;

    // Check if the key exists at the root level
    if (key in item) {
      value = String(item[key]).toLowerCase();
    }
    // Check in additional_attributes if not found at root level
    else if (item.additional_attributes && item.additional_attributes[key]) {
      const attribute = item.additional_attributes[key];
      // Coalesce the different value types to find the non-null one
      value = (
        attribute.string_value ??
        attribute.number_value?.toString() ??
        attribute.boolean_value?.toString() ??
        attribute.date_value
      )?.toLowerCase();
    }

    if (value) {
      acc[value] = (acc[value] || 0) + 1;
    }

    return acc;
  }, {});
};
