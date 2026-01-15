import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Plus, Loader2, Pencil, Trash2, Building2, GraduationCap, Clock, Award } from 'lucide-react';

export default function Courses() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    department_id: '',
    program_id: '',
    semester_number: 1,
    credits: 3,
    course_type: 'core',
    syllabus: '',
    learning_objectives: [],
    total_lectures: 40,
    status: 'active'
  });
  const [newObjective, setNewObjective] = useState('');

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list('-created_date'),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
  });

  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.Program.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Course.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsFormOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Course.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsFormOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Course.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      department_id: '',
      program_id: '',
      semester_number: 1,
      credits: 3,
      course_type: 'core',
      syllabus: '',
      learning_objectives: [],
      total_lectures: 40,
      status: 'active'
    });
    setEditingCourse(null);
    setNewObjective('');
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      ...course,
      learning_objectives: course.learning_objectives || []
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      setFormData(prev => ({
        ...prev,
        learning_objectives: [...(prev.learning_objectives || []), newObjective.trim()]
      }));
      setNewObjective('');
    }
  };

  const removeObjective = (index) => {
    setFormData(prev => ({
      ...prev,
      learning_objectives: prev.learning_objectives.filter((_, i) => i !== index)
    }));
  };

  const getDepartmentName = (departmentId) => {
    const dept = departments?.find(d => d.id === departmentId);
    return dept?.name || '—';
  };

  const getProgramName = (programId) => {
    const prog = programs?.find(p => p.id === programId);
    return prog?.name || '—';
  };

  let filteredCourses = courses?.filter(c => 
    c.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (activeTab !== 'all') {
    filteredCourses = filteredCourses?.filter(c => c.course_type === activeTab);
  }

  const typeColors = {
    core: 'bg-blue-100 text-blue-700',
    elective: 'bg-purple-100 text-purple-700',
    lab: 'bg-green-100 text-green-700',
    project: 'bg-orange-100 text-orange-700'
  };

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    archived: 'bg-gray-100 text-gray-700'
  };

  const columns = [
    {
      header: 'Course',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{row.code}</p>
            <p className="text-sm text-gray-600">{row.name}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Department',
      render: (row) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Building2 className="w-4 h-4" />
          <span>{getDepartmentName(row.department_id)}</span>
        </div>
      )
    },
    {
      header: 'Semester',
      render: (row) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-gray-400" />
          <span>Semester {row.semester_number}</span>
        </div>
      )
    },
    {
      header: 'Credits',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span className="font-medium">{row.credits}</span>
        </div>
      )
    },
    {
      header: 'Type',
      render: (row) => (
        <Badge className={typeColors[row.course_type]}>
          {row.course_type}
        </Badge>
      )
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
        title="Course Management"
        subtitle="Manage courses, curriculum, and syllabus"
        icon={BookOpen}
        actions={
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="all">All Courses</TabsTrigger>
          <TabsTrigger value="core">Core</TabsTrigger>
          <TabsTrigger value="elective">Elective</TabsTrigger>
          <TabsTrigger value="lab">Lab</TabsTrigger>
          <TabsTrigger value="project">Project</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={filteredCourses}
        isLoading={isLoading}
        searchPlaceholder="Search courses..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        emptyMessage="No courses found"
      />

      {/* Course Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={() => {
        setIsFormOpen(false);
        resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              {editingCourse ? 'Edit Course' : 'Add New Course'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Course Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="CS101"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Course Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Introduction to Computer Science"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={formData.department_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Program</Label>
                <Select
                  value={formData.program_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, program_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs?.map(prog => (
                      <SelectItem key={prog.id} value={prog.id}>{prog.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select
                  value={String(formData.semester_number)}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, semester_number: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <SelectItem key={sem} value={String(sem)}>Semester {sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Credits</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.credits}
                  onChange={(e) => setFormData(prev => ({ ...prev, credits: parseInt(e.target.value) }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Course Type</Label>
                <Select
                  value={formData.course_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, course_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core">Core</SelectItem>
                    <SelectItem value="elective">Elective</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Total Lectures</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.total_lectures}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_lectures: parseInt(e.target.value) }))}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Course description"
                  rows={2}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Syllabus</Label>
                <Textarea
                  value={formData.syllabus}
                  onChange={(e) => setFormData(prev => ({ ...prev, syllabus: e.target.value }))}
                  placeholder="Course syllabus"
                  rows={4}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Learning Objectives</Label>
                <div className="flex gap-2">
                  <Input
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    placeholder="Add a learning objective"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                  />
                  <Button type="button" variant="outline" onClick={addObjective}>Add</Button>
                </div>
                {formData.learning_objectives?.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {formData.learning_objectives.map((obj, idx) => (
                      <li key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{obj}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeObjective(idx)}
                          className="text-red-500 h-6"
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingCourse ? 'Update' : 'Add'} Course
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}