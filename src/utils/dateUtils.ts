// Utility functions for date-based operations

export const isToday = (date: Date | string): boolean => {
  const targetDate = new Date(date);
  const today = new Date();
  return targetDate.toDateString() === today.toDateString();
};

export const isTomorrow = (date: Date | string): boolean => {
  const targetDate = new Date(date);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return targetDate.toDateString() === tomorrow.toDateString();
};

export const isTodayOrTomorrow = (date: Date | string): boolean => {
  return isToday(date) || isTomorrow(date);
};

export const formatDateForDisplay = (date: Date | string): string => {
  const targetDate = new Date(date);
  return targetDate.toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const getDateLabel = (date: Date | string): string => {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return formatDateForDisplay(date);
};

export const shouldAutoAssign = (washDate: Date | string): boolean => {
  return isTodayOrTomorrow(washDate);
};

