import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { env } from "@/env.mjs";
import { authOptions } from "@/server/auth";
import { prisma } from "@/server/db";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const handler = (req: NextRequest) =>
	fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: async () => {
			try {
				const sessionHeader = req.headers.get('x-trpc-session');
				let session = null;

				if (sessionHeader) {
					try {
						const sessionData = JSON.parse(sessionHeader);
						session = {
							user: {
								id: sessionData.id,
								roles: sessionData.roles,
								permissions: sessionData.permissions,
							},
							expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
						};
					} catch (e) {
						console.error('Error parsing session header:', e);
					}
				}

				if (!session) {
					session = await getServerSession(authOptions);
				}

				return {
					prisma,
					session,
				};
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