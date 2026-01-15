import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import AssignmentForm from '@/components/forms/AssignmentForm';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, Plus, Clock, Calendar, Award, 
  Users, Download, Eye, Pencil, Trash2,
  CheckCircle, AlertTriangle, FileUp
} from 'lucide-react';
import { format, parseISO, isPast, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';

export default function Assignments() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.Assignment.list('-created_date'),
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list(),
  });

  const { data: courseAssignments } = useQuery({
    queryKey: ['courseAssignments'],
    queryFn: () => base44.entities.CourseAssignment.filter({ status: 'active' }),
  });

  const { data: submissions } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => base44.entities.Submission.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Assignment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setIsFormOpen(false);
      setEditingAssignment(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Assignment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setIsFormOpen(false);
      setEditingAssignment(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Assignment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setIsDetailOpen(false);
    },
  });

  const getCourseInfo = (courseId) => {
    return courses?.find(c => c.id === courseId) || {};
  };

  const getSubmissionStats = (assignmentId) => {
    const assignmentSubmissions = submissions?.filter(s => s.assignment_id === assignmentId) || [];
    const total = assignmentSubmissions.length;
    const graded = assignmentSubmissions.filter(s => s.status === 'graded').length;
    const late = assignmentSubmissions.filter(s => s.is_late).length;
    
    return { total, graded, late };
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setIsFormOpen(true);
  };

  const handleViewDetails = (assignment) => {
    setSelectedAssignment(assignment);
    setIsDetailOpen(true);
  };

  const handleFormSubmit = (data) => {
    if (editingAssignment) {
      updateMutation.mutate({ id: editingAssignment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  let filteredAssignments = assignments?.filter(a =>
    a.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (activeTab !== 'all') {
    filteredAssignments = filteredAssignments?.filter(a => a.status === activeTab);
  }

  const typeColors = {
    homework: 'bg-blue-100 text-blue-700',
    quiz: 'bg-purple-100 text-purple-700',
    project: 'bg-green-100 text-green-700',
    lab_report: 'bg-orange-100 text-orange-700',
    presentation: 'bg-pink-100 text-pink-700',
    exam: 'bg-red-100 text-red-700'
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    published: 'bg-green-100 text-green-700',
    closed: 'bg-red-100 text-red-700'
  };

  const columns = [
    {
      header: 'Assignment',
      render: (row) => {
        const course = getCourseInfo(row.course_id);
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{row.title}</p>
              <p className="text-sm text-blue-600">{course.code} - {course.name}</p>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Type',
      render: (row) => (
        <Badge className={typeColors[row.assignment_type]}>
          {row.assignment_type?.replace('_', ' ')}
        </Badge>
      )
    },
    {
      header: 'Due Date',
      render: (row) => {
        const dueDate = parseISO(row.due_date);
        const isOverdue = isPast(dueDate);
        const daysLeft = differenceInDays(dueDate, new Date());

        return (
          <div className="space-y-1">
            <p className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              {format(dueDate, 'MMM d, yyyy')}
            </p>
            {isOverdue ? (
              <Badge className="bg-red-100 text-red-700 text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Overdue
              </Badge>
            ) : daysLeft <= 3 ? (
              <Badge className="bg-amber-100 text-amber-700 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {daysLeft} days left
              </Badge>
            ) : null}
          </div>
        );
      }
    },
    {
      header: 'Marks',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span className="font-medium">{row.total_marks}</span>
          <span className="text-gray-400">({row.weightage}%)</span>
        </div>
      )
    },
    {
      header: 'Submissions',
      render: (row) => {
        const stats = getSubmissionStats(row.id);
        return (
          <div className="space-y-1">
            <p className="text-sm font-medium">{stats.total} submitted</p>
            <p className="text-xs text-gray-500">{stats.graded} graded • {stats.late} late</p>
          </div>
        );
      }
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge className={statusColors[row.status]}>
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleViewDetails(row)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-red-600 hover:text-red-700"
            onClick={() => deleteMutation.mutate(row.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        subtitle="Create and manage course assignments"
        icon={FileText}
        actions={
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              setEditingAssignment(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Assignment
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={filteredAssignments}
        isLoading={isLoading}
        searchPlaceholder="Search assignments..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        emptyMessage="No assignments found"
      />

      {/* Assignment Form */}
      <AssignmentForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingAssignment(null);
        }}
        onSubmit={handleFormSubmit}
        assignment={editingAssignment}
        courseAssignments={courseAssignments}
        courses={courses}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Assignment Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              Assignment Details
            </DialogTitle>
          </DialogHeader>

          {selectedAssignment && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedAssignment.title}</h3>
                <p className="text-blue-600 font-medium mt-1">
                  {getCourseInfo(selectedAssignment.course_id).code} - {getCourseInfo(selectedAssignment.course_id).name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="shadow-none border-gray-100">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <Badge className={typeColors[selectedAssignment.assignment_type]}>
                      {selectedAssignment.assignment_type?.replace('_', ' ')}
                    </Badge>
                  </CardContent>
                </Card>
                <Card className="shadow-none border-gray-100">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Due Date</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {format(parseISO(selectedAssignment.due_date), 'MMMM d, yyyy')}
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-none border-gray-100">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Total Marks</p>
                    <p className="font-medium flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      {selectedAssignment.total_marks} marks ({selectedAssignment.weightage}%)
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-none border-gray-100">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Late Submission</p>
                    <p className="font-medium">
                      {selectedAssignment.allow_late_submission 
                        ? `Allowed (${selectedAssignment.late_penalty_percent}% penalty)`
                        : 'Not allowed'
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>

              {selectedAssignment.description && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-600">{selectedAssignment.description}</p>
                </div>
              )}

              {selectedAssignment.instructions && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Instructions</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedAssignment.instructions}</p>
                </div>
              )}

              {selectedAssignment.attachments?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Attachments</h4>
                  <div className="space-y-2">
                    {selectedAssignment.attachments.map((file, idx) => (
                      <a
                        key={idx}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                      >
                        <FileUp className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-blue-600">{file.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Submission Stats */}
              <Card className="shadow-none border-gray-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Submission Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const stats = getSubmissionStats(selectedAssignment.id);
                    return (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{stats.total}</p>
                          <p className="text-xs text-green-700">Submitted</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{stats.graded}</p>
                          <p className="text-xs text-blue-700">Graded</p>
                        </div>
                        <div className="text-center p-3 bg-amber-50 rounded-lg">
                          <p className="text-2xl font-bold text-amber-600">{stats.late}</p>
                          <p className="text-xs text-amber-700">Late</p>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsDetailOpen(false);
                handleEdit(selectedAssignment);
              }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}