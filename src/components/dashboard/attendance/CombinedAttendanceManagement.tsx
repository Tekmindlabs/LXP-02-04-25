
import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AttendanceStats } from './AttendanceStats';
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
  const [selectedClass, setSelectedClass] = useState<string>("no-class-selected");
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


  // Fetch stats and dashboard data
  const { data: statsData, isLoading: isStatsLoading } = api.attendance.getStats.useQuery();
  const { data: dashboardData, isLoading: isDashboardLoading } = api.attendance.getDashboardData.useQuery();


  return (
    <div className="container mx-auto p-4">
        {isStatsLoading ? (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        ) : (
        <AttendanceStats {...(statsData || {
          todayStats: { present: 0, absent: 0, total: 0 },
          weeklyPercentage: 0,
          mostAbsentStudents: [],
          lowAttendanceClasses: []
        })} />
        )}

      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Attendance Management</h2>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AttendanceDashboard {...dashboardData} />
          </TabsContent>

          <TabsContent value="mark">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Class</label>
                <Select
                  value={selectedClass || "no-class-selected"}
                  onValueChange={setSelectedClass}
                >
                  <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                  {!session?.user ? (
                    <SelectItem value="not-signed-in" disabled>Please sign in</SelectItem>
                  ) : !isAdmin && !isTeacher ? (
                    <SelectItem value="unauthorized" disabled>Unauthorized access</SelectItem>
                  ) : classError ? (
                    <SelectItem value="error-loading" disabled>Error loading classes</SelectItem>
                  ) : classes ? (
                    classes.length > 0 ? (
                    classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                      </SelectItem>
                    ))
                    ) : (
                    <SelectItem value="no-classes" disabled>No classes found</SelectItem>
                    )
                  ) : (
                    <SelectItem value="loading" disabled>Loading classes...</SelectItem>
                  )}
                  </SelectContent>
                </Select>
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
                            <Select
                              value={attendanceData.get(student.id) || 'NOT_MARKED'}
                              onValueChange={(value) => markAttendance(student.id, value as AttendanceStatus)}
                            >
                              <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                              <SelectItem value="NOT_MARKED">Not Marked</SelectItem>
                              {Object.values(AttendanceStatus).map(status => (
                              <SelectItem key={status} value={status}>
                              {status}
                              </SelectItem>
                              ))}
                              </SelectContent>
                            </Select>
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

          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-4">
            <div className="flex gap-4">
              <Button variant="outline">Daily Report</Button>
              <Button variant="outline">Weekly Report</Button>
              <Button variant="outline">Monthly Report</Button>
            </div>
            <Card>
              <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Generate Custom Report</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                  ))}
                </SelectContent>
                </Select>
                <div className="flex gap-2">
                <Button variant="outline">Export PDF</Button>
                <Button variant="outline">Export Excel</Button>
                </div>
              </div>
              </CardContent>
            </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Attendance Settings</h3>
              <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Enable Notifications</span>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <span>Auto-mark Late After</span>
                <Select defaultValue="15">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select minutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                </SelectContent>
                </Select>
              </div>
              </div>
            </CardContent>
            </Card>
          </TabsContent>
          </Tabs>

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