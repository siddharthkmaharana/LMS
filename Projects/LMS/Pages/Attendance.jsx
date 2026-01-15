import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import AttendanceMarker from '@/components/attendance/AttendanceMarker';
import DataTable from '@/components/ui/DataTable';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardCheck, Calendar, BookOpen, Users, Clock, Download, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

export default function Attendance() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('mark');
  const [selectedCourseAssignment, setSelectedCourseAssignment] = useState('');
  const [selectedLecture, setSelectedLecture] = useState('');
  const [isMarkerOpen, setIsMarkerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: courseAssignments } = useQuery({
    queryKey: ['courseAssignments'],
    queryFn: () => base44.entities.CourseAssignment.filter({ status: 'active' }),
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list(),
  });

  const { data: lectures } = useQuery({
    queryKey: ['lectures', selectedCourseAssignment],
    queryFn: () => {
      if (selectedCourseAssignment) {
        return base44.entities.Lecture.filter({ course_assignment_id: selectedCourseAssignment }, 'date');
      }
      return base44.entities.Lecture.list('date');
    },
    enabled: true,
  });

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.filter({ status: 'active' }),
  });

  const { data: attendance } = useQuery({
    queryKey: ['attendance', selectedLecture],
    queryFn: () => {
      if (selectedLecture) {
        return base44.entities.Attendance.filter({ lecture_id: selectedLecture });
      }
      return [];
    },
    enabled: !!selectedLecture,
  });

  const { data: allAttendance, isLoading: loadingAllAttendance } = useQuery({
    queryKey: ['allAttendance'],
    queryFn: () => base44.entities.Attendance.list('-created_date', 100),
  });

  const createAttendanceMutation = useMutation({
    mutationFn: (data) => base44.entities.Attendance.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Attendance.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  const updateLectureMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lecture.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
    },
  });

  const getCourseInfo = (courseId) => {
    return courses?.find(c => c.id === courseId) || {};
  };

  const getStudentInfo = (studentId) => {
    return students?.find(s => s.id === studentId) || {};
  };

  const getLectureInfo = (lectureId) => {
    return lectures?.find(l => l.id === lectureId) || {};
  };

  const getEnrolledStudents = () => {
    const assignment = courseAssignments?.find(ca => ca.id === selectedCourseAssignment);
    if (assignment?.enrolled_students?.length > 0) {
      return students?.filter(s => assignment.enrolled_students.includes(s.id)) || [];
    }
    return students || [];
  };

  const handleMarkAttendance = (studentId, status) => {
    const existingRecord = attendance?.find(a => a.student_id === studentId);
    const lecture = getLectureInfo(selectedLecture);
    
    if (existingRecord) {
      updateAttendanceMutation.mutate({
        id: existingRecord.id,
        data: { ...existingRecord, status }
      });
    } else {
      createAttendanceMutation.mutate({
        lecture_id: selectedLecture,
        student_id: studentId,
        course_id: lecture.course_id,
        course_assignment_id: selectedCourseAssignment,
        date: lecture.date,
        status,
        marked_at: new Date().toISOString()
      });
    }
  };

  const handleBulkMarkAttendance = (studentIds, status) => {
    const lecture = getLectureInfo(selectedLecture);
    
    studentIds.forEach(studentId => {
      const existingRecord = attendance?.find(a => a.student_id === studentId);
      
      if (existingRecord) {
        updateAttendanceMutation.mutate({
          id: existingRecord.id,
          data: { ...existingRecord, status }
        });
      } else {
        createAttendanceMutation.mutate({
          lecture_id: selectedLecture,
          student_id: studentId,
          course_id: lecture.course_id,
          course_assignment_id: selectedCourseAssignment,
          date: lecture.date,
          status,
          marked_at: new Date().toISOString()
        });
      }
    });
  };

  const handleLockAttendance = (locked) => {
    updateLectureMutation.mutate({
      id: selectedLecture,
      data: { attendance_locked: locked }
    });
  };

  const selectedLectureInfo = getLectureInfo(selectedLecture);

  // Calculate attendance percentage for records view
  const studentAttendanceStats = useMemo(() => {
    const stats = {};
    students?.forEach(student => {
      const studentRecords = allAttendance?.filter(a => a.student_id === student.id) || [];
      const present = studentRecords.filter(a => a.status === 'present' || a.status === 'late').length;
      const total = studentRecords.length;
      stats[student.id] = {
        present,
        total,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0
      };
    });
    return stats;
  }, [students, allAttendance]);

  const recordColumns = [
    {
      header: 'Student',
      render: (row) => {
        const student = getStudentInfo(row.student_id);
        return (
          <div>
            <p className="font-medium">{student.first_name} {student.last_name}</p>
            <p className="text-sm text-gray-500">{student.roll_number}</p>
          </div>
        );
      }
    },
    {
      header: 'Course',
      render: (row) => {
        const course = getCourseInfo(row.course_id);
        return (
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <span>{course.code} - {course.name}</span>
          </div>
        );
      }
    },
    {
      header: 'Date',
      render: (row) => (
        <span>{format(parseISO(row.date), 'MMM d, yyyy')}</span>
      )
    },
    {
      header: 'Status',
      render: (row) => {
        const statusColors = {
          present: 'bg-green-100 text-green-700',
          absent: 'bg-red-100 text-red-700',
          late: 'bg-amber-100 text-amber-700',
          excused: 'bg-blue-100 text-blue-700'
        };
        return (
          <Badge className={statusColors[row.status]}>
            {row.status}
          </Badge>
        );
      }
    }
  ];

  const filteredRecords = allAttendance?.filter(record => {
    const student = getStudentInfo(record.student_id);
    return (
      student?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student?.roll_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Management"
        subtitle="Track and manage student attendance"
        icon={ClipboardCheck}
        actions={
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
          <TabsTrigger value="records">Attendance Records</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="mark" className="mt-6 space-y-6">
          {/* Selection Filters */}
          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Select Course</label>
                  <Select
                    value={selectedCourseAssignment}
                    onValueChange={(value) => {
                      setSelectedCourseAssignment(value);
                      setSelectedLecture('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course assignment" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseAssignments?.map(ca => {
                        const course = getCourseInfo(ca.course_id);
                        return (
                          <SelectItem key={ca.id} value={ca.id}>
                            {course.code} - {course.name} ({ca.section || 'All'})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Select Lecture</label>
                  <Select
                    value={selectedLecture}
                    onValueChange={setSelectedLecture}
                    disabled={!selectedCourseAssignment}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lecture" />
                    </SelectTrigger>
                    <SelectContent>
                      {lectures?.filter(l => l.course_assignment_id === selectedCourseAssignment).map(lecture => (
                        <SelectItem key={lecture.id} value={lecture.id}>
                          {format(parseISO(lecture.date), 'MMM d')} - {lecture.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Marker */}
          {selectedLecture && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AttendanceMarker
                students={getEnrolledStudents()}
                attendanceRecords={attendance}
                lectureId={selectedLecture}
                isLocked={selectedLectureInfo?.attendance_locked}
                onMarkAttendance={handleMarkAttendance}
                onBulkMarkAttendance={handleBulkMarkAttendance}
                onLockAttendance={handleLockAttendance}
                onSave={() => {}}
                isLoading={createAttendanceMutation.isPending || updateAttendanceMutation.isPending}
              />
            </motion.div>
          )}

          {!selectedLecture && (
            <Card className="shadow-sm border-gray-100">
              <CardContent className="py-12 text-center">
                <ClipboardCheck className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Lecture</h3>
                <p className="text-gray-500">Choose a course and lecture to start marking attendance</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="records" className="mt-6">
          <DataTable
            columns={recordColumns}
            data={filteredRecords}
            isLoading={loadingAllAttendance}
            searchPlaceholder="Search students..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            emptyMessage="No attendance records found"
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students?.slice(0, 12).map(student => {
              const stats = studentAttendanceStats[student.id] || { present: 0, total: 0, percentage: 0 };
              const percentageColor = stats.percentage >= 75 
                ? 'text-green-600' 
                : stats.percentage >= 50 
                ? 'text-amber-600' 
                : 'text-red-600';

              return (
                <Card key={student.id} className="shadow-sm border-gray-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{student.roll_number}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${percentageColor}`}>
                          {stats.percentage}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {stats.present}/{stats.total} classes
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          stats.percentage >= 75 
                            ? 'bg-green-500' 
                            : stats.percentage >= 50 
                            ? 'bg-amber-500' 
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}