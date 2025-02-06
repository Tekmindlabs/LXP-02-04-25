import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { env } from "@/env.mjs";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const handler = (req: NextRequest) =>
	fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: async () => {
			try {
				const ctx = await createTRPCContext({ req });
				console.log('TRPC Context Created:', {
					hasSession: !!ctx.session,
					userId: ctx.session?.user?.id,
					userRoles: ctx.session?.user?.roles,
					path: req.nextUrl.pathname,
					method: req.method,
				});
				return ctx;
			} catch (error) {
				console.error('Error creating TRPC context:', error);
				throw error;
			}
		},
		onError: ({ path, error }) => {
			console.error(
				`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
				{
					code: error.code,
					data: error.data,
					path,
					input: error.shape?.data?.inputValues,
					stack: error.stack,
				}
			);
			if (error.cause) {
				console.error('Error cause:', error.cause);
			}
		},
	});

export { handler as GET, handler as POST };