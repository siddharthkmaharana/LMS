import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import LectureCalendar from '@/components/calendar/LectureCalendar';
import LectureForm from '@/components/forms/LectureForm';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Plus, Clock, MapPin, BookOpen, Users, Pencil, Trash2, CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function Schedule() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: lectures, isLoading } = useQuery({
    queryKey: ['lectures'],
    queryFn: () => base44.entities.Lecture.list('date'),
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list(),
  });

  const { data: courseAssignments } = useQuery({
    queryKey: ['courseAssignments'],
    queryFn: () => base44.entities.CourseAssignment.filter({ status: 'active' }),
  });

  const { data: faculty } = useQuery({
    queryKey: ['faculty'],
    queryFn: () => base44.entities.Faculty.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Lecture.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      setIsFormOpen(false);
      setEditingLecture(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lecture.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      setIsFormOpen(false);
      setEditingLecture(null);
      setIsDetailOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Lecture.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      setIsDetailOpen(false);
      setSelectedLecture(null);
    },
  });

  const handleAddLecture = (date) => {
    setSelectedDate(date);
    setEditingLecture(null);
    setIsFormOpen(true);
  };

  const handleLectureClick = (lecture) => {
    setSelectedLecture(lecture);
    setIsDetailOpen(true);
  };

  const handleEditLecture = () => {
    setEditingLecture(selectedLecture);
    setIsDetailOpen(false);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data) => {
    const facultyId = courseAssignments?.find(ca => ca.id === data.course_assignment_id)?.faculty_id;
    const submissionData = {
      ...data,
      faculty_id: facultyId || data.faculty_id
    };

    if (editingLecture) {
      updateMutation.mutate({ id: editingLecture.id, data: submissionData });
    } else {
      createMutation.mutate(submissionData);
    }
  };

  const handleStatusChange = (status) => {
    if (selectedLecture) {
      updateMutation.mutate({
        id: selectedLecture.id,
        data: { ...selectedLecture, status }
      });
    }
  };

  const getCourseInfo = (courseId) => {
    return courses?.find(c => c.id === courseId) || {};
  };

  const getFacultyInfo = (facultyId) => {
    return faculty?.find(f => f.id === facultyId) || {};
  };

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    rescheduled: 'bg-orange-100 text-orange-700'
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lecture Schedule"
        subtitle="Manage and schedule lectures with an interactive calendar"
        icon={Calendar}
        actions={
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => handleAddLecture(new Date())}
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Lecture
          </Button>
        }
      />

      <LectureCalendar
        lectures={lectures}
        courses={courses}
        onDateSelect={setSelectedDate}
        onLectureClick={handleLectureClick}
        onAddLecture={handleAddLecture}
      />

      {/* Lecture Form */}
      <LectureForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingLecture(null);
        }}
        onSubmit={handleFormSubmit}
        lecture={editingLecture}
        courseAssignments={courseAssignments}
        courses={courses}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Lecture Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Lecture Details
            </DialogTitle>
          </DialogHeader>

          {selectedLecture && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedLecture.title}</h3>
                <p className="text-blue-600 font-medium">
                  {getCourseInfo(selectedLecture.course_id).code} - {getCourseInfo(selectedLecture.course_id).name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Date</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {format(new Date(selectedLecture.date), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Time</p>
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {selectedLecture.start_time} - {selectedLecture.end_time}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Room</p>
                  <p className="font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {selectedLecture.room || 'Not assigned'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Faculty</p>
                  <p className="font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    {getFacultyInfo(selectedLecture.faculty_id).first_name} {getFacultyInfo(selectedLecture.faculty_id).last_name}
                  </p>
                </div>
              </div>

              {selectedLecture.description && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-gray-700">{selectedLecture.description}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500">Status:</p>
                <Badge className={statusColors[selectedLecture.status]}>
                  {selectedLecture.status}
                </Badge>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('completed')}
                  disabled={selectedLecture.status === 'completed'}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Completed
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={selectedLecture.status === 'cancelled'}
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={handleEditLecture}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(selectedLecture.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}