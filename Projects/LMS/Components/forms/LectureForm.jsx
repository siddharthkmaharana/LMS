import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, MapPin, BookOpen, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';

export default function LectureForm({
  isOpen,
  onClose,
  onSubmit,
  lecture,
  courseAssignments,
  courses,
  isLoading
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_assignment_id: '',
    course_id: '',
    date: new Date(),
    start_time: '09:00',
    end_time: '10:00',
    room: '',
    lecture_number: 1,
    status: 'scheduled'
  });

  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    if (lecture) {
      setFormData({
        ...lecture,
        date: lecture.date ? new Date(lecture.date) : new Date()
      });
    } else {
      setFormData({
        title: '',
        description: '',
        course_assignment_id: '',
        course_id: '',
        date: new Date(),
        start_time: '09:00',
        end_time: '10:00',
        room: '',
        lecture_number: 1,
        status: 'scheduled'
      });
    }
  }, [lecture, isOpen]);

  const handleCourseAssignmentChange = (assignmentId) => {
    const assignment = courseAssignments?.find(ca => ca.id === assignmentId);
    setFormData(prev => ({
      ...prev,
      course_assignment_id: assignmentId,
      course_id: assignment?.course_id || '',
      room: assignment?.room || prev.room
    }));
  };

  const getCourseInfo = (courseId) => {
    return courses?.find(c => c.id === courseId) || {};
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      date: format(formData.date, 'yyyy-MM-dd')
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            {lecture ? 'Edit Lecture' : 'Schedule New Lecture'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Course Assignment</Label>
            <Select
              value={formData.course_assignment_id}
              onValueChange={handleCourseAssignmentChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select course assignment" />
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
            <Label>Lecture Topic</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter lecture topic"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Lecture description (optional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {formData.date ? format(formData.date, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => {
                      setFormData(prev => ({ ...prev, date }));
                      setDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Room</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={formData.room}
                  onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                  placeholder="Room number"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lecture Number</Label>
              <Input
                type="number"
                min="1"
                value={formData.lecture_number}
                onChange={(e) => setFormData(prev => ({ ...prev, lecture_number: parseInt(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {lecture ? 'Update Lecture' : 'Schedule Lecture'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}