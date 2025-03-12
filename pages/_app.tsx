import install from '../lib/twind-with-next/app';
import config from '../twind.config';

import { ColorSchemeScript, createTheme, MantineColorScheme, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { emotionTransform, MantineEmotionProvider } from '@mantine/emotion';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { getCookie } from 'cookies-next';
import NextApp, { AppContext, AppProps } from 'next/app';
import Head from 'next/head';
import { emotionCache } from '../emotion/cache';
import './index.css';

const theme = createTheme({});

function App(props: AppProps & { colorScheme: MantineColorScheme }) {
  const { Component, pageProps } = props;
  // const { setColorScheme, clearColorScheme, colorScheme } = useMantineColorScheme();

  // const toggleColorScheme = (value?: ColorScheme) => {
  //   const nextColorScheme = value || (colorScheme === 'dark' ? 'light' : 'dark');
  //   setColorScheme(nextColorScheme);
  //   setCookie('mantine-color-scheme', nextColorScheme, { maxAge: 60 * 60 * 24 * 30 });
  // };

  return (
    <MantineEmotionProvider cache={emotionCache}>
      <MantineProvider
        theme={theme}
        // forceColorScheme={colorScheme as any}
        stylesTransform={emotionTransform}
        defaultColorScheme="dark"
        // withGlobalStyles
        // withNormalizeCSS
      >
        <Head>
          <title>Hikma Health Admin Dashboard</title>
          <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
          <link rel="shortcut icon" href="/favicon.svg" />
          <ColorSchemeScript />
        </Head>

        <ColorSchemeScript
          defaultColorScheme="dark"
          // onToggle={() => setColorScheme(colorScheme === 'light' ? 'dark' : 'light')}
        />
        <Component {...pageProps} />
        <Notifications />
      </MantineProvider>
    </MantineEmotionProvider>
  );
}

App.getInitialProps = async (appContext: AppContext) => {
  const appProps = await NextApp.getInitialProps(appContext);
  return {
    ...appProps,
    colorScheme: getCookie('mantine-color-scheme', appContext.ctx) || 'dark',
  };
};

export default install(config, App);
