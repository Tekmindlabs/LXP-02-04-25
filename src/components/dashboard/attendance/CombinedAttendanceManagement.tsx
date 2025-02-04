
import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSwipeable } from 'react-swipeable';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/utils/api';
import { AttendanceStatus } from '@prisma/client';
import { useSession } from 'next-auth/react';

interface StudentWithUser {
  id: string;
  user: {
    name: string | null;
    email: string | null;
  };
}

interface ExistingAttendance {
  studentId: string;
  status: AttendanceStatus;
}


export const CombinedAttendanceManagement = () => {
  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('quick');
  const [attendanceData, setAttendanceData] = useState<Map<string, AttendanceStatus>>(new Map());

  // Check user roles
  const isAdmin = session?.user?.roles?.includes('ADMIN') || session?.user?.roles?.includes('SUPER_ADMIN');
  const isTeacher = session?.user?.roles?.includes('TEACHER');

  console.log('Session Status:', sessionStatus);
  console.log('User Session:', {
    id: session?.user?.id,
    roles: session?.user?.roles,
    isAdmin,
    isTeacher
  });

  // Fetch classes with unified error handling
  const { data: classes, error: classError } = api.class.list.useQuery(
    undefined,
    {
      enabled: !!session?.user && (isAdmin || isTeacher),
      retry: false
    }
  );

  // Handle class loading error
  useEffect(() => {
    if (classError) {
      console.error('Classes error:', classError);
      toast({
        title: "Error",
        description: "Failed to load classes",
        variant: "destructive"
      });
    }
  }, [classError, toast]);




  
  // Fetch students for selected class
  const { data: students } = api.student.list.useQuery(
    { classId: selectedClass! },
    { enabled: !!selectedClass }
  );

  // Fetch existing attendance
  const { data: existingAttendance } = api.attendance.getByDateAndClass.useQuery(
    { date: selectedDate, classId: selectedClass! },
    { enabled: !!selectedClass }
  );

  // Mutations

  const saveAttendanceMutation = api.attendance.batchSave.useMutation();


  // Initialize attendance data from existing records
  useEffect(() => {
    if (existingAttendance) {
      const newAttendanceData = new Map();
        existingAttendance.forEach((record: ExistingAttendance) => {
        newAttendanceData.set(record.studentId, record.status);
      });
      setAttendanceData(newAttendanceData);
    }
  }, [existingAttendance]);

  // Swipe handlers for quick mode
  const handlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      const element = eventData.event.target as HTMLElement;
      const studentId = element.getAttribute('data-student-id');
      if (studentId) markAttendance(studentId, AttendanceStatus.ABSENT);
    },
    onSwipedRight: (eventData) => {
      const element = eventData.event.target as HTMLElement;
      const studentId = element.getAttribute('data-student-id');
      if (studentId) markAttendance(studentId, AttendanceStatus.PRESENT);
    }
  });

  const markAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData(new Map(attendanceData.set(studentId, status)));
  };

  const handleSave = async () => {
    if (!selectedClass) return;

    try {
      const records = Array.from(attendanceData.entries()).map(([studentId, status]) => ({
        studentId,
        status,
        date: selectedDate,
        classId: selectedClass,
        notes: undefined // Add optional notes field
      }));

      await saveAttendanceMutation.mutateAsync({
        records
      });

      toast({
        title: "Success",
        description: "Attendance saved successfully"
      });
    } catch (error: Error | unknown) {
      toast({
        title: "Error",
        description: "Failed to save attendance",
        variant: "destructive"
      });
    }
  };


  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
            <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Attendance Management</h2>
            </div>

        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Class</label>
              <select
                className="w-full p-2 border rounded"
                onChange={(e) => setSelectedClass(e.target.value)}
                value={selectedClass || ''}
              >
                <option value="">Select a class</option>
                {!session?.user ? (
                  <option value="" disabled>Please sign in</option>
                ) : !isAdmin && !isTeacher ? (
                  <option value="" disabled>Unauthorized access</option>
                ) : classError ? (
                  <option value="" disabled>Error loading classes</option>
                ) : classes ? (
                  classes.length > 0 ? (
                  classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))
                  ) : (
                  <option value="" disabled>No classes found</option>
                  )
                ) : (
                  <option value="" disabled>Loading classes...</option>
                )}

              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </div>
          </div>

            {selectedClass && students && (
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quick">Quick Mode</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Mode</TabsTrigger>
              </TabsList>
              <TabsContent value="quick">
                <div className="space-y-2">
                    {students?.map((student) => (
                      <div
                      key={student.id}
                      {...handlers}
                      data-student-id={student.id}
                      className={`p-4 rounded-lg shadow transition-colors ${
                      attendanceData.get(student.id) === AttendanceStatus.PRESENT
                      ? 'bg-green-50'
                      : attendanceData.get(student.id) === AttendanceStatus.ABSENT
                      ? 'bg-red-50'
                      : 'bg-white'
                      }`}
                      >
                      <div className="flex justify-between items-center">
                      <span>{student.user.name || 'Unnamed Student'}</span>
                        <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAttendance(student.id, AttendanceStatus.PRESENT)}
                        >
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAttendance(student.id, AttendanceStatus.ABSENT)}
                        >
                          Absent
                        </Button>
                        </div>
                      </div>
                      </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="detailed">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left p-2">Student</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students?.map((student: StudentWithUser) => (
                      <tr key={student.id}>
                        <td className="p-2">{student.user.name}</td>
                        <td className="p-2">
                          <select
                            className="w-full p-2 border rounded"
                            value={attendanceData.get(student.id) || ''}
                            onChange={(e) => markAttendance(student.id, e.target.value as AttendanceStatus)}
                          >
                            <option value="">Select status</option>
                            {Object.values(AttendanceStatus).map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full p-2 border rounded"
                            placeholder="Add notes..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TabsContent>
            </Tabs>
          )}

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!selectedClass || attendanceData.size === 0}
            >
              Save Attendance
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};