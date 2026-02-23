import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import Clients from './pages/Clients';
import Quotations from './pages/Quotations';
import QuotationForm from './pages/QuotationForm';
import Invoices from './pages/Invoices';
import InvoiceForm from './pages/InvoiceForm';
import { AuthContext } from './context/AuthContext';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />

      <Route path="/items" element={
        <PrivateRoute>
          <Items />
        </PrivateRoute>
      } />

      <Route path="/clients" element={
        <PrivateRoute>
          <Clients />
        </PrivateRoute>
      } />

      <Route path="/quotations" element={
        <PrivateRoute>
          <Quotations />
        </PrivateRoute>
      } />

      <Route path="/quotations/new" element={
        <PrivateRoute>
          <QuotationForm />
        </PrivateRoute>
      } />

      <Route path="/quotations/edit/:id" element={
        <PrivateRoute>
          <QuotationForm />
        </PrivateRoute>
      } />

      <Route path="/invoices" element={
        <PrivateRoute>
          <Invoices />
        </PrivateRoute>
      } />

      <Route path="/invoices/new" element={
        <PrivateRoute>
          <InvoiceForm />
        </PrivateRoute>
      } />
    </Routes>
  );
}

export default App;
