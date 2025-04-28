import { Button, Select, SimpleGrid, Table } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { endOfDay, format, isValid, startOfDay, subDays } from 'date-fns';
import { upperFirst } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useImmer } from 'use-immer';
import * as XLSX from 'xlsx';
import If from '../../components/If';
import AppLayout from '../../components/Layout';
import { usePatientRegistrationForm } from '../../hooks/usePatientRegistrationForm';
import { Event, EventResponse, MultipleEventRows } from '../../types/Event';
import { HHForm } from '../../types/Inputs';
import { formatEventsIntoRows } from '../../utils/event';
import { orderedList } from '../../utils/misc';
import { getAllForms } from './forms-list';
import { getPatientColumns } from './patients/list';
import { getTranslation } from './patients/registration-form';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

export default function ExportsPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [forms, setForms] = useState<(HHForm & { created_at: string })[]>([]);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [eventResponse, setEventResponse] = useState<EventResponse[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [filters, updateFilters] = useImmer<{ id: string; startDate: Date; endDate: Date }>({
    id: '',
    startDate: startOfDay(new Date()),
    endDate: endOfDay(new Date()),
  });

  const { form: patientRegistrationForm } = usePatientRegistrationForm();

  // Patient events are stored as JSON inside the metadata field,
  // since the structure is unknown at present, this method needs careful consideration.
  const [patientEvents, setPatientEvents] = useState<Event[]>([]);

  /** Given a form Id, return the form name from the list of forms loaded
  @param {string} formId
  @param {HHForm[]} forms
  @returns {string} name
  */
  const getFormName = (formId: string, forms: HHForm[]): string => {
    return forms.find((f) => f.id === formId)?.name || '';
  };

  // on page load, get all the forms from the database
  useEffect(() => {
    const token = localStorage.getItem('token');
    setLoadingEvents(true);
    getAllForms(token || '')
      .then((res) => {
        // @ts-ignore ts error
        setForms(res);
      })
      .catch((error) => {
        alert('Unable to fetch forms. Please check your network connectivity.');
        console.error(error);
      })
      .finally(() => {
        setLoadingEvents(false);
      });
  }, []);

  const handleSearch = async () => {
    const { id, startDate, endDate } = filters;
    if (loadingEvents || id.length === 0) return;
    try {
      const token = localStorage.getItem('token') || '';
      // let params = `id=${id}&start_date=${format(startDate || new Date(), "yyyy-MM-dd")}&end_date=${format(endDate || new Date(), "yyyy-MM-dd")}`;
      let params = `id=${id}&start_date=${(startDate || new Date()).toISOString()}&end_date=${(
        endDate || new Date()
      ).toISOString()}`;
      setLoadingEvents(true);

      const response = await fetch(`${HIKMA_API}/admin_api/get_event_form_data?${params}`, {
        method: 'GET',
        headers: {
          Authorization: token,
        },
      });

      const events = (await response.json()).events;

      const evResponse = events as EventResponse[];
      setEventResponse(evResponse || []);
    } catch (error) {
      alert('An error occured searching for these events. Please try again.');
    } finally {
      setLoadingEvents(false);
    }
  };

  const eventColumns = useMemo(() => {
    const cols = new Set();
    eventResponse.map((ev) => {
      const formdata =
        typeof ev.formData === 'string' ? (JSON.parse(ev.formData) as Array<any>) : ev.formData;
      formdata?.forEach((ex) => cols.add(ex.name));
    });
    return Array.from(cols) as string[];
  }, [eventResponse]);

  /** list of all the patients returned with the events */
  const patientsList = useMemo(() => {
    return eventResponse.map((ev) => {
      return ev.patient;
    });
  }, [eventResponse]);

  const patientColumns = useMemo(() => {
    /** The base fields columns */
    const basePatientFields = [
      'created_at',
      'id',
      'given_name',
      'surname',
      'date_of_birth',
      'country',
      'hometown',
      'sex',
      'phone',
      'updated_at',
    ];
    const ignoreFields = [
      'image_timestamp',
      'is_deleted',
      'last_modified',
      'metadata',
      'deleted_at',
      'id',
      'photo_url',
      '	server_created_at',
    ];
    const cols = getPatientColumns(patientsList).filter((col) => !ignoreFields.includes(col));
    const orderedCols = Array.from(new Set(['given_name', 'surname', 'date_of_birth', ...cols]));
    return orderedCols.map(decodeURIComponent);
  }, [eventResponse]);

  /** Given a list of form event entries, and an event name, return the string value or an empty string */
  const getFormDataItem = (formData: any[], name: string) => {
    const entry = formData.find((fD) => fD.name === name);
    if (!entry) {
      return '';
    }
    if (Array.isArray(entry.value) && entry?.value?.[0]?.code) {
      // this is a diagnosis
      return entry.value.map((en: any) => `${en.desc || ''}(${en.code || '0000'})`).join(', ');
    }
    if (
      Array.isArray(entry.value) &&
      entry?.value.length > 0 &&
      entry.value[0]?.dose !== undefined
    ) {
      return entry.value
        .map((data: { name: string; dosage: number }) => `${upperFirst(data.name)}`)
        .join(', ');
    }
    if (entry) {
      return entry.value || '';
    }
    return '';
  };

  // deleted fields in the registration form (we will filter these out from the display)
  const [deletedFieldIds, deletedFieldColumn] = useMemo(() => {
    let fields = patientRegistrationForm?.fields.filter((f) => f.deleted) || [];
    return [fields.map((f) => f.id), fields.map((f) => f.column)];
  }, [patientRegistrationForm]);

  /* mapping of columns to their current label */
  const registrationColToField: Record<string, string> = useMemo(() => {
    if (patientRegistrationForm === null) return {};
    const { fields } = patientRegistrationForm;
    return fields.reduce(
      (prev, curr) => {
        const key = curr.column;
        prev[key] = getTranslation(curr.label, 'en') || curr.column || '';
        return prev;
      },
      {} as Record<string, string>
    );
  }, [patientRegistrationForm]);

  const { columnIds, eventRows }: { columnIds: string[]; eventRows: MultipleEventRows['values'] } =
    useMemo(() => {
      const { columns, values } = formatEventsIntoRows(eventResponse as any, deletedFieldIds);
      return {
        columnIds: orderedList(columns, ['id', 'given_name', 'surname', 'date_of_birth']),
        eventRows: values,
      };
    }, [eventResponse.length]);

  /** Download all the events from this specific selected form and within this date range */
  const downloadEvents = () => {
    const { startDate: startDateVal, endDate: endDateVal, id } = filters;
    const startDate = isValid(startDateVal) ? format(startDateVal as any, 'yyyy MM dd') : '__';
    const endDate = isValid(endDateVal) ? format(endDateVal as any, 'yyyy MM dd') : '__';
    const eventName = getFormName(id, forms || []);
    const fileName = `${startDate}-${endDate}-${eventName}`;

    const table_elt = document.getElementById('form-data-table');

    // Extract Data (create a workbook object from the table)
    const workbook = XLSX.utils.table_to_book(table_elt);

    // Get the workbook as a binary string
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });

    // Convert binary string to Blob
    function s2ab(s: string) {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i++) {
        view[i] = s.charCodeAt(i) & 0xff;
      }
      return buf;
    }

    // Create a Blob from the buffer
    const blob = new Blob([s2ab(excelBuffer)], { type: 'application/octet-stream' });

    // Create a download link and trigger it
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // TOMBSTONE: March 25, 2025 - replaced our built in function with the above function from XLSX
    // tableToCSV(fileName);
  };

  const [columnNames, columnNameIds] = useMemo(() => {
    let names: string[] = [];
    let ids: string[] = [];
    columnIds.forEach((id) => {
      const isPatientColumn = id.startsWith('Patient ') && !id.startsWith('Patient Patient');
      ids.push(id);
      if (!isPatientColumn) {
        names.push(id);
        return;
      }
      const ogName = id.startsWith('Patient ') ? id.replace('Patient ', '') : id;
      const colName = registrationColToField[ogName] || ogName;
      names.push(colName ? 'Patient ' + colName : '');
    });

    return [names, ids];
  }, [columnIds]);

  /*
  Get all the data from the database
  python backend returns:
  return jsonify({
                    "exported_at": datetime.now(timezone.utc).isoformat(),
                    "schema_version": "1.0",
                    "data": data
                })
    where data is a record of {
    [table_name]: [list of rows]
    }
  */
  const getAllData = async () => {
    if (
      !window.confirm(
        'This will overwrite the current data in the database, and could take a while. Are you sure?'
      )
    ) {
      return;
    }
    const token = localStorage.getItem('token') || '';
    const response = await fetch(`${HIKMA_API}/v1/admin/database/export`, {
      // const response = await fetch(`${HIKMA_API}/admin_api/database/export`, {
      method: 'GET',
      headers: {
        Authorization: token,
      },
    });

    const data = await response.json();
    console.log(data);

    const jsonData = JSON.stringify(data, null, 2); // 2 spaces for indentation
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;
    link.download = `database_export_${data.exported_at}.json`;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Upload new data to the database
   * Takes a file, makes sure it is a valid JSON file, parses it, and uploads the contents to the backend.
   * @param {File} file
   */
  const uploadData = async (file: File | null) => {
    if (!file) return;

    setIsDownloading(true);
    try {
      // Read the file contents
      const fileContent = await file.text();
      let jsonData;

      // Validate JSON format
      try {
        jsonData = JSON.parse(fileContent);
      } catch (e) {
        throw new Error('Invalid JSON file format');
      }

      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${HIKMA_API}/v1/admin/database/import`, {
        // const response = await fetch(`${HIKMA_API}/admin_api/database/import`, {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      alert('Data uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload data');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AppLayout title="Exports">
      <SimpleGrid
        cols={{
          md: 3,
          sm: 1,
        }}
        spacing="lg"
        // breakpoints={[
        // { maxWidth: '62rem', cols: 3, spacing: 'md' },
        // { maxWidth: '48rem', cols: 2, spacing: 'sm' },
        // { maxWidth: '36rem', cols: 1, spacing: 'sm' },
        // ]}
      >
        {/*{forms.map((form) => (
          <Paper shadow="xs" key={form.id} p="md">
            <Text>{form.name}</Text>
          </Paper>
        ))}
        */}
      </SimpleGrid>

      <div>
        <Button variant="transparent" p={0} onClick={getAllData}>
          Export entire database
        </Button>
      </div>

      <SimpleGrid cols={3} mb={20}>
        <Select
          label="Choose the form to render"
          placeholder="Pick one"
          onChange={(e) =>
            updateFilters((draft) => {
              // @ts-ignore
              draft.id = e;
            })
          }
          data={forms.map((form) => ({ label: form.name, value: form.id }))}
        />

        <DatePickerInput
          label="Pick a start date"
          placeholder="Choose a date for the exports"
          value={filters.startDate as Date}
          onChange={(range) => {
            updateFilters((draft) => {
              draft.startDate = startOfDay(range || new Date());
            });
          }}
        />

        <DatePickerInput
          label="Pick an end date"
          value={filters.endDate as Date}
          minDate={filters.startDate || subDays(new Date(), 7)}
          onChange={(range) => {
            updateFilters((draft) => {
              draft.endDate = endOfDay(range || new Date());
            });
          }}
        />

        <div style={{ display: 'flex', alignContent: 'flex-end', alignSelf: 'flex-end' }}>
          <Button onClick={handleSearch} disabled={loadingEvents} className="primary">
            {loadingEvents ? 'Loading ...' : 'Search'}
          </Button>
        </div>
      </SimpleGrid>

      {/**
       * This input can be activated to import new data
       * Keep disabled until there is a clear plan on the implications of data importing
       * <FileInput
       *   label="Upload new data"
       *   placeholder="Upload a JSON file"
       *   accept="application/json"
       *   disabled={isDownloading}
       *   onChange={(file) => uploadData(file || null)}
       * />
       */}

      <If show={eventResponse.length > 0}>
        <Button onClick={downloadEvents} className="primary">
          Download Events
        </Button>

        <div style={{ overflowX: 'scroll' }}>
          <Table id="form-data-table" withRowBorders striped horizontalSpacing={'sm'}>
            <Table.Thead>
              <Table.Tr>
                {columnNames.map((name) => {
                  return (
                    <Table.Th style={{ minWidth: 150 }} key={name}>
                      {name}
                    </Table.Th>
                  );
                })}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {eventRows.map((row, idx) => {
                return (
                  <Table.Tr key={`event_${idx}`}>
                    {columnNameIds.map((id) => (
                      <Table.Td key={id}>{columnValueToDisplay(row[id])}</Table.Td>
                    ))}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </div>
      </If>
    </AppLayout>
  );
}

/**
 * Givent the column value, return the displayed version
 * @param {any} columnValue
 * @returns {string}
 */
function columnValueToDisplay(columnValue: any): string {
  if (!columnValue) return '';

  if (Array.isArray(columnValue)) {
    if (columnValue?.[0]?.dose !== undefined) {
      // columnValue[i] has type { dosage: number; dosageUnits: string; name: string; route: string; form: string; }
      return columnValue.map((dose) => `${dose.name}: ${dose.dose} ${dose.doseUnits}`).join(',\n');
    } else if (columnValue?.[0]?.desc !== undefined && columnValue?.[0]?.code !== undefined) {
      // columnValue[i] has type { desc: string; code: string; }
      return columnValue.map((diagnosis) => `${diagnosis.desc} (${diagnosis.code})`).join(',\n');
    }
    console.log('Array: ', columnValue);
  }
  return String(columnValue);
}

function exportTableToExcel(tableID: string, filename = '') {
  var downloadLink;
  var dataType = 'application/vnd.ms-excel';
  var tableSelect = document.getElementById(tableID);
  var tableHTML = tableSelect?.outerHTML.replace(/ /g, '%20');

  // Specify file name
  filename = filename ? filename + '.xls' : 'excel_data.xls';

  // Create download link element
  downloadLink = document.createElement('a');

  document.body.appendChild(downloadLink);

  // @ts-ignore
  if (navigator.msSaveOrOpenBlob) {
    // @ts-ignore
    var blob = new Blob(['\ufeff', tableHTML], {
      type: dataType,
    });
    // @ts-ignore
    navigator.msSaveOrOpenBlob(blob, filename);
  } else {
    // Create a link to the file
    downloadLink.href = 'data:' + dataType + ', ' + tableHTML;

    // Setting the file name
    downloadLink.download = filename;

    //triggering the function
    downloadLink.click();
  }
}

/**
REF: https://www.geeksforgeeks.org/how-to-export-html-table-to-csv-using-javascript/

@param {string} fileName of the file you wish to save as
@param {string} delimiter
*/

export function tableToCSV(fileName: string, delimiter: string = '\t') {
  // Variable to store the final csv data
  let csv_data = [];

  // Get each row data
  let rows = document.getElementsByTagName('tr');
  for (let i = 0; i < rows.length; i++) {
    // Get each column data
    let cols = rows[i].querySelectorAll('td,th');

    // Stores each csv row data
    let csvrow = [];
    for (let j = 0; j < cols.length; j++) {
      // Get the text data of each cell
      // of a row and push it to csvrow
      csvrow.push('"' + `${cols[j].innerHTML}` + '"');
    }

    // Combine each column value with comma
    csv_data.push(csvrow.join(delimiter));
  }

  // Combine each row data with new line character
  let csv_data_str = csv_data.join('\n');

  // Call this function to download csv file
  downloadCSVFile(fileName, csv_data_str);
}

function downloadCSVFile(fileName: string, csv_data: any) {
  // Create CSV file object and feed
  // our csv_data into it
  let CSVFile = new Blob([csv_data], {
    type: 'text/tsv',
  });

  // Create to temporary link to initiate
  // download process
  let temp_link = document.createElement('a');

  // Download csv file
  temp_link.download = fileName + '.tsv';
  let url = window.URL.createObjectURL(CSVFile);
  temp_link.href = url;

  // This link should not be displayed
  temp_link.style.display = 'none';
  document.body.appendChild(temp_link);

  // Automatically click the link to
  // trigger download
  temp_link.click();
  document.body.removeChild(temp_link);
}
