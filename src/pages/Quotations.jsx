import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Edit, Trash2, Search, FileText, CheckCircle, Clock, Send } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { generateQuotationPDF } from '../utils/generatePDF';

const Quotations = () => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchQuotations();
    }, []);

    const fetchQuotations = async () => {
        try {
            const res = await api.get('/quotations');
            setQuotations(res.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load quotations');
            setLoading(false);
        }
    };

    const downloadPDF = async (id) => {
        try {
            const res = await api.get(`/quotations/${id}`);
            const quotation = res.data;
            await generateQuotationPDF(quotation);
            toast.success('PDF generated');
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate PDF');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this quotation?')) {
            try {
                await api.delete(`/quotations/${id}`);
                toast.success('Quotation deleted');
                fetchQuotations();
            } catch (error) {
                toast.error('Failed to delete quotation');
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-800';
            case 'sent': return 'bg-blue-100 text-blue-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredQuotations = quotations.filter(q =>
        q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800">Quotations</h1>
                <Link
                    to="/quotations/new"
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition space-x-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Quotation</span>
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        type="text"
                        placeholder="Search quotations..."
                        className="bg-transparent border-none outline-none text-gray-600 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-4">Loading quotations...</td></tr>
                            ) : filteredQuotations.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-4 text-gray-500">No quotations found</td></tr>
                            ) : (
                                filteredQuotations.map((q) => (
                                    <tr key={q.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {new Date(q.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-primary-600">
                                            {q.quotation_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                                            {q.client_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">
                                            ₹{q.total_amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(q.status)} uppercase`}>
                                                {q.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                            <button
                                                onClick={() => downloadPDF(q.id)}
                                                className="text-gray-500 hover:text-green-600 inline-block p-1"
                                                title="Download PDF"
                                            >
                                                <FileText className="w-5 h-5" />
                                            </button>

                                            {q.status === 'draft' && (
                                                <Link to={`/quotations/edit/${q.id}`} className="text-blue-500 hover:text-blue-700 inline-block p-1" title="Edit">
                                                    <Edit className="w-5 h-5" />
                                                </Link>
                                            )}

                                            <button
                                                onClick={() => handleDelete(q.id)}
                                                className="text-red-500 hover:text-red-700 inline-block p-1"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Quotations;
