import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
  BarChart3, Download, Users, GraduationCap, BookOpen, 
  ClipboardCheck, TrendingUp, FileText, Calendar
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO } from 'date-fns';
import StatCard from '@/components/ui/StatCard';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function Reports() {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [dateRange, setDateRange] = useState('6months');

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list(),
  });

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: faculty } = useQuery({
    queryKey: ['faculty'],
    queryFn: () => base44.entities.Faculty.list(),
  });

  const { data: lectures } = useQuery({
    queryKey: ['lectures'],
    queryFn: () => base44.entities.Lecture.list(),
  });

  const { data: attendance } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => base44.entities.Attendance.list(),
  });

  const { data: assignments } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.Assignment.list(),
  });

  const { data: submissions } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => base44.entities.Submission.list(),
  });

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalStudents = students?.length || 0;
    const totalFaculty = faculty?.length || 0;
    const totalCourses = courses?.length || 0;
    const totalLectures = lectures?.length || 0;
    
    const completedLectures = lectures?.filter(l => l.status === 'completed').length || 0;
    const lectureCompletionRate = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

    const presentCount = attendance?.filter(a => a.status === 'present' || a.status === 'late').length || 0;
    const totalAttendance = attendance?.length || 0;
    const averageAttendance = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    return {
      totalStudents,
      totalFaculty,
      totalCourses,
      totalLectures,
      lectureCompletionRate,
      averageAttendance
    };
  }, [students, faculty, courses, lectures, attendance]);

  // Department-wise student distribution
  const departmentData = useMemo(() => {
    const deptCounts = {};
    students?.forEach(student => {
      const dept = departments?.find(d => d.id === student.department_id);
      const deptName = dept?.name || 'Unassigned';
      deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
    });
    return Object.entries(deptCounts).map(([name, value]) => ({ name, value }));
  }, [students, departments]);

  // Monthly attendance trend
  const attendanceTrend = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthAttendance = attendance?.filter(a => {
        const date = parseISO(a.date);
        return date >= monthStart && date <= monthEnd;
      }) || [];

      const present = monthAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
      const total = monthAttendance.length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        name: format(month, 'MMM'),
        attendance: rate,
        present,
        total
      };
    });
  }, [attendance]);

  // Course-wise lecture completion
  const courseProgress = useMemo(() => {
    return courses?.slice(0, 8).map(course => {
      const courseLectures = lectures?.filter(l => l.course_id === course.id) || [];
      const completed = courseLectures.filter(l => l.status === 'completed').length;
      const total = courseLectures.length || course.total_lectures || 40;
      
      return {
        name: course.code,
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    }) || [];
  }, [courses, lectures]);

  // Assignment submission stats
  const assignmentStats = useMemo(() => {
    return assignments?.slice(0, 6).map(assignment => {
      const assignmentSubmissions = submissions?.filter(s => s.assignment_id === assignment.id) || [];
      const submitted = assignmentSubmissions.length;
      const graded = assignmentSubmissions.filter(s => s.status === 'graded').length;
      const late = assignmentSubmissions.filter(s => s.is_late).length;

      return {
        name: assignment.title?.substring(0, 15) || 'Assignment',
        submitted,
        graded,
        late
      };
    }) || [];
  }, [assignments, submissions]);

  // Student status distribution
  const studentStatusData = useMemo(() => {
    const statusCounts = { active: 0, graduated: 0, dropped: 0, suspended: 0 };
    students?.forEach(s => {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    }));
  }, [students]);

  const exportReport = () => {
    // Generate CSV data
    const csvData = [
      ['Report Type', 'Metric', 'Value'],
      ['Summary', 'Total Students', summaryStats.totalStudents],
      ['Summary', 'Total Faculty', summaryStats.totalFaculty],
      ['Summary', 'Total Courses', summaryStats.totalCourses],
      ['Summary', 'Average Attendance', `${summaryStats.averageAttendance}%`],
      ['Summary', 'Lecture Completion', `${summaryStats.lectureCompletionRate}%`],
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lms-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Comprehensive academic insights and statistics"
        icon={BarChart3}
        actions={
          <Button onClick={exportReport} className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Students"
          value={summaryStats.totalStudents}
          icon={GraduationCap}
          color="blue"
        />
        <StatCard
          title="Faculty"
          value={summaryStats.totalFaculty}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Courses"
          value={summaryStats.totalCourses}
          icon={BookOpen}
          color="green"
        />
        <StatCard
          title="Lectures"
          value={summaryStats.totalLectures}
          icon={Calendar}
          color="orange"
        />
        <StatCard
          title="Avg Attendance"
          value={`${summaryStats.averageAttendance}%`}
          icon={ClipboardCheck}
          color="cyan"
        />
        <StatCard
          title="Completion Rate"
          value={`${summaryStats.lectureCompletionRate}%`}
          icon={TrendingUp}
          color="pink"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Attendance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="attendance" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.2}
                    name="Attendance %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Students by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              Course Lecture Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseProgress} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="percentage" fill="#10B981" radius={[0, 4, 4, 0]} name="Completion %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Stats */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              Assignment Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assignmentStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="submitted" fill="#3B82F6" name="Submitted" />
                  <Bar dataKey="graded" fill="#10B981" name="Graded" />
                  <Bar dataKey="late" fill="#F59E0B" name="Late" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Status */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            Student Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {studentStatusData.map((status, index) => (
              <div 
                key={status.name} 
                className="p-4 rounded-xl text-center"
                style={{ backgroundColor: `${COLORS[index]}15` }}
              >
                <p 
                  className="text-3xl font-bold"
                  style={{ color: COLORS[index] }}
                >
                  {status.value}
                </p>
                <p className="text-sm text-gray-600 mt-1">{status.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}