import { ActionIcon, Checkbox, Loader, Table } from '@mantine/core';
import { IconCopy, IconEdit, IconTrash } from '@tabler/icons-react';
import axios from 'axios';
import { pick, truncate } from 'lodash';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { v1 as uuidV1 } from 'uuid';
import { FAB } from '../../components/FAB';
import AppLayout from '../../components/Layout';
import hikmaFormTemplates from '../../data/hikma-form-templates';
import { HHForm } from '../../types/Inputs';

const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

/**
Fetches all the forms froms from the database

@todo Should this be a wrapped in a hook that is re-usable with loading states??
@param {string} token to authenticate the sender
@returns {Promise<HHForm[]>}
*/
export const getAllForms = async (token: string): Promise<HHForm[]> => {
  const response = await fetch(`${HIKMA_API}/admin_api/get_event_forms`, {
    method: 'GET',
    headers: {
      Authorization: token,
    },
  });
  if (!response.ok) {
    const error = await response.json();
    console.error(error);
    return Promise.resolve([]);
  }

  const result = await response.json();
  return result.event_forms;
};

const deleteForm = async (id: string, token: string): Promise<void> => {
  const response = await fetch(`${HIKMA_API}/admin_api/delete_event_form`, {
    method: 'DELETE',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    return Promise.reject(error);
  }
  return await response.json();
};

export default function FormsList() {
  const router = useRouter();
  const [forms, setForms] = useState<(HHForm & { created_at: string })[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingFormTemplate, setLoadingFormTemplate] = useState<string>('');

  const fetchAllForms = (token: string) =>
    getAllForms(token).then((fs) => {
      setForms(fs as unknown as (HHForm & { created_at: string })[]);
      setIsLoading(false);
    });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) fetchAllForms(token);
  }, []);

  // Filter out from the recommendations any forms that share a name with forms created by the organization
  const filteredTemplates = useMemo(() => {
    if (isLoading) {
      return [];
    } else {
      const formNames = forms.map((f) => f.name);
      return hikmaFormTemplates.filter((f) => !formNames.includes(f.name));
    }
  }, [forms.length, isLoading]);

  /**
  For the given form templates, confirm the creation of them
  */
  const confirmCreateForm = (form: HHForm) => () => {
    console.log(
      pick(form, ['name', 'description', 'language', 'metadata', 'is_editable', 'is_snapshot_form'])
    );
    if (window.confirm('Are you sure you want to create this form from this template?')) {
      setLoadingFormTemplate(form.name);
      const token = localStorage.getItem('token');
      const formObj = {
        ...pick(form, ['name', 'description', 'language', 'metadata']),
        is_editable: true,
        is_snapshot_form: false,
        // @ts-ignore
        form_fields: form.form_fields,
        createdAt: new Date(),
        updatedAt: new Date(),
        id: uuidV1(),
      };
      axios
        .post(
          `${HIKMA_API}/admin_api/save_event_form`,
          {
            event_form: formObj,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: String(token),
            },
          }
        )
        .then(function (response) {
          alert('Form created!');
          setIsLoading(true);
          fetchAllForms(String(token));
          console.log(response);
        })
        .catch(function (error) {
          alert('Error creating form. Please try signing out and signing back in.');
          console.log(error);
        })
        .finally(() => {
          setLoadingFormTemplate('');
        });
    }
  };

  const openFormEdit = (form: HHForm) => {
    router.push('/app/new-form', {
      query: { formId: form.id },
    });
  };

  const duplicateForm = (form: HHForm) => {
    const formObj = {
      ...pick(form, ['description', 'language', 'metadata']),
      is_editable: true,
      is_snapshot_form: false,
      name: form.name ? `Duplicate of ${form.name}` : `Duplicated Form`,
      // @ts-ignore
      form_fields: form.form_fields,
      createdAt: new Date(),
      updatedAt: new Date(),
      id: uuidV1(),
    };

    if (confirm(`You are about to duplicate the '${form.name}' form`)) {
      const token = localStorage.getItem('token');
      axios
        .post(
          `${HIKMA_API}/admin_api/save_event_form`,
          {
            event_form: formObj,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: String(token),
            },
          }
        )
        .then((res) => {
          router.push('/app/new-form', {
            query: { formId: formObj.id },
          });
        })
        .catch(() => {
          alert('Error duplicating form. Please try signing out and signing back in.');
        });
    }
  };

  const confirmDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      const token = localStorage.getItem('token') || '';
      deleteForm(id, token)
        .then(() => {
          setForms(forms.filter((f) => f.id !== id));
        })
        .catch((err) => {
          alert('Error deleting form.');
          console.error(err);
        });
    }
  };

  const toggleFormField = (id: string, field: string) => (event: any) => {
    console.log(id, field, event.target.checked);
    const token = localStorage.getItem('token') || '';
    const endpoint = field === 'is_editable' ? 'set_event_form_editable' : 'toggle_snapshot_form';
    const url = `${HIKMA_API}/admin_api/${endpoint}`;
    axios
      .post(
        url,
        {
          id,
          [field]: event.target.checked,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: String(token),
          },
        }
      )
      .then((res) => {
        setForms((forms) =>
          forms.map((form) => {
            if (form.id === id) {
              return {
                ...form,
                [field]: !event.target.checked,
              };
            }
            return form;
          })
        );
      })
      .catch((error) => {
        alert('Error updating form');
        console.error(error);
      });
  };

  const openCreateNewForm = () => {
    router.push('/app/new-form');
  };

  const ths = (
    <Table.Tr>
      <Table.Th>Editable ?</Table.Th>
      <Table.Th>Show Snapshot ?</Table.Th>
      <Table.Th>Form Name</Table.Th>
      <Table.Th>Description</Table.Th>
      <Table.Th>Created At</Table.Th>
      <Table.Th>Actions</Table.Th>
    </Table.Tr>
  );

  const rows = forms.map((form) => (
    <Table.Tr key={form.id}>
      <Table.Td>
        <Checkbox checked={form.is_editable} onChange={toggleFormField(form.id, 'is_editable')} />
      </Table.Td>
      <Table.Td>
        <Checkbox
          checked={form.is_snapshot_form}
          onChange={toggleFormField(form.id, 'is_snapshot_form')}
        />
      </Table.Td>
      <Table.Td>{form.name}</Table.Td>
      <Table.Td>{truncate(form.description, { length: 32 })}</Table.Td>
      <Table.Td>{form.created_at}</Table.Td>
      <Table.Td>
        <div className="flex space-x-4">
          <ActionIcon
            variant="transparent"
            onClick={() => confirmDelete(form.id)}
            title="Delete form"
          >
            <IconTrash size="1rem" color="red" />
          </ActionIcon>
          <ActionIcon variant="transparent" onClick={() => openFormEdit(form)} title="Edit form">
            <IconEdit size="1rem" color="blue" />
          </ActionIcon>
          <ActionIcon
            variant="transparent"
            onClick={() => duplicateForm(form)}
            title="Duplicate form"
          >
            <IconCopy size="1rem" color="orange" />
          </ActionIcon>
        </div>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <AppLayout title="Forms List">
        {filteredTemplates.length > 0 && (
          <div>
            <h3 className="text-lg">Click to install recommended form</h3>

            <div className="flex flex-wrap gap-3">
              {filteredTemplates.map((form) => (
                <div
                  onClick={confirmCreateForm(form as any)}
                  className="shadow-sm border border-gray-200 dark:border-gray-700 rounded p-2 hover:cursor-pointer hover:shadow-xl"
                  key={form.id}
                >
                  <h4 className="text-md">
                    {loadingFormTemplate === form.name ? 'loading ....' : form.name}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        )}
        <Table verticalSpacing="md" className="my-6" striped highlightOnHover withRowBorders>
          <Table.Thead>{ths}</Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>

        <div className="flex justify-center my-6 w-full">{isLoading && <Loader size="xl" />}</div>
      </AppLayout>

      <FAB onClick={openCreateNewForm} />
    </>
  );
}
