import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Settings as SettingsIcon, User, Bell, Shield, Building2, 
  Calendar, Loader2, Save, Plus, Trash2, GraduationCap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSemesterFormOpen, setIsSemesterFormOpen] = useState(false);
  const [isProgramFormOpen, setIsProgramFormOpen] = useState(false);

  const [semesterForm, setSemesterForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    academic_year: '',
    is_current: false,
    status: 'upcoming'
  });

  const [programForm, setProgramForm] = useState({
    name: '',
    code: '',
    department_id: '',
    duration_years: 4,
    total_credits: 160,
    degree_type: 'undergraduate',
    status: 'active'
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: semesters, isLoading: loadingSemesters } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => base44.entities.Semester.list('-start_date'),
  });

  const { data: programs, isLoading: loadingPrograms } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.Program.list(),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => base44.entities.Department.list(),
  });

  const createSemesterMutation = useMutation({
    mutationFn: (data) => base44.entities.Semester.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] });
      setIsSemesterFormOpen(false);
      setSemesterForm({
        name: '',
        start_date: '',
        end_date: '',
        academic_year: '',
        is_current: false,
        status: 'upcoming'
      });
    },
  });

  const deleteSemesterMutation = useMutation({
    mutationFn: (id) => base44.entities.Semester.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] });
    },
  });

  const createProgramMutation = useMutation({
    mutationFn: (data) => base44.entities.Program.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setIsProgramFormOpen(false);
      setProgramForm({
        name: '',
        code: '',
        department_id: '',
        duration_years: 4,
        total_credits: 160,
        degree_type: 'undergraduate',
        status: 'active'
      });
    },
  });

  const deleteProgramMutation = useMutation({
    mutationFn: (id) => base44.entities.Program.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });

  const getDepartmentName = (deptId) => {
    return departments?.find(d => d.id === deptId)?.name || '—';
  };

  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-700',
    inactive: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your account and system preferences"
        icon={SettingsIcon}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="semesters">Semesters</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm border-gray-100">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Avatar className="h-24 w-24 mx-auto">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                      {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    {user?.full_name || 'User'}
                  </h3>
                  <p className="text-gray-500">{user?.email}</p>
                  <p className="text-sm text-blue-600 mt-1 capitalize">{user?.role}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-sm border-gray-100">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={user?.full_name || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user?.email || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input value={user?.role || ''} disabled className="capitalize" />
                  </div>
                  <div className="space-y-2">
                    <Label>Member Since</Label>
                    <Input 
                      value={user?.created_date ? format(new Date(user.created_date), 'MMM d, yyyy') : ''} 
                      disabled 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Semesters Tab */}
        <TabsContent value="semesters" className="mt-6">
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Academic Semesters</CardTitle>
                <CardDescription>Manage semester periods and academic years</CardDescription>
              </div>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsSemesterFormOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Semester
              </Button>
            </CardHeader>
            <CardContent>
              {loadingSemesters ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
                </div>
              ) : semesters?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>No semesters configured</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {semesters?.map(semester => (
                    <motion.div
                      key={semester.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {semester.name}
                            {semester.is_current && (
                              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                Current
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(semester.start_date), 'MMM d, yyyy')} - {format(new Date(semester.end_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${statusColors[semester.status]}`}>
                          {semester.status}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => deleteSemesterMutation.mutate(semester.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Programs Tab */}
        <TabsContent value="programs" className="mt-6">
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Academic Programs</CardTitle>
                <CardDescription>Manage degree programs and curricula</CardDescription>
              </div>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsProgramFormOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Program
              </Button>
            </CardHeader>
            <CardContent>
              {loadingPrograms ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
                </div>
              ) : programs?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <GraduationCap className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>No programs configured</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {programs?.map(program => (
                    <motion.div
                      key={program.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{program.name}</p>
                          <p className="text-sm text-blue-600">{program.code}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 h-8 w-8"
                          onClick={() => deleteProgramMutation.mutate(program.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Department</p>
                          <p className="font-medium">{getDepartmentName(program.department_id)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Duration</p>
                          <p className="font-medium">{program.duration_years} years</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Credits</p>
                          <p className="font-medium">{program.total_credits}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Type</p>
                          <p className="font-medium capitalize">{program.degree_type}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: 'Lecture Reminders', description: 'Get notified about upcoming lectures' },
                { title: 'Assignment Deadlines', description: 'Reminders for assignment due dates' },
                { title: 'Attendance Alerts', description: 'Alerts for low attendance' },
                { title: 'System Updates', description: 'Important system announcements' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Semester Form Dialog */}
      <Dialog open={isSemesterFormOpen} onOpenChange={setIsSemesterFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Semester</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createSemesterMutation.mutate(semesterForm); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Semester Name</Label>
              <Input
                value={semesterForm.name}
                onChange={(e) => setSemesterForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Fall 2024"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={semesterForm.start_date}
                  onChange={(e) => setSemesterForm(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={semesterForm.end_date}
                  onChange={(e) => setSemesterForm(prev => ({ ...prev, end_date: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Input
                value={semesterForm.academic_year}
                onChange={(e) => setSemesterForm(prev => ({ ...prev, academic_year: e.target.value }))}
                placeholder="e.g., 2024-2025"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={semesterForm.status}
                onValueChange={(value) => setSemesterForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={semesterForm.is_current}
                onCheckedChange={(checked) => setSemesterForm(prev => ({ ...prev, is_current: checked }))}
              />
              <Label>Set as current semester</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSemesterFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createSemesterMutation.isPending}>
                {createSemesterMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Semester
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Program Form Dialog */}
      <Dialog open={isProgramFormOpen} onOpenChange={setIsProgramFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Program</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createProgramMutation.mutate(programForm); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Program Name</Label>
              <Input
                value={programForm.name}
                onChange={(e) => setProgramForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Bachelor of Computer Science"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Program Code</Label>
                <Input
                  value={programForm.code}
                  onChange={(e) => setProgramForm(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g., BCS"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={programForm.department_id}
                  onValueChange={(value) => setProgramForm(prev => ({ ...prev, department_id: value }))}
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (Years)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={programForm.duration_years}
                  onChange={(e) => setProgramForm(prev => ({ ...prev, duration_years: parseInt(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Credits</Label>
                <Input
                  type="number"
                  min="1"
                  value={programForm.total_credits}
                  onChange={(e) => setProgramForm(prev => ({ ...prev, total_credits: parseInt(e.target.value) }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Degree Type</Label>
              <Select
                value={programForm.degree_type}
                onValueChange={(value) => setProgramForm(prev => ({ ...prev, degree_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undergraduate">Undergraduate</SelectItem>
                  <SelectItem value="postgraduate">Postgraduate</SelectItem>
                  <SelectItem value="doctorate">Doctorate</SelectItem>
                  <SelectItem value="diploma">Diploma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProgramFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createProgramMutation.isPending}>
                {createProgramMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Program
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}