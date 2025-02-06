import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { Permissions, type Permission } from "@/utils/permissions";

export const createTRPCContext = async (opts: { req: Request }) => {
  try {
    const session = await getServerAuthSession();
    return {
      prisma,
      session,
    };
  } catch (error) {
    console.error('Error in TRPC context:', error);
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication failed',
    });
  }
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    console.error('TRPC Error:', error);
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
        code: error.code,
        message: error.message,
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

const enforceUserHasPermission = (requiredPermissions: Permission[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }

    const userRoles = ctx.session.user.roles || [];
    const userPermissions = ctx.session.user.permissions || [];
    const hasPermission = userRoles.some(role => 
      ['SUPER_ADMIN', 'ADMIN'].includes(role) || 
      requiredPermissions.some(permission => userPermissions.includes(permission))
    );

    if (!hasPermission) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You do not have permission to access this resource',
      });
    }

    return next({
      ctx: {
        session: ctx.session,
      },
    });
  });

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

export const permissionProtectedProcedure = (permissions: Permission[]) =>
  t.procedure.use(enforceUserIsAuthed).use(enforceUserHasPermission(permissions));
