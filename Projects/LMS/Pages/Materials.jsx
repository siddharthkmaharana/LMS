import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  FolderOpen, Plus, FileText, FileVideo, FileImage, 
  Link as LinkIcon, Upload, Download, Eye, Pencil, Trash2, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function Materials() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    material_type: 'document',
    file_url: '',
    external_link: '',
    unit_number: 1,
    version: 1,
    is_visible: true
  });

  const { data: materials, isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: () => base44.entities.CourseMaterial.list('-created_date'),
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CourseMaterial.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsFormOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CourseMaterial.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsFormOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CourseMaterial.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });

  const resetForm = () => {
    setFormData({
      course_id: '',
      title: '',
      description: '',
      material_type: 'document',
      file_url: '',
      external_link: '',
      unit_number: 1,
      version: 1,
      is_visible: true
    });
    setEditingMaterial(null);
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData(material);
    setIsFormOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, file_url }));
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingMaterial) {
      updateMutation.mutate({ id: editingMaterial.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getCourseInfo = (courseId) => {
    return courses?.find(c => c.id === courseId) || {};
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
      case 'ppt': return <FileText className="w-5 h-5 text-orange-500" />;
      case 'video': return <FileVideo className="w-5 h-5 text-purple-500" />;
      case 'link': return <LinkIcon className="w-5 h-5 text-blue-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  let filteredMaterials = materials?.filter(m =>
    m.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedCourse !== 'all') {
    filteredMaterials = filteredMaterials?.filter(m => m.course_id === selectedCourse);
  }

  const typeColors = {
    pdf: 'bg-red-100 text-red-700',
    ppt: 'bg-orange-100 text-orange-700',
    video: 'bg-purple-100 text-purple-700',
    link: 'bg-blue-100 text-blue-700',
    document: 'bg-gray-100 text-gray-700',
    other: 'bg-gray-100 text-gray-700'
  };

  const columns = [
    {
      header: 'Material',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-50 rounded-lg">
            {getTypeIcon(row.material_type)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.title}</p>
            {row.description && (
              <p className="text-sm text-gray-500 line-clamp-1">{row.description}</p>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Course',
      render: (row) => {
        const course = getCourseInfo(row.course_id);
        return (
          <span className="text-gray-700">{course.code} - {course.name}</span>
        );
      }
    },
    {
      header: 'Type',
      render: (row) => (
        <Badge className={typeColors[row.material_type]}>
          {row.material_type}
        </Badge>
      )
    },
    {
      header: 'Unit',
      render: (row) => (
        <span className="text-gray-600">Unit {row.unit_number}</span>
      )
    },
    {
      header: 'Version',
      render: (row) => (
        <Badge variant="outline">v{row.version}</Badge>
      )
    },
    {
      header: 'Visibility',
      render: (row) => (
        <Badge className={row.is_visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
          {row.is_visible ? 'Visible' : 'Hidden'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {(row.file_url || row.external_link) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(row.file_url || row.external_link, '_blank')}
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
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
        title="Course Materials"
        subtitle="Upload and manage course resources"
        icon={FolderOpen}
        actions={
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Material
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={filteredMaterials}
        isLoading={isLoading}
        searchPlaceholder="Search materials..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        emptyMessage="No materials found"
        filters={
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses?.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Material Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={() => {
        setIsFormOpen(false);
        resetForm();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-600" />
              {editingMaterial ? 'Edit Material' : 'Upload New Material'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select
                value={formData.course_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Material title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.material_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, material_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="ppt">PowerPoint</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="link">External Link</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Unit Number</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.unit_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit_number: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            {formData.material_type === 'link' ? (
              <div className="space-y-2">
                <Label>External Link</Label>
                <Input
                  type="url"
                  value={formData.external_link}
                  onChange={(e) => setFormData(prev => ({ ...prev, external_link: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Upload File</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer block text-center">
                    {uploading ? (
                      <Loader2 className="w-8 h-8 mx-auto text-gray-400 animate-spin" />
                    ) : formData.file_url ? (
                      <div className="text-green-600">
                        <FileText className="w-8 h-8 mx-auto" />
                        <p className="text-sm mt-2">File uploaded</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 mx-auto text-gray-400" />
                        <p className="text-sm text-gray-500 mt-2">Click to upload</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label>Visible to Students</Label>
                <p className="text-sm text-gray-500">Students can see this material</p>
              </div>
              <Switch
                checked={formData.is_visible}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible: checked }))}
              />
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
                disabled={createMutation.isPending || updateMutation.isPending || uploading}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingMaterial ? 'Update' : 'Upload'} Material
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}