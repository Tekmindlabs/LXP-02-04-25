import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";

export const createTRPCContext = async (opts: { req: Request }) => {
  try {
    const session = await getServerAuthSession();
    console.log('TRPC Context Session:', session);
    return {
      prisma,
      session,
    };
  } catch (error) {
    console.error('Error in createTRPCContext:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create TRPC context',
      cause: error,
    });
  }
};






const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});


export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const enforceUserHasPermission = (requiredPermission: string) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      return next({
        ctx: {
          session: null,
        },
      });
    }

    if (!ctx.session.user.permissions.includes(requiredPermission)) {
      return next({
        ctx: {
          session: null,
        },
      });
    }

    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

export const permissionProtectedProcedure = (permission: string) =>
  t.procedure.use(enforceUserHasPermission(permission));