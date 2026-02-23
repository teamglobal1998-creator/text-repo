import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    ShoppingCart,
    Users,
    Settings,
    LogOut,
    PlusCircle,
    Menu,
    X
} from 'lucide-react';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const Layout = ({ children }) => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: FileText, label: 'Quotations', path: '/quotations' },
        { icon: FileText, label: 'Invoices', path: '/invoices' },
        { icon: ShoppingCart, label: 'Items', path: '/items' },
        { icon: Users, label: 'Clients', path: '/clients' },
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:flex md:flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Header with Logo */}
                <div className="h-16 flex items-center justify-between px-6 border-b shrink-0">
                    <img
                        src="/SkyLub-System.png"
                        alt="Skylub System"
                        className="h-12 w-auto object-contain" // Adjusted height and width
                    />
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary-50 text-primary-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 text-gray-700 hover:text-primary-600'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t bg-gray-50">
                    <div className="flex items-center mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold mr-3">
                            {user?.name?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
                    <div className="flex items-center">
                        <button
                            onClick={toggleSidebar}
                            className="mr-4 text-gray-500 md:hidden p-2 rounded-md hover:bg-gray-100"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-semibold text-gray-800 truncate">
                            {menuItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {/* Only show "New Quotation" button on tablet/desktop if space permits, or show icon only on mobile */}
                        <Link to="/quotations/new" className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center text-sm font-medium shadow-sm transition-colors">
                            <PlusCircle className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">New Quotation</span>
                        </Link>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50 relative">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
