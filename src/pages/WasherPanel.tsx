import React, { useState } from 'react';
import { Calendar, CheckCircle, Clock, MessageSquare, User } from 'lucide-react';

interface Wash {
  id: number;
  customerName: string;
  carModel: string;
  area: string;
  time: string;
  status: 'pending' | 'completed';
  remarks?: string;
}

const WasherPanel = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState(false);
  
  // Mock data for assigned washes
  const [washes, setWashes] = useState<Wash[]>([
    {
      id: 1,
      customerName: 'Arun Kumar',
      carModel: 'Honda City',
      area: 'Kormangala',
      time: '09:00 AM',
      status: 'pending'
    },
    {
      id: 2,
      customerName: 'Priya Sharma',
      carModel: 'Hyundai Creta',
      area: 'Indiranagar',
      time: '10:30 AM',
      status: 'completed',
      remarks: 'Customer very satisfied'
    },
    {
      id: 3,
      customerName: 'Vikram Singh',
      carModel: 'Maruti Swift',
      area: 'HSR Layout',
      time: '02:00 PM',
      status: 'pending'
    }
  ]);

  const markAttendance = () => {
    setAttendance(true);
  };

  const markWashComplete = (washId: number, remarks: string = '') => {
    setWashes(washes.map(wash => 
      wash.id === washId 
        ? { ...wash, status: 'completed', remarks } 
        : wash
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header with Date and Attendance */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={markAttendance}
              disabled={attendance}
              className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                attendance 
                  ? 'bg-green-100 text-green-800 border-green-200 cursor-not-allowed'
                  : 'text-white bg-primary hover:bg-primary-dark border-transparent'
              }`}
            >
              <User className="h-4 w-4 mr-2" />
              {attendance ? 'Attendance Marked' : 'Mark Attendance'}
            </button>
          </div>
        </div>
      </div>

      {/* Assigned Washes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Assigned Washes</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your wash assignments for today
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {washes.map((wash) => (
            <li key={wash.id} className="p-4">
              <div className="sm:flex sm:items-center sm:justify-between">
                <div className="sm:flex sm:items-start">
                  <div className="mb-4 sm:mb-0 sm:mr-6">
                    <p className="text-sm font-medium text-gray-900">{wash.customerName}</p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {wash.time}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{wash.carModel}</p>
                    <p className="mt-2 text-sm text-gray-500">{wash.area}</p>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0">
                  {wash.status === 'pending' ? (
                    <button
                      onClick={() => {
                        const remarks = prompt('Add any remarks (optional):');
                        markWashComplete(wash.id, remarks || undefined);
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Complete
                    </button>
                  ) : (
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                      {wash.remarks && (
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {wash.remarks}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900">Daily Summary</h3>
          <dl className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Assigned</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{washes.length}</dd>
            </div>
            <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {washes.filter(w => w.status === 'completed').length}
              </dd>
            </div>
            <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {washes.filter(w => w.status === 'pending').length}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default WasherPanel;