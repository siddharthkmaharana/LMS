import React from 'react';
import StatCard from '@/components/ui/StatCard';
import { Users, BookOpen, Calendar, ClipboardCheck, GraduationCap, Building2 } from 'lucide-react';

export default function QuickStats({ stats, isLoading }) {
  const defaultStats = {
    totalStudents: 0,
    totalFaculty: 0,
    activeCourses: 0,
    todayLectures: 0,
    pendingAssignments: 0,
    departments: 0,
    ...stats
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard
        title="Students"
        value={isLoading ? '—' : defaultStats.totalStudents}
        icon={GraduationCap}
        color="blue"
        delay={0}
      />
      <StatCard
        title="Faculty"
        value={isLoading ? '—' : defaultStats.totalFaculty}
        icon={Users}
        color="purple"
        delay={0.05}
      />
      <StatCard
        title="Active Courses"
        value={isLoading ? '—' : defaultStats.activeCourses}
        icon={BookOpen}
        color="green"
        delay={0.1}
      />
      <StatCard
        title="Today's Lectures"
        value={isLoading ? '—' : defaultStats.todayLectures}
        icon={Calendar}
        color="orange"
        delay={0.15}
      />
      <StatCard
        title="Pending Tasks"
        value={isLoading ? '—' : defaultStats.pendingAssignments}
        icon={ClipboardCheck}
        color="pink"
        delay={0.2}
      />
      <StatCard
        title="Departments"
        value={isLoading ? '—' : defaultStats.departments}
        icon={Building2}
        color="cyan"
        delay={0.25}
      />
    </div>
  );
}