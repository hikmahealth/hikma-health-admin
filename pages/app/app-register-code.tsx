import { Box, Title } from '@mantine/core';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import AppLayout from '../../components/Layout';
const HIKMA_API = process.env.NEXT_PUBLIC_HIKMA_API;

// TODO: Add support for cycling through the registerd QR codes, and invalidating them over time.

export default function AppRegisterCode() {
  const [code, setCode] = useState(HIKMA_API);

  return (
    <AppLayout title="Register App">
      <Title order={3}>Scan here to with a new app to register your app.</Title>
      {code ? (
        <Box p={4}>
          <QRCodeSVG
            style={{ padding: 20 }}
            bgColor={'#fff'}
            value={code}
            level="M"
            size={400}
            marginSize={4}
          />
        </Box>
      ) : (
        <p>Error loading Code</p>
      )}
    </AppLayout>
  );
}
