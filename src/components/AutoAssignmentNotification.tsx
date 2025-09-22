import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, User } from 'lucide-react';

interface AutoAssignmentNotificationProps {
  show: boolean;
  washerName: string;
  customerName: string;
  assignmentDate: string;
  onClose: () => void;
}

const AutoAssignmentNotification: React.FC<AutoAssignmentNotificationProps> = ({
  show,
  washerName,
  customerName,
  assignmentDate,
  onClose
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto-close after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const isToday = new Date(assignmentDate).toDateString() === new Date().toDateString();
  const isTomorrow = new Date(assignmentDate).toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-green-800">
              Lead Auto-Assigned!
            </p>
            <p className="mt-1 text-sm text-green-700">
              <span className="font-medium">{customerName}</span> has been assigned to{' '}
              <span className="font-medium">{washerName}</span>
            </p>
            <div className="mt-2 flex items-center text-xs text-green-600">
              {isToday && (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Today's wash</span>
                </>
              )}
              {isTomorrow && (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Tomorrow's wash</span>
                </>
              )}
              <User className="h-3 w-3 ml-3 mr-1" />
              <span>Available in Assigned Leads</span>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onClose}
              className="bg-green-50 rounded-md inline-flex text-green-400 hover:text-green-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoAssignmentNotification;

