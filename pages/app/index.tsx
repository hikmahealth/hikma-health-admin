import { Box, Grid, Loader, MantineColorScheme, Paper, Title } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import axios from 'axios';
import EChartsReact from 'echarts-for-react';
import { useEffect, useState } from 'react';
import Select from 'react-select';
import { DashboardStatsGrid } from '../../components/DashboardStatsGrid';
import If from '../../components/If';
import AppLayout from '../../components/Layout';
import { useEventForms } from '../../hooks/useEventForms';
import { usePatientRegistrationForm } from '../../hooks/usePatientRegistrationForm';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

const dashboardData = [
  {
    diff: 0,
    icon: 'user',
    title: 'Clinic Users',
    value: '0',
    description: "Total users in your clinic's account",
  },
  {
    diff: 0,
    icon: 'patient',
    title: 'Total Patients',
    value: '0',
    description: 'Total patients registered to your clinic',
  },
  {
    diff: 0,
    icon: 'event',
    title: 'Total Visits',
    value: '0',
    description: 'Total visits to your clinic',
  },
  {
    diff: 0,
    icon: 'form',
    title: 'Total Forms',
    value: '0',
    description: 'Total forms created in your clinic',
  },
];

const getSummaryStats = async (token: string) => {
  const response = await fetch(`${HIKMA_API}/admin_api/summary_stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
  });

  return await response.json();
};

type SummaryStats = {
  eventsCount: number;
  patientsCount: number;
  usersCount: number;
  formsCount: number;
  visitsCount: number;
};

export default function Dashboard() {
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    eventsCount: 0,
    patientsCount: 0,
    usersCount: 0,
    formsCount: 0,
    visitsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getSummaryStats(token).then((data) => {
        setSummaryStats({
          eventsCount: data.event_count,
          patientsCount: data.patient_count,
          usersCount: data.user_count,
          visitsCount: data.visit_count,
          formsCount: data.form_count,
        });
        setLoading(false);
      });
    }
  }, []);

  const summaryData = dashboardData.map((item) => {
    if (item.title === 'Clinic Users') {
      return {
        ...item,
        value: summaryStats.usersCount?.toLocaleString(),
      };
    }
    if (item.title === 'Total Patients') {
      return {
        ...item,
        value: summaryStats.patientsCount?.toLocaleString(),
      };
    }
    if (item.title === 'Total Visits') {
      return {
        ...item,
        value: summaryStats.visitsCount?.toLocaleString(),
      };
    }
    if (item.title === 'Total Forms') {
      return {
        ...item,
        value: summaryStats.formsCount?.toLocaleString(),
      };
    }
    return item;
  });

  return (
    <AppLayout title="Dashboard">
      <DashboardStatsGrid data={summaryData} />

      <div className="flex justify-center my-6 w-full">{loading && <Loader size="xl" />}</div>
      <div>
        <Paper shadow="xs" className="" p="xl">
          <OrganizationalKPIS />
        </Paper>
      </div>
      <div>
        <Paper shadow="xs" className="h-64 flex items-center justify-center mt-24" p="xl">
          <Title order={3}>Add your organization's important information here</Title>
        </Paper>
      </div>
    </AppLayout>
  );
}

type FormId = string;
type FormFieldId = string;

type KPIFields = {
  patient_fields: string[]; // field ids
  event_fields: Record; // form id -> field ids
};

type KPIRequest = {
  start_date: string; // Date.now().toISOString()
  end_date: string; // Date.now().toISOString()
  kpi_fields: KPIFields;
};

type KPIResponse = {
  patient_field_counts: Record; // { field id -> { field value -> count } }
  event_field_counts: Record; // form id -> { field id -> { field value -> count } }
};

function OrganizationalKPIS() {
  const [value, setValue] = useState<[Date | null, Date | null]>([null, null]);
  const {
    form: patientRegistrationForm,
    isLoading: isLoadingForm,
    refresh: refreshForm,
  } = usePatientRegistrationForm();
  const { forms, isLoading, refetch } = useEventForms();

  const [kpiFields, setKpiFields] = useState<KPIFields>({
    patient_fields: [],
    event_fields: {},
  });

  const [kpiResults, setKpiResults] = useState<KPIResponse>({
    patient_field_counts: {},
    event_field_counts: {},
  });

  const handleEventFieldsChange = (formId: string, fields: string[]) => {
    setKpiFields((prevFields) => ({
      ...prevFields,
      event_fields: {
        ...prevFields.event_fields,
        [formId]: fields,
      },
    }));
  };

  useEffect(() => {
    if (!value[0] || !value[1]) return;
    axios
      .post(
        `${HIKMA_API}/v1/admin/dashboard/kpis`,
        {
          start_date: value[0]?.toISOString(),
          end_date: value[1]?.toISOString(),
          kpi_fields: kpiFields,
        },
        {
          headers: {
            Authorization: String(localStorage.getItem('token')),
          },
        }
      )
      .then((response) => {
        setKpiResults(response.data);
        console.log(response.data);
      });
  }, [value, kpiFields]);

  // the fieldId could be the column name if the field is a base field or the id if the field is a custom field
  function getPatientFieldLabel(fieldId: string) {
    const field = patientRegistrationForm?.fields.find((f) =>
      f.baseField ? f.column === fieldId : f.id === fieldId
    );
    return field?.label.en || fieldId;
  }

  function getEventFieldLabel(formId: string, fieldId: string) {
    const form = forms.find((f) => f.id === formId);
    const field = form?.form_fields.find((f) => f.id === fieldId);
    if (!field) return fieldId;
    return field.name || fieldId;
  }

  const getOptions = (xAxisData: string[], yAxisData: number[]) => ({
    toolbox: {
      feature: {
        saveAsImage: {
          title: 'Download',
          name: 'KPI_Chart',
        },
      },
    },
    grid: { top: 8, right: 8, bottom: 24, left: 0, containLabel: true },
    xAxis: {
      type: 'value',
      data: yAxisData,
    },
    yAxis: {
      type: 'category',
      data: xAxisData,
    },
    series: [
      {
        // name: '2011',
        type: 'bar',
        data: yAxisData,
      },
    ],

    tooltip: {
      trigger: 'axis',
    },
  });

  const colorScheme: MantineColorScheme = 'dark';
  return (
    <div>
      <Title order={3}>Organizational KPIs</Title>
      <DatePickerInput
        type="range"
        label="Pick dates range"
        placeholder="Pick dates range"
        value={value}
        onChange={setValue}
      />

      <If show={!isLoadingForm && !!patientRegistrationForm}>
        <Box my={26}>
          <Title order={5}>Patients</Title>
          <div>
            <Select
              className={
                // @ts-ignore
                colorScheme === 'light' ? 'light-select-container' : 'dark-select-container'
              }
              // @ts-ignore
              classNamePrefix={colorScheme === 'light' ? 'light-select' : 'dark-select'}
              isMulti
              onChange={(values) => {
                setKpiFields({
                  ...kpiFields,
                  patient_fields: values.map((v) => v.value),
                });
              }}
              options={patientRegistrationForm?.fields
                .filter((f) => f.deleted !== true)
                ?.map((field) => ({
                  label: field.label.en,
                  value: field.baseField ? field.column : field.id,
                }))}
            />
          </div>

          <Grid columns={2} gutter={20}>
            {kpiFields.patient_fields.map((field) => (
              <Grid.Col span={1} key={field}>
                <Paper shadow="xs" className="" p="xl">
                  <Title order={3}>{getPatientFieldLabel(field)}</Title>

                  {kpiResults.patient_field_counts[field] && (
                    <div>
                      <EChartsReact
                        option={getOptions(
                          Object.keys(kpiResults.patient_field_counts[field]),
                          Object.values(kpiResults.patient_field_counts[field])
                        )}
                      />
                    </div>
                  )}
                </Paper>
              </Grid.Col>
            ))}
          </Grid>

          {/* <div>
            <pre>
              <code>
                {JSON.stringify(kpiFields.patient_fields, null, 2)}
                {JSON.stringify(kpiResults.patient_field_counts, null, 2)}
              </code>
            </pre>
          </div> */}
        </Box>
      </If>

      {forms.map((form) => (
        <Box my={26} key={form.id}>
          <Title order={5}>{form.name}</Title>

          <div>
            <Select
              className={
                // @ts-ignore
                colorScheme === 'light' ? 'light-select-container' : 'dark-select-container'
              }
              // @ts-ignore
              classNamePrefix={colorScheme === 'light' ? 'light-select' : 'dark-select'}
              isMulti
              onChange={(values) => {
                handleEventFieldsChange(
                  form.id,
                  values.map((v) => v.value)
                );
              }}
              options={form.form_fields?.map((field) => ({
                label: field.name,
                value: `${field.id}`,
              }))}
            />
          </div>

          <Grid columns={2} gutter={20}>
            {kpiFields.event_fields[form.id]?.map((field) => (
              <Grid.Col span={1} key={field}>
                <Paper shadow="xs" className="" p="xl">
                  <Title order={3}>{getEventFieldLabel(form.id, field)}</Title>

                  {kpiResults.event_field_counts[form.id]?.[field] && (
                    <div>
                      <EChartsReact
                        option={getOptions(
                          Object.keys(kpiResults.event_field_counts[form.id]?.[field]),
                          Object.values(kpiResults.event_field_counts[form.id]?.[field])
                        )}
                      />
                    </div>
                  )}
                </Paper>
              </Grid.Col>
            ))}
          </Grid>
        </Box>
      ))}
    </div>
  );
}
