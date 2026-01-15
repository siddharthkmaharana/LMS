import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarIcon, FileText, Loader2, Upload } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';

export default function AssignmentForm({
  isOpen,
  onClose,
  onSubmit,
  assignment,
  courseAssignments,
  courses,
  isLoading
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    course_assignment_id: '',
    assignment_type: 'homework',
    total_marks: 100,
    weightage: 10,
    due_date: new Date(),
    instructions: '',
    allow_late_submission: false,
    late_penalty_percent: 0,
    status: 'draft',
    attachments: []
  });

  const [dateOpen, setDateOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (assignment) {
      setFormData({
        ...assignment,
        due_date: assignment.due_date ? new Date(assignment.due_date) : new Date()
      });
    } else {
      setFormData({
        title: '',
        description: '',
        course_id: '',
        course_assignment_id: '',
        assignment_type: 'homework',
        total_marks: 100,
        weightage: 10,
        due_date: new Date(),
        instructions: '',
        allow_late_submission: false,
        late_penalty_percent: 0,
        status: 'draft',
        attachments: []
      });
    }
  }, [assignment, isOpen]);

  const handleCourseAssignmentChange = (assignmentId) => {
    const ca = courseAssignments?.find(c => c.id === assignmentId);
    setFormData(prev => ({
      ...prev,
      course_assignment_id: assignmentId,
      course_id: ca?.course_id || ''
    }));
  };

  const getCourseInfo = (courseId) => {
    return courses?.find(c => c.id === courseId) || {};
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedFiles = [];

    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploadedFiles.push({
        name: file.name,
        url: file_url
      });
    }

    setFormData(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...uploadedFiles]
    }));
    setUploading(false);
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      due_date: formData.due_date.toISOString()
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            {assignment ? 'Edit Assignment' : 'Create New Assignment'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Course Assignment</Label>
              <Select
                value={formData.course_assignment_id}
                onValueChange={handleCourseAssignmentChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
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

            <div className="space-y-2 col-span-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Assignment title"
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.assignment_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assignment_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homework">Homework</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="lab_report">Lab Report</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {formData.due_date ? format(formData.due_date, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(date) => {
                      setFormData(prev => ({ ...prev, due_date: date }));
                      setDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Total Marks</Label>
              <Input
                type="number"
                min="0"
                value={formData.total_marks}
                onChange={(e) => setFormData(prev => ({ ...prev, total_marks: parseInt(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Weightage (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.weightage}
                onChange={(e) => setFormData(prev => ({ ...prev, weightage: parseInt(e.target.value) }))}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Instructions</Label>
              <Textarea
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Detailed instructions for the assignment"
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between col-span-2 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label>Allow Late Submissions</Label>
                <p className="text-sm text-gray-500">Students can submit after the deadline</p>
              </div>
              <Switch
                checked={formData.allow_late_submission}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_late_submission: checked }))}
              />
            </div>

            {formData.allow_late_submission && (
              <div className="space-y-2 col-span-2">
                <Label>Late Penalty (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.late_penalty_percent}
                  onChange={(e) => setFormData(prev => ({ ...prev, late_penalty_percent: parseInt(e.target.value) }))}
                />
              </div>
            )}

            <div className="space-y-2 col-span-2">
              <Label>Attachments</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 mx-auto text-gray-400 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 mx-auto text-gray-400" />
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Click to upload files
                  </p>
                </label>
              </div>

              {formData.attachments?.length > 0 && (
                <div className="space-y-2 mt-2">
                  {formData.attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(idx)}
                        className="text-red-500"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
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
              {assignment ? 'Update Assignment' : 'Create Assignment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}