import { EventResponse, MultipleEventRows } from '../types/Event';
import { ICD11Diagnosis, Medication } from '../types/misc';
import { ignorePatientRowFields } from './patient';

const allIgnoredPatientFields = [...ignorePatientRowFields, 'created_at', 'updated_at'];

/**
Takes in a list of events and a list of column ids to be ignored if they were deleted or otherwise.

@param {EventResponse[]} events
@param {string[]} ignoreColumnIds
@returns {MultipleEventRows}
*/
export function formatEventsIntoRows(
  events: EventResponse[],
  ignoreColumnIds: string[]
): MultipleEventRows {
  const columns = new Set<string>();
  // intermediate obj to track column names and their ids
  const addAttrsMapping: Record<
    string,
    string | number | boolean | Date | ICD11Diagnosis[] | Medication[]
  > = {};
  let values = []; // { columnName: columnValue }[]

  for (let ix = 0; ix < events.length; ix++) {
    const event = events[ix];
    console.log({ event });
    const patient = event.patient;
    const res: Record<string, string | number | boolean | Date | ICD11Diagnosis[] | Medication[]> =
      {
        created_at: event.createdAt || '',
        updated_at: event.updatedAt || '',

        // Ignore these timestamps for the events row.
        // created_at: patient.created_at || '',
        // updated_at: patient.updated_at || '',
      };

    // Object.keys(patient).forEach((x) => !allIgnoredFields.includes(x) && columns.add(x));
    // HACK: event.formData maybe string, this shouldn't be permanent
    const formdata =
      typeof event.formData === 'string'
        ? (JSON.parse(event.formData) as Array<any>)
        : event.formData;

    formdata.forEach((entry) => {
      const col = decodeURI(entry.name);
      columns.add(col);
      res[col] = entry.value;
    });
    // Object.keys(event).forEach((k) => {
    // if (!allIgnoredFields.includes(k)) return;
    // const col = decodeURI(k);
    // columns.add(col);
    // res[col] = event[col];
    // });
    Object.keys(patient).forEach((x) => {
      if (!allIgnoredPatientFields.includes(x)) {
        // prefix with "patient"
        const col = x.toLowerCase().startsWith('patient ')
          ? decodeURI(x)
          : 'Patient ' + decodeURI(x);
        columns.add(col);
        res[col] = patient[decodeURI(x)];
      }
    });

    Object.entries(patient.additional_attributes).forEach(([key, x]) => {
      if (ignoreColumnIds.includes(key)) {
        return;
      }
      // prefix with "patient"
      const col = 'Patient ' + decodeURI(x.attribute);
      columns.add(col);
      addAttrsMapping[key] = col;

      res[col] = x.string_value ?? x.number_value ?? x.date_value ?? x.boolean_value ?? '';
    });

    values.push(res);
  }

  columns.add('created_at');
  columns.add('updated_at');

  const sortedColumns = Array.from(columns).sort((a, b) => {
    const aIsPatient = a.toLowerCase().includes('patient');
    const bIsPatient = b.toLowerCase().includes('patient');

    if (aIsPatient && !bIsPatient) {
      return -1; // a comes before b
    } else if (!aIsPatient && bIsPatient) {
      return 1; // b comes before a
    } else {
      return a.localeCompare(b); // Maintain original order for other elements
    }
  });

  return {
    columns: sortedColumns,
    values,
  };
}
