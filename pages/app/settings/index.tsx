import { Button } from '@mantine/core';
import { IconBox, IconLoader } from '@tabler/icons-react';
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
          <div className="flex flex-row items-center justify-between gap-3">
            <p>Configured storage for</p>
            <b className="uppercase">{value.data.store}</b>
          </div>
        ) : (
          <p className="italic text-gray-600">Storage hasn't been configured</p>
        )}
      </div>
    </div>
  );
}

const StoreOptions = [
  {
    id: 's3-native',
    name: 'S3 - AWS Cloud Storage',
    // these variables will be prefilled when making the request
    variables: { HH_STORE_TYPE: 's3', S3_COMPATIBLE_STORAGE_HOST: 'native' },
  },
  {
    id: 's3-tigrisdata',
    name: 'Tigris - S3 Compatible Storage',
    variables: { HH_STORE_TYPE: 's3', S3_COMPATIBLE_STORAGE_HOST: 'tigrisdata' },
  },
  {
    id: 'gcp-native',
    name: 'GCP - Cloud Storage',
    variables: { HH_STORE_TYPE: 'gcp' },
  },
];

const varsToSimpleText = (record: object) => {
  let text = '';
  for (let [key, value] of Object.entries(record)) {
    text += `${key.toUpperCase()}=${value}\n`;
  }

  return text;
};

const useSessionToken = function () {
  const router = useRouter();
  const token = localStorage.getItem('token');
  if (typeof token !== 'string') {
    router.replace(`/login?continue=${window.location.href}`);
    return;
  }

  return token;
};

function SettingStoreOption({ selected }: { selected: Array<{ key: string; value: any }> }) {
  const [conf, setConf] = React.useState<string | undefined>(undefined);
  const [loading, setLoading] = React.useState(false);
  const token = useSessionToken();

  // TODO: might want to include the code that
  // performs a config check before commiting to DB.
  const onSaveConfiguration = React.useCallback(() => {
    setLoading(true);
    if (!token) {
      console.warn('skipped! token empty!');
      return;
    }

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
  }, [conf, token]);

  return (
    <div className="py-2 border-t border-gray-700">
      <h3 className="py-2">Select the store you'd like to go with</h3>
      <div className="flex flex-row gap-4 py-2">
        {StoreOptions.map((d, ix) => {
          return (
            <div
              key={`${ix}`}
              onClick={() => {
                setConf(varsToSimpleText(d.variables) + '\n# Include other configurations below\n');
              }}
              className="flex-1 border border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer rounded-md px-3 py-4"
            >
              <p>{d.name}</p>
            </div>
          );
        })}
      </div>
      <div className="space-y-3">
        <h3 className="py-2">Set Configuration</h3>
        <textarea
          className="w-full font-mono py-2 px-3 text-sm rounded"
          rows={8}
          value={conf}
          onChange={(e) => setConf(e.target.value)}
        />
      </div>
      <div className="bg-gray-800/40 rounded-lg py-2 flex flex-row items-center justify-end gap-4 px-4 bg-blend-multiply">
        <p className="text-sm -pt-2 text-gray-600">
          *Paste the variables here to configure the storage*
        </p>
        <Button onClick={onSaveConfiguration}>
          {loading ? <IconLoader className="animate-spin" /> : <>Confirm Configurations</>}
        </Button>
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
              <SettingStoreOption selected={q.data.is_configured ? q.data.keys : []} />
            )}
          </main>
        </Settings.Body>
      </Settings>
    </AppLayout>
  );
}
