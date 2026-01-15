import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Check, X, Clock, AlertCircle, Search, 
  CheckCheck, Users, Lock, Unlock, Save 
} from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function AttendanceMarker({ 
  students, 
  attendanceRecords, 
  lectureId,
  isLocked,
  onMarkAttendance,
  onBulkMarkAttendance,
  onLockAttendance,
  onSave,
  isLoading
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [localAttendance, setLocalAttendance] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const initialAttendance = {};
    attendanceRecords?.forEach(record => {
      initialAttendance[record.student_id] = record.status;
    });
    setLocalAttendance(initialAttendance);
  }, [attendanceRecords]);

  const filteredStudents = students?.filter(student => 
    student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = (studentId, status) => {
    if (isLocked) return;
    setLocalAttendance(prev => ({ ...prev, [studentId]: status }));
    setHasChanges(true);
    onMarkAttendance?.(studentId, status);
  };

  const handleBulkMark = (status) => {
    if (isLocked) return;
    const bulkUpdate = {};
    filteredStudents?.forEach(student => {
      bulkUpdate[student.id] = status;
    });
    setLocalAttendance(prev => ({ ...prev, ...bulkUpdate }));
    setHasChanges(true);
    onBulkMarkAttendance?.(filteredStudents?.map(s => s.id), status);
  };

  const getStatusButton = (studentId, status, icon, label, color) => {
    const isActive = localAttendance[studentId] === status;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant={isActive ? "default" : "outline"}
              className={`${isActive ? color : ''} transition-all`}
              onClick={() => handleStatusChange(studentId, status)}
              disabled={isLocked}
            >
              {icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const stats = {
    present: Object.values(localAttendance).filter(s => s === 'present').length,
    absent: Object.values(localAttendance).filter(s => s === 'absent').length,
    late: Object.values(localAttendance).filter(s => s === 'late').length,
    excused: Object.values(localAttendance).filter(s => s === 'excused').length,
    total: students?.length || 0
  };

  const attendancePercentage = stats.total > 0 
    ? Math.round(((stats.present + stats.late) / stats.total) * 100) 
    : 0;

  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Mark Attendance
            {isLocked && (
              <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700">
                <Lock className="w-3 h-3 mr-1" />
                Locked
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLockAttendance?.(!isLocked)}
              className={isLocked ? 'text-amber-600' : ''}
            >
              {isLocked ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
              {isLocked ? 'Unlock' : 'Lock'}
            </Button>
            {hasChanges && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={onSave}
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-green-50 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <div className="text-xs text-green-700">Present</div>
          </div>
          <div className="p-3 rounded-xl bg-red-50 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            <div className="text-xs text-red-700">Absent</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.late}</div>
            <div className="text-xs text-amber-700">Late</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.excused}</div>
            <div className="text-xs text-blue-700">Excused</div>
          </div>
          <div className="p-3 rounded-xl bg-gray-100 text-center">
            <div className={`text-2xl font-bold ${attendancePercentage >= 75 ? 'text-green-600' : attendancePercentage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
              {attendancePercentage}%
            </div>
            <div className="text-xs text-gray-600">Attendance</div>
          </div>
        </div>

        {/* Search and Bulk Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkMark('present')}
              disabled={isLocked}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              All Present
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkMark('absent')}
              disabled={isLocked}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-2" />
              All Absent
            </Button>
          </div>
        </div>

        {/* Student List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredStudents?.map((student, idx) => {
            const status = localAttendance[student.id] || 'absent';
            const statusColors = {
              present: 'border-l-green-500 bg-green-50/30',
              absent: 'border-l-red-500 bg-red-50/30',
              late: 'border-l-amber-500 bg-amber-50/30',
              excused: 'border-l-blue-500 bg-blue-50/30'
            };

            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${statusColors[status]} transition-all`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-medium">
                      {student.first_name?.[0]}{student.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{student.roll_number}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusButton(student.id, 'present', <Check className="w-4 h-4" />, 'Present', 'bg-green-500 hover:bg-green-600')}
                  {getStatusButton(student.id, 'absent', <X className="w-4 h-4" />, 'Absent', 'bg-red-500 hover:bg-red-600')}
                  {getStatusButton(student.id, 'late', <Clock className="w-4 h-4" />, 'Late', 'bg-amber-500 hover:bg-amber-600')}
                  {getStatusButton(student.id, 'excused', <AlertCircle className="w-4 h-4" />, 'Excused', 'bg-blue-500 hover:bg-blue-600')}
                </div>
              </motion.div>
            );
          })}

          {filteredStudents?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No students found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}