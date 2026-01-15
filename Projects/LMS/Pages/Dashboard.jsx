import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, isToday, isTomorrow, addDays, startOfDay } from 'date-fns';
import QuickStats from '@/components/dashboard/QuickStats';
import UpcomingLectures from '@/components/dashboard/UpcomingLectures';
import RecentActivity from '@/components/dashboard/RecentActivity';
import AttendanceChart from '@/components/dashboard/AttendanceChart';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.filter({ status: 'active' }),
  });

  const { data: faculty, isLoading: loadingFaculty } = useQuery({
    queryKey: ['faculty'],
    queryFn: () => base44.entities.Faculty.filter({ status: 'active' }),
  });

  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.filter({ status: 'active' }),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.filter({ status: 'active' }),
  });

  const { data: todayLectures, isLoading: loadingLectures } = useQuery({
    queryKey: ['todayLectures', today],
    queryFn: () => base44.entities.Lecture.filter({ date: today }),
  });

  const { data: upcomingLectures } = useQuery({
    queryKey: ['upcomingLectures'],
    queryFn: () => base44.entities.Lecture.filter({ status: 'scheduled' }, 'date', 10),
  });

  const { data: pendingAssignments } = useQuery({
    queryKey: ['pendingAssignments'],
    queryFn: () => base44.entities.Assignment.filter({ status: 'published' }),
  });

  const { data: activityLogs } = useQuery({
    queryKey: ['activityLogs'],
    queryFn: () => base44.entities.ActivityLog.list('-created_date', 10),
  });

  const isLoading = loadingStudents || loadingFaculty || loadingCourses || loadingLectures;

  const stats = {
    totalStudents: students?.length || 0,
    totalFaculty: faculty?.length || 0,
    activeCourses: courses?.length || 0,
    todayLectures: todayLectures?.length || 0,
    pendingAssignments: pendingAssignments?.length || 0,
    departments: departments?.length || 0,
  };

  // Mock attendance data for chart
  const attendanceData = [
    { name: 'Mon', attendance: 92 },
    { name: 'Tue', attendance: 88 },
    { name: 'Wed', attendance: 95 },
    { name: 'Thu', attendance: 85 },
    { name: 'Fri', attendance: 90 },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back! Here's what's happening today.`}
        icon={LayoutDashboard}
      />

      {/* Quick Stats */}
      <QuickStats stats={stats} isLoading={isLoading} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Today's Schedule
              </CardTitle>
              <Link to={createPageUrl('Schedule')}>
                <Button variant="ghost" size="sm" className="text-blue-600">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {todayLectures?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p className="font-medium">No lectures scheduled for today</p>
                  <p className="text-sm mt-1">Enjoy your day!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayLectures?.map((lecture, idx) => {
                    const course = courses?.find(c => c.id === lecture.course_id);
                    return (
                      <motion.div
                        key={lecture.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100"
                      >
                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-blue-50 rounded-xl">
                          <span className="text-lg font-bold text-blue-600">{lecture.start_time}</span>
                          <span className="text-xs text-gray-500">to {lecture.end_time}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{lecture.title}</h4>
                          <p className="text-sm text-blue-600">{course?.code} - {course?.name}</p>
                          {lecture.room && (
                            <p className="text-xs text-gray-500 mt-1">Room: {lecture.room}</p>
                          )}
                        </div>
                        <Badge
                          className={
                            lecture.status === 'completed' 
                              ? 'bg-green-100 text-green-700' 
                              : lecture.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }
                        >
                          {lecture.status}
                        </Badge>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Attendance Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <AttendanceChart data={attendanceData} title="Weekly Attendance" />
        </motion.div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Lectures */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <UpcomingLectures 
            lectures={upcomingLectures} 
            courses={courses}
            isLoading={loadingLectures} 
          />
        </motion.div>

        {/* Pending Assignments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                Pending Assignments
              </CardTitle>
              <Link to={createPageUrl('Assignments')}>
                <Button variant="ghost" size="sm" className="text-blue-600">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {pendingAssignments?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>No pending assignments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingAssignments?.slice(0, 5).map((assignment, idx) => {
                    const course = courses?.find(c => c.id === assignment.course_id);
                    const dueDate = new Date(assignment.due_date);
                    const isOverdue = dueDate < new Date();
                    const isDueSoon = !isOverdue && dueDate < addDays(new Date(), 3);

                    return (
                      <motion.div
                        key={assignment.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                          <p className="text-sm text-gray-500">{course?.code} - {course?.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOverdue && (
                            <Badge className="bg-red-100 text-red-700">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                          {isDueSoon && !isOverdue && (
                            <Badge className="bg-amber-100 text-amber-700">
                              <Clock className="w-3 h-3 mr-1" />
                              Due Soon
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {format(dueDate, 'MMM d')}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <RecentActivity activities={activityLogs} isLoading={false} />
      </motion.div>
    </div>
  );
}