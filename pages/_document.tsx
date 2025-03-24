import NextDocument, { Head, Html, Main, NextScript } from 'next/document';
import install from '../lib/twind-with-next/document';
// import { createGetInitialProps } from '@mantine/next';
import createEmotionServer from '@emotion/server/create-instance';
import { ColorSchemeScript } from '@mantine/core';
import { createGetInitialProps } from '@mantine/emotion';
// Import cache created in the previous step
import { emotionCache } from '../emotion/cache';

const stylesServer = createEmotionServer(emotionCache);

const getInitialProps = createGetInitialProps(NextDocument, stylesServer);

class _Document extends NextDocument {
  static getInitialProps = getInitialProps;

  render() {
    return (
      <Html lang="en">
        <Head>
          <ColorSchemeScript />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

// function MyDocument extends Document() {
//   return (
//     <Html lang="en">
//       <Head>
//         <ColorSchemeScript />
//       </Head>
//       <body>
//         <Main />
//         <NextScript />
//       </body>
//     </Html>
//   );
// }

// Document.getInitialProps = createGetInitialProps(NextDocument, stylesServer);

export default install(_Document as any);
