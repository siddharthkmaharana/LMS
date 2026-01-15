import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, UserPlus, BookOpen, ClipboardCheck, Calendar, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";

export default function RecentActivity({ activities, isLoading }) {
  const getIcon = (action, entityType) => {
    if (entityType === 'student' || entityType === 'faculty') return UserPlus;
    if (entityType === 'course') return BookOpen;
    if (entityType === 'attendance') return ClipboardCheck;
    if (entityType === 'lecture') return Calendar;
    if (entityType === 'assignment') return FileText;
    return Activity;
  };

  const getActionColor = (action) => {
    switch(action) {
      case 'create': return 'bg-green-100 text-green-600';
      case 'update': return 'bg-blue-100 text-blue-600';
      case 'delete': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities?.slice(0, 8).map((activity, idx) => {
              const Icon = getIcon(activity.action, activity.entity_type);
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-start gap-3"
                >
                  <div className={`p-2 rounded-full ${getActionColor(activity.action)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 line-clamp-2">
                      {activity.details || `${activity.action} ${activity.entity_type}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.user_email} • {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}