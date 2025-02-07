import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/api/root';
import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server';
import { httpBatchLink, loggerLink } from '@trpc/client';
import superjson from 'superjson';

export const api = createTRPCReact<AppRouter>();

export const getBaseUrl = () => {
	if (typeof window !== 'undefined') return '';
	return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const getHeaders = (session?: any) => {
	const headers: Record<string, string> = {
		'x-trpc-source': 'client',
	};

	if (session?.user) {
		headers['x-trpc-session'] = JSON.stringify({
			id: session.user.id,
			roles: session.user.roles,
			permissions: session.user.permissions,
		});
	}

	return headers;
};

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

