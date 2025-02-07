'use client';

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { loggerLink, httpBatchLink } from '@trpc/client';
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { api } from "@/utils/api";
import superjson from "superjson";

export function Providers({ 
  children, 
  session, 
  cookieHeader 
}: { 
  children: React.ReactNode, 
  session: any,
  cookieHeader: string
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error: any) => {
          if (error?.data?.code === 'UNAUTHORIZED') return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
        staleTime: 5 * 1000, // 5 seconds
      },
    },
  }));

  const [trpcClient] = useState(() => 
    api.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: '/api/trpc',
          headers() {
          return {
            cookie: cookieHeader,
            'x-trpc-source': 'react',
            'x-trpc-session': session?.user?.id ? JSON.stringify({
            id: session.user.id,
            roles: session.user.roles,
            permissions: session.user.permissions,
            }) : undefined,
          };
          },
          transformer: superjson,
        }),

      ],
    })
  );

  return (
    <SessionProvider 
      session={session}
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <api.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider 
            attribute="class" 
            defaultTheme="system" 
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </QueryClientProvider>
      </api.Provider>
    </SessionProvider>
  );
}