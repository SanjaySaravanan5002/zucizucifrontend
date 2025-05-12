import React from 'react';
import { MapPin, Phone, Calendar } from 'lucide-react';

// Mock data
const recentLeads = [
  {
    id: 1,
    name: 'Arun Kumar',
    phone: '+91 98765 43210',
    area: 'Kormangala',
    carModel: 'Honda City',
    leadType: 'Monthly',
    leadSource: 'Referral',
    assignedWasher: 'Rahul',
    date: '2023-06-10',
    status: 'New'
  },
  {
    id: 2,
    name: 'Priya Sharma',
    phone: '+91 87654 32109',
    area: 'Indiranagar',
    carModel: 'Hyundai Creta',
    leadType: 'One-time',
    leadSource: 'Walk-in',
    assignedWasher: 'Suresh',
    date: '2023-06-09',
    status: 'Contacted'
  },
  {
    id: 3,
    name: 'Vikram Singh',
    phone: '+91 76543 21098',
    area: 'HSR Layout',
    carModel: 'Maruti Swift',
    leadType: 'Monthly',
    leadSource: 'WhatsApp',
    assignedWasher: 'Vikram',
    date: '2023-06-09',
    status: 'Converted'
  },
  {
    id: 4,
    name: 'Meera Patel',
    phone: '+91 65432 10987',
    area: 'Whitefield',
    carModel: 'Toyota Fortuner',
    leadType: 'One-time',
    leadSource: 'Pamphlet',
    assignedWasher: 'Anand',
    date: '2023-06-08',
    status: 'Follow-up'
  },
  {
    id: 5,
    name: 'Rajesh Verma',
    phone: '+91 54321 09876',
    area: 'Electronic City',
    carModel: 'Kia Seltos',
    leadType: 'Monthly',
    leadSource: 'Referral',
    assignedWasher: 'Rajesh',
    date: '2023-06-08',
    status: 'New'
  },
];

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColors = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'Contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'Follow-up':
        return 'bg-purple-100 text-purple-800';
      case 'Converted':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColors(status)}`}>
      {status}
    </span>
  );
};

const TypeBadge = ({ type }: { type: string }) => {
  const isMonthly = type === 'Monthly';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isMonthly ? 'bg-teal-100 text-teal-800' : 'bg-orange-100 text-orange-800'
    }`}>
      {type}
    </span>
  );
};

const RecentLeadsList = () => {
  return (
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Source
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Car Model
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Assigned To
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {recentLeads.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <Phone className="h-3 w-3 text-gray-400 mr-1" />
                      {lead.phone}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                      {lead.area}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <TypeBadge type={lead.leadType} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {lead.leadSource}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {lead.carModel}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {lead.assignedWasher}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                  {new Date(lead.date).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={lead.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentLeadsList;