import { headers } from "next/headers";
import { createTRPCProxyClient, loggerLink, httpBatchLink } from "@trpc/client";
import { type AppRouter } from "@/server/api/root";
import superjson from "superjson";

export const api = createTRPCProxyClient<AppRouter>({
	links: [
		loggerLink({
			enabled: (opts) =>
				process.env.NODE_ENV === "development" ||
				(opts.direction === "down" && opts.result instanceof Error),
		}),
		httpBatchLink({
			url: `${process.env.NEXT_PUBLIC_APP_URL}/api/trpc`,
			headers() {
				const headersList = headers();
				const headerEntries = Object.fromEntries(headersList.entries());
				return {
					...headerEntries,
					"x-trpc-source": "rsc",
					"x-trpc-session": headerEntries["x-trpc-session"],
				};
			},
			transformer: superjson,
		}),
	],
});