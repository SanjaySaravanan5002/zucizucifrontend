import { useState, useEffect, type FC } from 'react';
import { Loader2, Phone, MapPin, Car, User } from 'lucide-react';

interface Lead {
  id: string;
  customerName: string;
  phone: string;
  area: string;
  leadType: string;
  leadSource: string;
  carModel: string;
  assignedWasher: string | null;
  date: string;
  status: string;
}

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

const RecentLeadsList: FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('https://zuci-sbackend-8.onrender.com/api/dashboard/recent-leads', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        setLeads(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching recent leads:', error);
        setError('Failed to load recent leads');
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'assigned':
        return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-100';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getLeadTypeColor = (type: string): string => {
    return type.toLowerCase() === 'monthly' 
      ? 'bg-purple-50 text-purple-700 border-purple-100'
      : 'bg-indigo-50 text-indigo-700 border-indigo-100';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-red-600 hover:text-red-500"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <th scope="col" className="px-6 py-4">Customer</th>
            <th scope="col" className="px-6 py-4">Details</th>
            <th scope="col" className="px-6 py-4">Type</th>
            <th scope="col" className="px-6 py-4">Assigned To</th>
            <th scope="col" className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-600">
                      {lead.customerName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{lead.customerName}</div>
                    <div className="text-sm text-gray-500">{new Date(lead.date).toLocaleDateString()}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <Phone className="h-4 w-4 mr-1" />
                    {lead.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    {lead.area}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Car className="h-4 w-4 mr-1" />
                    {lead.carModel}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getLeadTypeColor(lead.leadType)}`}>
                  {lead.leadType}
                </span>
                <div className="text-xs text-gray-500 mt-1">
                  via {lead.leadSource}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {lead.assignedWasher ? (
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-900">{lead.assignedWasher}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Not assigned</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                  {lead.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentLeadsList;

