import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { AttendanceStatus } from "@prisma/client";
import { startOfDay, endOfDay } from "date-fns";

export const attendanceRouter = createTRPCRouter({
    getByDateAndClass: protectedProcedure
      .input(z.object({
        date: z.date(),
        classId: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const { date, classId } = input;
        return ctx.prisma.attendance.findMany({
          where: {
            date: {
              gte: startOfDay(date),
              lte: endOfDay(date),
            },
            student: {
              classId: classId
            }
          },
          include: {
            student: {
              include: {
                user: true
              }
            }
          },
        });
      }),
  
    batchSave: protectedProcedure
      .input(z.object({
        records: z.array(z.object({
          studentId: z.string(),
          classId: z.string(),
          date: z.date(),
          status: z.nativeEnum(AttendanceStatus),
          notes: z.string().optional()
        }))
      }))
      .mutation(async ({ ctx, input }) => {
        const { records } = input;
        
        return ctx.prisma.$transaction(
          records.map(record =>
            ctx.prisma.attendance.upsert({
              where: {
                studentId_date: {
                  studentId: record.studentId,
                  date: record.date,
                }
              },

              update: {
                status: record.status,
                notes: record.notes,
              },
              create: {
                studentId: record.studentId,
                classId: record.classId,
                date: record.date,
                status: record.status,
                notes: record.notes,
              },
            })
          )
        );
      }),
  });