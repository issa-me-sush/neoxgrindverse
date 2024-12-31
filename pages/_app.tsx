import { config } from "../config/alchemy";
import { cookieToInitialState } from "@account-kit/core";
import type { AppProps } from 'next/app';
import type { AppContext } from 'next/app';
import { AlchemyProvider } from "../components/providers/AlchemyProvider";
import '../styles/globals.css';
import { useEffect, useState } from 'react';

type Props = AppProps & {
  initialState?: any;
};

function MyApp({ Component, pageProps, initialState }: Props) {
  // Add client-side hydration check
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // or a loading spinner
  }

  return (
    <AlchemyProvider initialState={initialState}>
      <Component {...pageProps} />
    </AlchemyProvider>
  );
}

MyApp.getInitialProps = async ({ ctx }: AppContext) => {
  // Only run on server side
  if (!ctx.req) {
    return { initialState: undefined };
  }

  const cookieString = ctx.req?.headers.cookie;
  
  try {
    const initialState = cookieString 
      ? cookieToInitialState(config, cookieString)
      : undefined;

    return { initialState };
  } catch (error) {
    console.error('Error hydrating state:', error);
    return { initialState: undefined };
  }
};

export default MyApp;