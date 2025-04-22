import { Button, TextInput, Textarea } from '@mantine/core';
import { IconBox, IconLoader, IconStarFilled } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { hikma } from '../../../client/api';
import AppLayout from '../../../components/Layout';
import Settings from '../../../components/settings/Layout';

type LoaderState<T> =
  | { state: 'loading' }
  | { state: 'error'; error: string | null }
  | { state: 'success'; data: T };

const useStorageHeadQuery = function () {
  const [value, setValue] = React.useState<
    LoaderState<
      | { is_configured: false }
      | { is_configured: true; store: string; keys: Array<{ key: string; value: string }> }
    >
  >({ state: 'loading' });

  React.useLayoutEffect(() => {
    const token = localStorage.getItem('token');
    if (typeof token !== 'string') {
      return;
    }

    const controller = new AbortController();
    fetch(hikma().path(`/v1/admin/configurations/storage`), {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Authorization: token,
      },
    }).then(async (res) => {
      if (res.ok) {
        setValue({ state: 'success', data: await res.json() });
      } else {
        setValue({ state: 'error', error: await res.text() });
      }
    });

    return () => controller.abort();
  }, []);

  return value;
};

const useStorageConfiguration = function (storeType: string) {
  const [value, setValue] = React.useState<LoaderState<Array<{ key: string; value: string }>>>({
    state: 'loading',
  });

  React.useLayoutEffect(() => {
    const token = localStorage.getItem('token');
    if (typeof token !== 'string') {
      return;
    }

    const controller = new AbortController();
    fetch(hikma().path(`/v1/admin/configurations/storage/${storeType}`), {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Authorization: token,
      },
    }).then(async (res) => {
      if (res.ok) {
        setValue({ state: 'success', data: await res.json() });
      } else {
        setValue({ state: 'error', error: await res.text() });
      }
    });

    return () => controller.abort();
  }, []);

  return value;
};

function ConfiguredOption({ value }: { value: ReturnType<typeof useStorageHeadQuery> }) {
  if (value.state === 'loading') {
    return <div>Loading...</div>;
  }

  if (value.state === 'error') {
    return <div>Failed to get state!</div>;
  }

  return (
    <div>
      <div className="py-3">
        {value.data.is_configured ? (
          <>
            <div className="flex flex-row items-center gap-3">
              <p>Configured storage for</p>
              <b className="uppercase underline">{value.data.store}</b>
            </div>
            <div className="my-2">
              <SimpleConfigurationValues store={value.data.store} />
            </div>
          </>
        ) : (
          <p className="italic text-gray-600">Storage hasn't been configured</p>
        )}
      </div>
    </div>
  );
}

function SimpleConfigurationValues({ store }: { store: string }) {
  const [value, setValue] = React.useState<Array<{ key: string; value: string }> | undefined>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const token = useSessionToken();

  React.useEffect(() => {
    if (!token) {
      console.warn('update details');
      return;
    }

    setLoading(true);
    setError(null);
    fetch(hikma().path(`/v1/admin/configurations/storage/${store}`), {
      method: 'GET',
      headers: {
        Authorization: token,
      },
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error('Failed');
        }
      })
      .then(setValue)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (error) {
    return <div>{error}</div>;
  }

  if (loading) {
    return <div className="font-mono text-sm">Loading the values</div>;
  }

  if (!value) {
    return <div>nothing to show</div>;
  }

  return (
    <div className="font-mono text-xs text-gray-300 border border-dashed border-gray-500 px-3 py-2 rounded-lg">
      {value.map((v) => `${v.key}=${v.value}`).join(', ')}
    </div>
  );
}

const StoreOptions = [
  {
    id: 's3-tigrisdata',
    recommended: true,
    name: <>S3 - Tigrisdata </>,
    variables: { HH_STORE_TYPE: 's3', S3_COMPATIBLE_STORAGE_HOST: 'tigrisdata' },
    component: function (props: {
      variables?: Record<string, string> | undefined;
      saveConfigurationAsText: (text: string) => void;
      loading: boolean;
    }) {
      const [record, setRecord] = React.useState<Partial<Record<'name', string>>>({});
      const [text, setText] = React.useState<string | undefined>();

      const onSaveConfiguration = React.useCallback(() => {
        const p = { ...(props.variables ?? {}) };
        if (record.name) {
          p['S3_BUCKET_NAME'] = record.name;
        }

        let servertext = '';
        servertext += text;
        servertext += '\n';

        for (let [k, v] of Object.entries(p)) {
          servertext += `${k}=${v}\n`;
        }

        props.saveConfigurationAsText(servertext);
      }, [record, text, props.variables, props.saveConfigurationAsText]);

      return (
        <form className="w-full" onSubmit={onSaveConfiguration}>
          <TextInput
            label="Name of the bucket in Tigridata console"
            required
            value={record['name']}
            onChange={(e) => {
              setRecord((d) => {
                d['name'] = e.target.value;
                return d;
              });
            }}
          />
          <div>
            <h3 className="py-2 text-sm font-medium">Include configuration</h3>
            <Textarea
              resize="vertical"
              placeholder="or paste values here"
              style={{
                fontFamily: 'monospace',
              }}
              className="w-full font-mono text-sm rounded"
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="bg-gray-800/40 rounded-lg py-2 flex flex-row items-center justify-end gap-4 px-4 bg-blend-multiply">
            <p className="text-sm -pt-2 text-gray-600">
              *Paste the variables here to configure the storage*
            </p>
            <Button variant="filled" type="submit">
              {props.loading ? (
                <IconLoader className="animate-spin" />
              ) : (
                <>Confirm Configurations</>
              )}
            </Button>
          </div>
        </form>
      );
    },
  },
  {
    id: 's3-native',
    name: 'S3 - AWS Cloud Storage',
    // these variables will be prefilled when making the request
    variables: { HH_STORE_TYPE: 's3', S3_COMPATIBLE_STORAGE_HOST: 'native' },
    component: function (props: {
      variables?: Record<string, string> | undefined;
      saveConfigurationAsText: (text: string) => void;
      loading: boolean;
    }) {
      const [record, setRecord] = React.useState<Partial<Record<'name', string>>>({});
      const [text, setText] = React.useState<string | undefined>();

      const onSaveConfiguration = React.useCallback(() => {
        const p = { ...(props.variables ?? {}) };
        if (record.name) {
          p['S3_BUCKET_NAME'] = record.name;
        }

        let servertext = '';
        servertext += text;
        servertext += '\n';

        for (let [k, v] of Object.entries(p)) {
          servertext += `${k}=${v}\n`;
        }

        props.saveConfigurationAsText(servertext);
      }, [record, text, props.variables, props.saveConfigurationAsText]);
      return (
        <form onSubmit={onSaveConfiguration}>
          <TextInput
            label="Name of the bucket"
            placeholder="(Optional)"
            value={record['name']}
            onChange={(e) => {
              setRecord((d) => {
                d['name'] = e.target.value;
                return d;
              });
            }}
          />
          <div>
            <h3 className="py-2 text-sm font-medium">Include configuration</h3>
            <Textarea
              resize="vertical"
              className="w-full font-mono text-sm rounded"
              placeholder="or paste values here"
              rows={8}
              value={text}
              style={{
                fontFamily: 'monospace',
              }}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="bg-gray-800/40 rounded-lg py-2 flex flex-row items-center justify-end gap-4 px-4 bg-blend-multiply">
            <p className="text-sm -pt-2 text-gray-600">
              *Paste the variables here to configure the storage*
            </p>
            <Button variant="filled" type="submit">
              {props.loading ? (
                <IconLoader className="animate-spin" />
              ) : (
                <>Confirm Configurations</>
              )}
            </Button>
          </div>
        </form>
      );
    },
  },
  {
    id: 'gcp-native',
    name: 'GCP - Cloud Storage',
    variables: { HH_STORE_TYPE: 'gcp' },
    component: function (props: {
      loading: boolean;
      variables?: Record<string, any> | undefined;
      saveConfigurationAsJson: (
        values: Array<{ key: string } & ({ value: string } | { json: string })>
      ) => void;
    }) {
      const [record, setRecord] = React.useState<Partial<Record<'name' | 'json', string>>>({});
      const onSaveConfiguration = React.useCallback(() => {
        const values = [];
        if (props.variables) {
          for (let [k, v] of Object.entries(props.variables)) {
            values.push({
              key: k,
              value: v,
            });
          }
        }

        if (record.name) {
          values.push({
            key: 'GCP_BUCKET_NAME',
            value: record.name,
          });
        }

        if (record.json) {
          values.push({
            key: 'GCP_SERVICE_ACCOUNT',
            json: JSON.parse(record.json.trim()),
          });
        }

        props.saveConfigurationAsJson(values);
      }, [record, props.variables, props.saveConfigurationAsJson]);

      return (
        <form onSubmit={onSaveConfiguration} className="w-full">
          <TextInput
            label="GCP Cloud Bucket"
            placeholder="(Optional)"
            value={record['name']}
            onChange={(e) => {
              setRecord((d) => {
                d['name'] = e.target.value;
                return d;
              });
            }}
          />
          <div>
            <h3 className="py-2 text-sm font-medium">Paste JSON configuration</h3>
            <Textarea
              resize="vertical"
              required
              className="w-full font-mono text-sm rounded"
              rows={8}
              value={record['json']}
              onChange={(e) =>
                setRecord((d) => {
                  d['json'] = e.target.value;
                  return d;
                })
              }
            />
          </div>
          <div className="bg-gray-800/40 rounded-lg py-2 flex flex-row items-center justify-end gap-4 px-4 bg-blend-multiply">
            <Button variant="filled" type="submit">
              {props.loading ? (
                <IconLoader className="animate-spin" />
              ) : (
                <>Confirm Configurations</>
              )}
            </Button>
          </div>
        </form>
      );
    },
  },
];

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

const useSessionToken = function () {
  const router = useRouter();
  const token = localStorage.getItem('token');
  if (typeof token !== 'string') {
    router.replace(`/login?continue=${window.location.href}`);
    return;
  }

  return token;
};

function SettingStoreOption({
  isConfigured,
  selected,
  defaultOpen,
}: {
  isConfigured: boolean;
  selected: Array<{ key: string; value: any }>;
  defaultOpen?: boolean;
}) {
  const [loading, setLoading] = React.useState(false);
  const token = useSessionToken();

  const saveConfigurationAsJson = React.useCallback(
    (conf: Array<Record<'key' | 'json' | 'value', string>>) => {
      if (!token) {
        console.warn('skipped! token empty!');
        return;
      }

      if (isConfigured) {
        if (
          !confirm(
            'Seems like storage has already been set. Changing may have unintended consequences'
          )
        ) {
          return;
        }
      }

      setLoading(true);
      fetch(hikma().path('/v1/admin/configurations'), {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conf),
      })
        .then((res) => {
          if (!res.ok) {
            console.error(res.text());
          }
        })
        .then(() => window.location.reload())
        .finally(() => setLoading(false));
    },
    [token, isConfigured]
  );

  const saveConfigurationAsText = React.useCallback(
    (conf: string) => {
      if (!token) {
        console.warn('skipped! token empty!');
        return;
      }

      if (isConfigured) {
        if (
          !confirm(
            'Seems like storage has already been set. Changing may have unintended consequences'
          )
        ) {
          return;
        }
      }

      setLoading(true);
      fetch(hikma().path('/v1/admin/configurations'), {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'text/plain',
        },
        body: conf,
      })
        .then((res) => {
          if (!res.ok) {
            console.error(res.text());
          }
        })
        .then(() => window.location.reload())
        .finally(() => setLoading(false));
    },
    [token, isConfigured]
  );

  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const Component = React.useMemo(() => {
    if (selectedIndex === null) {
      return null;
    }

    return StoreOptions[selectedIndex].component ?? null;
  }, [selectedIndex]);

  return (
    <div className="py-2 border-t border-gray-700">
      <h3 className="py-2">Select the store you'd like to go with</h3>
      <div className="flex flex-row gap-4 py-2">
        {StoreOptions.map((d, ix) => {
          return (
            <div
              key={`${ix}`}
              onClick={() => {
                setSelectedIndex((d) => {
                  if (d === ix) {
                    return null;
                  }
                  return ix;
                });
              }}
              className={classNames(
                'flex flex-row items-center justify-between',
                'flex-1 border border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer rounded-lg px-3 py-4',
                selectedIndex === ix && 'ring-2 ring-gray-400 bg-gray-700/10'
              )}
            >
              <p>{d.name}</p>
              {d.recommended && (
                <span className="text-sm inline-flex flex-row items-center gap-1 italic text-yellow-400">
                  <IconStarFilled size={15} className="text-yellow-300 size-3" /> Recommended
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="w-full h-96">
        {Component && (
          <Component
            loading={loading}
            saveConfigurationAsText={saveConfigurationAsText}
            // @ts-expect-error here be dragons
            saveConfigurationAsJson={saveConfigurationAsJson}
            // @ts-expect-error here be dragons
            variables={
              selectedIndex !== null ? (StoreOptions[selectedIndex].variables ?? {}) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}

export default function GeneralSettingsPage() {
  const q = useStorageHeadQuery();

  return (
    <AppLayout title={'Settings'}>
      <Settings navKey="storage">
        <Settings.Body>
          <div>
            <h2 className="font-semibold text-xl flex flex-row items-center gap-3 text-gray-400">
              <IconBox className="size-7 inline-block" /> Storage Configuration
            </h2>
            <p className="mt-1 text-sm/6 text-gray-300">
              You are now able to attach your own storage. Currently supporting only S3 (AWS or
              Tigris Data) and GCP Cloud Storage options
            </p>
          </div>
          <main>
            <ConfiguredOption value={q} />
            {q.state === 'success' && (
              <SettingStoreOption
                isConfigured={q.data.is_configured}
                selected={q.data.is_configured ? q.data.keys : []}
              />
            )}
          </main>
        </Settings.Body>
      </Settings>
    </AppLayout>
  );
}
