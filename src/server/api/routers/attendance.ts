import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { AttendanceStatus } from "@prisma/client";
import { startOfDay, endOfDay, subDays, startOfWeek, format } from "date-fns";

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
                date: record.date,
                status: record.status,
                notes: record.notes,
              },
            })
          )
        );
      }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const weekStart = startOfWeek(today);

    // Get today's stats with student and class info
    const todayAttendance = await ctx.prisma.attendance.findMany({
      where: {
        date: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
      include: {
        student: {
          include: {
            user: true,
            class: true
          }
        }
      }
    });

    // Get weekly attendance
    const weeklyAttendance = await ctx.prisma.attendance.findMany({
      where: {
        date: {
          gte: weekStart,
          lte: today,
        },
      }
    });

    // Get most absent students
    const absentStudents = await ctx.prisma.attendance.groupBy({
      by: ['studentId'],
      where: {
        status: AttendanceStatus.ABSENT,
        date: {
          gte: subDays(today, 30),
        },
      },
      _count: {
        studentId: true
      },
      orderBy: {
        _count: {
          studentId: 'desc'
        }
      },
      take: 3,
    });

    // Get student details for absent students
    const absentStudentDetails = await Promise.all(
      absentStudents.map(async (record) => {
        const student = await ctx.prisma.studentProfile.findUnique({
          where: { id: record.studentId },
          include: { user: true }
        });
        return {
          name: student?.user.name ?? 'Unknown',
          absences: record._count.studentId
        };
      })
    );

    // Process class-wise attendance
    const classAttendanceMap = todayAttendance.reduce((acc, record) => {
      const className = record.student.class?.name;
      if (!className) return acc;

      if (!acc[className]) {
        acc[className] = { present: 0, total: 0 };
      }
      
      if (record.status === AttendanceStatus.PRESENT) {
        acc[className].present++;
      }
      acc[className].total++;
      
      return acc;
    }, {} as Record<string, { present: number; total: number }>);

    const lowAttendanceClasses = Object.entries(classAttendanceMap)
      .map(([name, stats]) => ({
        name,
        percentage: (stats.present / stats.total) * 100
      }))
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 3);

    return {
      todayStats: {
        present: todayAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length,
        absent: todayAttendance.filter(a => a.status === AttendanceStatus.ABSENT).length,
        total: todayAttendance.length
      },
      weeklyPercentage: weeklyAttendance.length > 0
        ? (weeklyAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length / weeklyAttendance.length) * 100
        : 0,
      mostAbsentStudents: absentStudentDetails,
      lowAttendanceClasses
    };
  }),

  getDashboardData: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const lastWeek = subDays(today, 7);

    // Get attendance records for trend
    const attendanceRecords = await ctx.prisma.attendance.findMany({
      where: {
        date: {
          gte: lastWeek,
          lte: today,
        },
      },
      include: {
        student: {
          include: {
            class: true
          }
        }
      }
    });

    // Process daily attendance for trend
    const dailyAttendanceMap = attendanceRecords.reduce((acc, record) => {
      const dateStr = format(record.date, 'yyyy-MM-dd');
      if (!acc[dateStr]) {
        acc[dateStr] = { present: 0, total: 0 };
      }
      if (record.status === AttendanceStatus.PRESENT) {
        acc[dateStr].present++;
      }
      acc[dateStr].total++;
      return acc;
    }, {} as Record<string, { present: number; total: number }>);

    // Create trend data array
    const trendData = Array.from({ length: 8 }, (_, i) => {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const stats = dailyAttendanceMap[dateStr] || { present: 0, total: 0 };
      return {
        date: dateStr,
        percentage: stats.total > 0 ? (stats.present / stats.total) * 100 : 0
      };
    }).reverse();

    // Process class-wise attendance
    const classAttendanceMap = attendanceRecords.reduce((acc, record) => {
      const className = record.student.class?.name;
      if (!className) return acc;

      if (!acc[className]) {
        acc[className] = { present: 0, absent: 0 };
      }

      if (record.status === AttendanceStatus.PRESENT) {
        acc[className].present++;
      } else if (record.status === AttendanceStatus.ABSENT) {
        acc[className].absent++;
      }

      return acc;
    }, {} as Record<string, { present: number; absent: number }>);

    const classAttendanceData = Object.entries(classAttendanceMap).map(([className, stats]) => ({
      className,
      present: stats.present,
      absent: stats.absent,
      percentage: ((stats.present / (stats.present + stats.absent)) * 100) || 0
    }));

    return {
      attendanceTrend: trendData,
      classAttendance: classAttendanceData
    };
  }),
});