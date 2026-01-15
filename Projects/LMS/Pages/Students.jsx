import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Plus, Mail, Phone, Building2, Loader2, Pencil, Trash2, UserPlus, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

export default function Students() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    roll_number: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    program_id: '',
    department_id: '',
    current_semester: 1,
    admission_year: new Date().getFullYear(),
    batch: '',
    guardian_name: '',
    guardian_phone: '',
    address: '',
    status: 'active'
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list('-created_date'),
  });

  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.Program.list(),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Student.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsFormOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Student.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsFormOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Student.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const resetForm = () => {
    setFormData({
      roll_number: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      program_id: '',
      department_id: '',
      current_semester: 1,
      admission_year: new Date().getFullYear(),
      batch: '',
      guardian_name: '',
      guardian_phone: '',
      address: '',
      status: 'active'
    });
    setEditingStudent(null);
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData(student);
    setIsFormOpen(true);
  };

  const handleProgramChange = (programId) => {
    const program = programs?.find(p => p.id === programId);
    setFormData(prev => ({
      ...prev,
      program_id: programId,
      department_id: program?.department_id || prev.department_id
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getProgramName = (programId) => {
    const prog = programs?.find(p => p.id === programId);
    return prog?.name || '—';
  };

  const getDepartmentName = (departmentId) => {
    const dept = departments?.find(d => d.id === departmentId);
    return dept?.name || '—';
  };

  const filteredStudents = students?.filter(s => 
    s.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    graduated: 'bg-blue-100 text-blue-700',
    dropped: 'bg-gray-100 text-gray-700',
    suspended: 'bg-red-100 text-red-700'
  };

  const columns = [
    {
      header: 'Student',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-purple-100 text-purple-600">
              {row.first_name?.[0]}{row.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-900">{row.first_name} {row.last_name}</p>
            <p className="text-sm text-gray-500">{row.roll_number}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Contact',
      render: (row) => (
        <div className="space-y-1">
          <p className="text-sm flex items-center gap-2 text-gray-600">
            <Mail className="w-3.5 h-3.5" /> {row.email}
          </p>
          {row.phone && (
            <p className="text-sm flex items-center gap-2 text-gray-500">
              <Phone className="w-3.5 h-3.5" /> {row.phone}
            </p>
          )}
        </div>
      )
    },
    {
      header: 'Program',
      render: (row) => (
        <div className="space-y-1">
          <p className="text-sm flex items-center gap-2 text-gray-700">
            <BookOpen className="w-3.5 h-3.5" /> {getProgramName(row.program_id)}
          </p>
          <p className="text-xs text-gray-500">Semester {row.current_semester}</p>
        </div>
      )
    },
    {
      header: 'Batch',
      render: (row) => (
        <span className="text-gray-700">{row.batch || row.admission_year}</span>
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
        title="Student Management"
        subtitle="Manage student records and enrollment"
        icon={GraduationCap}
        actions={
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={filteredStudents}
        isLoading={isLoading}
        searchPlaceholder="Search students..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        emptyMessage="No students found"
      />

      {/* Student Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={() => {
        setIsFormOpen(false);
        resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-600" />
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Roll Number</Label>
                <Input
                  value={formData.roll_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, roll_number: e.target.value }))}
                  placeholder="2024CS001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Program</Label>
                <Select
                  value={formData.program_id}
                  onValueChange={handleProgramChange}
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
                <Label>First Name</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Jane"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="jane.smith@student.edu"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="space-y-2">
                <Label>Current Semester</Label>
                <Select
                  value={String(formData.current_semester)}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, current_semester: parseInt(value) }))}
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
                <Label>Admission Year</Label>
                <Input
                  type="number"
                  value={formData.admission_year}
                  onChange={(e) => setFormData(prev => ({ ...prev, admission_year: parseInt(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Batch</Label>
                <Input
                  value={formData.batch}
                  onChange={(e) => setFormData(prev => ({ ...prev, batch: e.target.value }))}
                  placeholder="2024-2028"
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                    <SelectItem value="dropped">Dropped</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Guardian Name</Label>
                <Input
                  value={formData.guardian_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, guardian_name: e.target.value }))}
                  placeholder="Parent/Guardian name"
                />
              </div>
              <div className="space-y-2">
                <Label>Guardian Phone</Label>
                <Input
                  value={formData.guardian_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, guardian_phone: e.target.value }))}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Address</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Student address"
                  rows={2}
                />
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
                {editingStudent ? 'Update' : 'Add'} Student
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}