import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { PrivyProvider } from '@/providers/PrivyProvider';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>FlashDAO - Event-Based Decentralized Autonomous Organization</title>
        <meta name="description" content="A decentralized platform for emergency response and community support" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <PrivyProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </PrivyProvider>
    </>
  );
}

export default MyApp; 