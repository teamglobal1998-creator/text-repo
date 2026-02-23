import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
    Users,
    FileText,
    TrendingUp,
    AlertCircle
} from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        quotations: 0,
        invoices: 0,
        clients: 0,
        pendingAmount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [qRes, iRes, cRes] = await Promise.all([
                    api.get('/quotations'),
                    api.get('/invoices'),
                    api.get('/clients')
                ]);

                const quotations = qRes.data;
                const invoices = iRes.data;
                const clients = cRes.data;

                // Calculate pending amount
                const pendingInvoices = invoices.filter(inv => inv.payment_status !== 'paid');
                const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.total_amount - (inv.paid_amount || 0)), 0);

                setStats({
                    quotations: quotations.length,
                    invoices: invoices.length,
                    clients: clients.length,
                    pendingAmount
                });

            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const StatCard = ({ title, value, icon: Icon, color, prefix = '' }) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className={`p-4 rounded-lg mr-4 ${color}`}>
                <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium capitalize">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{prefix}{value.toLocaleString()}</h3>
            </div>
        </div>
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Quotations"
                    value={stats.quotations}
                    icon={FileText}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Total Invoices"
                    value={stats.invoices}
                    icon={FileText}
                    color="bg-green-500"
                />
                <StatCard
                    title="Total Clients"
                    value={stats.clients}
                    icon={Users}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Pending Payment"
                    value={stats.pendingAmount}
                    icon={AlertCircle}
                    color="bg-amber-500"
                    prefix="₹"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* Activity Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
                        Monthly Activity
                    </h3>
                    <div className="flex flex-col items-center justify-center h-80 text-gray-400">
                        <p>Chart temporarily disabled due to library conflict.</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4 h-full pb-8">
                        <button
                            onClick={() => navigate('/quotations/new')}
                            className="p-4 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors text-left flex flex-col justify-center h-full"
                        >
                            <span className="text-lg mb-1 block">+ Quotation</span>
                            <span className="text-sm opacity-70 font-normal">Create a new estimate</span>
                        </button>
                        <button
                            onClick={() => navigate('/invoices')}
                            className="p-4 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-medium transition-colors text-left flex flex-col justify-center h-full"
                        >
                            <span className="text-lg mb-1 block">+ Invoice</span>
                            <span className="text-sm opacity-70 font-normal">Bill a client directly</span>
                        </button>
                        <button
                            onClick={() => navigate('/clients')}
                            className="p-4 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium transition-colors text-left flex flex-col justify-center h-full"
                        >
                            <span className="text-lg mb-1 block">+ Client</span>
                            <span className="text-sm opacity-70 font-normal">Add new customer</span>
                        </button>
                        <button
                            onClick={() => navigate('/items')}
                            className="p-4 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium transition-colors text-left flex flex-col justify-center h-full"
                        >
                            <span className="text-lg mb-1 block">+ Item</span>
                            <span className="text-sm opacity-70 font-normal">Add product/service</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
