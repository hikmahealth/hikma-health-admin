import { MultiplePatientRows, PatientRes, PatientRow } from '../types/Patient';

export const ignorePatientRowFields = [
  'metadata',
  'deleted_at',
  'additional_attributes',
  'is_deleted',
  'last_modified',
  'photo_url',
  'server_created_at',
  'image_timestamp',
  'additional_data',
];

const allIgnoredFields = [...ignorePatientRowFields, 'created_at', 'updated_at'];
/**
Take in a single patient object including its additional attributes and return a list 
of lists containng the values of all the records.

This is a list of lists to allow for two columns having the same column name without overwriting 
each other
@deprecated
@param {PatientRes} patient
@returns {PatientRow}
*/
function formatPatientRow(patient: PatientRes): PatientRow {
  const additional_attrs = Object.entries(patient.additional_attributes).map(([key, value]) => ({
    key,
    name: value.attribute,
    value: value.string_value ?? value.number_value ?? value.date_value ?? value.boolean_value,
  }));

  const base_attrs = Object.keys(patient)
    .filter((key) => !allIgnoredFields.includes(key))
    .map((key) => ({
      key,
      name: key,
      value: typeof patient[key] === 'object' ? '' : patient[key],
    }));

  const columns = [];
  const values = [];

  base_attrs.forEach((attr) => {
    columns.push(attr.name);
    values.push(attr.value);
  });

  additional_attrs.forEach((attr) => {
    columns.push(attr.name);
    values.push(attr.value);
  });

  columns.push('created_at');
  columns.push('updated_at');

  values.push(patient['created_at'] || '');
  values.push(patient['updated_at'] || '');

  return {
    columns,
    values,
  };
}

/**
Takes in a list of patients and a list of column ids to be ignored if they were deleted or otherwise.

@param {PatientRes[]} patients
@param {string[]} ignoreColumnIds
@returns {MultiplePatientRows}
*/
export function formatPatientsIntoRows(
  patients: PatientRes[],
  ignoreColumnIds: string[]
): MultiplePatientRows {
  const columns = new Set<string>();
  // intermediate obj to track column names and their ids
  const addAttrsMapping: Record = {};
  let values = []; // { columnName: columnValue }[]

  for (let ix = 0; ix < patients.length; ix++) {
    const patient = patients[ix];
    const res: Record = {
      created_at: patient.created_at || '',
      updated_at: patient.updated_at || '',
    };

    // Object.keys(patient).forEach((x) => !allIgnoredFields.includes(x) && columns.add(x));
    Object.keys(patient).forEach((x) => {
      if (!allIgnoredFields.includes(x)) {
        const col = decodeURI(x);
        columns.add(col);
        res[col] = patient[col];
      }
    });

    Object.entries(patient.additional_attributes).forEach(([key, x]) => {
      if (ignoreColumnIds.includes(key)) {
        return;
      }
      const col = decodeURI(x.attribute);
      columns.add(col);
      addAttrsMapping[key] = col;

      res[col] = x.string_value ?? x.number_value ?? x.date_value ?? x.boolean_value ?? '';
    });

    values.push(res);
  }

  columns.add('created_at');
  columns.add('updated_at');

  return {
    columns: Array.from(columns),
    values,
  };
}
