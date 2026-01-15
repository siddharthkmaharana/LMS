import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addMonths, 
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO
} from 'date-fns';

export default function LectureCalendar({ 
  lectures, 
  courses, 
  onDateSelect, 
  onLectureClick, 
  onAddLecture,
  view = 'month'
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getCourseInfo = (courseId) => {
    return courses?.find(c => c.id === courseId) || {};
  };

  const courseColors = useMemo(() => {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
      'bg-pink-500', 'bg-cyan-500', 'bg-amber-500', 'bg-indigo-500'
    ];
    const colorMap = {};
    courses?.forEach((course, idx) => {
      colorMap[course.id] = colors[idx % colors.length];
    });
    return colorMap;
  }, [courses]);

  const getLecturesForDate = (date) => {
    return lectures?.filter(lecture => 
      isSameDay(parseISO(lecture.date), date)
    ) || [];
  };

  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      const currentDay = day;
      const dayLectures = getLecturesForDate(currentDay);
      const isCurrentMonth = isSameMonth(currentDay, currentDate);
      const isSelected = isSameDay(currentDay, selectedDate);
      const isCurrentDay = isToday(currentDay);

      days.push(
        <motion.div
          key={currentDay.toISOString()}
          whileHover={{ scale: 1.02 }}
          onClick={() => {
            setSelectedDate(currentDay);
            onDateSelect?.(currentDay);
          }}
          className={`
            min-h-[100px] p-2 border border-gray-100 cursor-pointer transition-all rounded-lg
            ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : 'bg-white hover:bg-gray-50'}
            ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
            ${isCurrentDay ? 'bg-blue-50' : ''}
          `}
        >
          <div className={`
            text-sm font-medium mb-1
            ${isCurrentDay ? 'text-blue-600' : ''}
            ${isSelected && !isCurrentDay ? 'text-blue-600' : ''}
          `}>
            {format(currentDay, 'd')}
          </div>
          
          <div className="space-y-1">
            {dayLectures.slice(0, 3).map(lecture => {
              const course = getCourseInfo(lecture.course_id);
              return (
                <div
                  key={lecture.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onLectureClick?.(lecture);
                  }}
                  className={`
                    px-2 py-1 rounded text-xs text-white truncate
                    ${courseColors[lecture.course_id] || 'bg-gray-500'}
                    hover:opacity-80 transition-opacity
                  `}
                >
                  {lecture.start_time} {course.code}
                </div>
              );
            })}
            {dayLectures.length > 3 && (
              <div className="text-xs text-gray-500 pl-2">
                +{dayLectures.length - 3} more
              </div>
            )}
          </div>
        </motion.div>
      );
      day = addDays(day, 1);
    }

    return days;
  };

  const selectedDateLectures = getLecturesForDate(selectedDate);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentDate(new Date());
              setSelectedDate(new Date());
            }}
          >
            Today
          </Button>
          {onAddLecture && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => onAddLecture(selectedDate)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Lecture
            </Button>
          )}
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 p-px">
        {renderCalendarDays()}
      </div>

      {/* Selected Date Lectures */}
      {selectedDateLectures.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Lectures on {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          <div className="space-y-2">
            {selectedDateLectures.map(lecture => {
              const course = getCourseInfo(lecture.course_id);
              return (
                <motion.div
                  key={lecture.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onLectureClick?.(lecture)}
                  className="p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{lecture.title}</h4>
                      <p className="text-sm text-blue-600">{course.code} - {course.name}</p>
                    </div>
                    <Badge className={`${courseColors[lecture.course_id]} text-white`}>
                      {lecture.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {lecture.start_time} - {lecture.end_time}
                    </span>
                    {lecture.room && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {lecture.room}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}