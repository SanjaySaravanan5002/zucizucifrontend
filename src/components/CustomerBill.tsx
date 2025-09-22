import React, { useState, useEffect } from 'react';
import { Download, FileText, Calendar, User, Phone, MapPin, Car } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface BillItem {
  description: string;
  date: string;
  amount: number;
  isPaid: boolean;
}

interface BillData {
  customerId: number;
  customerName: string;
  phone: string;
  area: string;
  carModel: string;
  leadType: string;
  billDate: string;
  items: BillItem[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  subscriptionDetails?: {
    packageType: string;
    customPlanName?: string;
    totalWashes: number;
    completedWashes: number;
    monthlyPrice: number;
    startDate: string;
    endDate: string;
  };
}

interface CustomerBillProps {
  customerId: number;
  onClose: () => void;
}

const CustomerBill: React.FC<CustomerBillProps> = ({ customerId, onClose }) => {
  const [billData, setBillData] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillData();
  }, [customerId]);

  const fetchBillData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `https://zuci-sbackend-12.onrender.com/api/leads/${customerId}/bill`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setBillData(response.data);
    } catch (error) {
      console.error('Error fetching bill data:', error);
      toast.error('Failed to fetch bill data');
    } finally {
      setLoading(false);
    }
  };

  const downloadBill = () => {
    if (!billData) return;

    const htmlContent = generatePDFContent(billData);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };



  const generatePDFContent = (data: BillData): string => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Customer Bill - ${data.customerName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .customer-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .section h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
        .paid { color: green; font-weight: bold; }
        .pending { color: red; font-weight: bold; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ZUCI CAR WASH SERVICE</h1>
        <h2>Customer Bill</h2>
        <p>Bill Date: ${new Date(data.billDate).toLocaleDateString()}</p>
      </div>
      
      <div class="customer-info">
        <div>
          <p><strong>Customer ID:</strong> CUS${String(data.customerId).padStart(4, '0')}</p>
          <p><strong>Name:</strong> ${data.customerName}</p>
          <p><strong>Phone:</strong> ${data.phone}</p>
        </div>
        <div>
          <p><strong>Area:</strong> ${data.area}</p>
          <p><strong>Car Model:</strong> ${data.carModel}</p>
          <p><strong>Customer Type:</strong> ${data.leadType}</p>
        </div>
      </div>
      
      ${data.subscriptionDetails ? `
      <div class="section">
        <h3>Subscription Details</h3>
        <p><strong>Package:</strong> ${data.subscriptionDetails.packageType}</p>
        <p><strong>Total Washes:</strong> ${data.subscriptionDetails.totalWashes}</p>
        <p><strong>Completed Washes:</strong> ${data.subscriptionDetails.completedWashes}</p>
        <p><strong>Monthly Price:</strong> ₹${data.subscriptionDetails.monthlyPrice}</p>
      </div>
      ` : ''}
      
      <div class="section">
        <h3>Service History</h3>
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td>${new Date(item.date).toLocaleDateString()}</td>
              <td>₹${item.amount}</td>
              <td class="${item.isPaid ? 'paid' : 'pending'}">${item.isPaid ? 'PAID' : 'PENDING'}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="summary">
        <h3>Payment Summary</h3>
        <p><strong>Total Amount:</strong> ₹${data.totalAmount}</p>
        <p><strong>Paid Amount:</strong> <span class="paid">₹${data.paidAmount}</span></p>
        <p><strong>Pending Amount:</strong> <span class="pending">₹${data.pendingAmount}</span></p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px;">
        <p>Thank you for choosing Zuci Car Wash Service!</p>
      </div>
    </body>
    </html>
    `;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-center">Loading bill...</p>
        </div>
      </div>
    );
  }

  if (!billData) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-medium text-red-600 mb-4">Error</h3>
          <p className="text-gray-600 mb-4">Failed to load bill data</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <h2 className="text-xl font-bold">Customer Bill</h2>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={downloadBill}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Bill Content */}
        <div className="p-6">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Customer ID:</span>
                <span>CUS{String(billData.customerId).padStart(4, '0')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Name:</span>
                <span>{billData.customerName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Phone:</span>
                <span>{billData.phone}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Area:</span>
                <span>{billData.area}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Car className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Car Model:</span>
                <span>{billData.carModel}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Bill Date:</span>
                <span>{new Date(billData.billDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          {billData.subscriptionDetails && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-medium text-blue-800 mb-3">Subscription Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="font-medium">Package:</span>
                  <span className="ml-2">{billData.subscriptionDetails.packageType}</span>
                </div>
                <div>
                  <span className="font-medium">Total Washes:</span>
                  <span className="ml-2">{billData.subscriptionDetails.totalWashes}</span>
                </div>
                <div>
                  <span className="font-medium">Completed:</span>
                  <span className="ml-2">{billData.subscriptionDetails.completedWashes}</span>
                </div>
              </div>
            </div>
          )}

          {/* Service Items */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Service History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{item.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.isPaid 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.isPaid ? 'PAID' : 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">₹{billData.totalAmount}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-green-600">Paid Amount</p>
                <p className="text-2xl font-bold text-green-700">₹{billData.paidAmount}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-red-600">Pending Amount</p>
                <p className="text-2xl font-bold text-red-700">₹{billData.pendingAmount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerBill;
