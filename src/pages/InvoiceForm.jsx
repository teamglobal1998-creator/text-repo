import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Trash2, Save, ArrowLeft, Plus } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const InvoiceForm = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const quotationId = searchParams.get('quotation_id');

    const [clients, setClients] = useState([]);
    const [items, setItems] = useState([]);

    // Form State
    const [clientId, setClientId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [terms, setTerms] = useState('1. Payment due within 7 days.\n2. Late payment interest 1.5% per month.\n3. Goods once sold will not be taken back.');
    const [discountType, setDiscountType] = useState('percentage'); // percentage | fixed
    const [discountValue, setDiscountValue] = useState(0);

    // Dynamic Items
    const [selectedItems, setSelectedItems] = useState([
        { item_id: '', quantity: 1, unit_price: 0, gst_percentage: 18, amount: 0, name: '', description: '' }
    ]);

    // Derived Totals
    const [subtotal, setSubtotal] = useState(0);
    const [taxAmount, setTaxAmount] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [cRes, iRes] = await Promise.all([
                    api.get('/clients'),
                    api.get('/items')
                ]);
                setClients(cRes.data);
                setItems(iRes.data);

                // If converting from quotation
                if (quotationId) {
                    const qRes = await api.get(`/quotations/${quotationId}`);
                    const qData = qRes.data;

                    setClientId(qData.client_id);
                    setNotes(qData.notes);
                    setTerms(qData.terms); // Maybe use invoice terms instead? using q data for now
                    setDiscountType(qData.discount_type);
                    setDiscountValue(qData.discount_value);

                    // Map items
                    const mappedItems = qData.items.map(item => ({
                        item_id: item.item_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        gst_percentage: item.gst_percentage,
                        amount: item.amount,
                        name: item.name,
                        description: item.description
                    }));
                    setSelectedItems(mappedItems);
                }
            } catch (error) {
                toast.error('Failed to load form data');
            }
        };
        loadData();
    }, [quotationId]);

    // Calculation Effect
    useEffect(() => {
        let newSubtotal = 0;
        let newTaxAmount = 0;

        selectedItems.forEach(item => {
            const amount = item.quantity * item.unit_price;
            newSubtotal += amount;
            newTaxAmount += (amount * (item.gst_percentage / 100));
        });

        let newTotal = newSubtotal + newTaxAmount;

        if (discountType === 'percentage') {
            newTotal -= (newTotal * discountValue) / 100;
        } else {
            newTotal -= discountValue;
        }

        setSubtotal(newSubtotal);
        setTaxAmount(newTaxAmount);
        setTotalAmount(newTotal);
    }, [selectedItems, discountType, discountValue]);

    const handleItemChange = (index, field, value) => {
        const newItems = [...selectedItems];
        newItems[index][field] = value;

        // If item_id changed, populate details
        if (field === 'item_id') {
            const product = items.find(i => i.id === parseInt(value));
            if (product) {
                newItems[index].name = product.name;
                newItems[index].description = product.description;
                newItems[index].unit_price = product.unit_price;
                newItems[index].gst_percentage = product.gst_percentage;
                newItems[index].amount = product.unit_price * newItems[index].quantity;
            }
        }

        setSelectedItems(newItems);
    };

    const addItemRow = () => {
        setSelectedItems([...selectedItems, { item_id: '', quantity: 1, unit_price: 0, gst_percentage: 18, amount: 0, name: '', description: '' }]);
    };

    const removeItemRow = (index) => {
        if (selectedItems.length > 1) {
            const newItems = selectedItems.filter((_, i) => i !== index);
            setSelectedItems(newItems);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!clientId) {
            toast.error('Please select a client');
            return;
        }

        if (selectedItems.some(i => !i.item_id)) {
            toast.error('Please select items for all rows');
            return;
        }

        const payload = {
            client_id: parseInt(clientId),
            user_id: user.id,
            quotation_id: quotationId ? parseInt(quotationId) : null,
            items: selectedItems.map(i => ({
                item_id: i.item_id,
                quantity: parseFloat(i.quantity),
                unit_price: parseFloat(i.unit_price),
                gst_percentage: parseFloat(i.gst_percentage)
            })),
            discount_type: discountType,
            discount_value: parseFloat(discountValue),
            notes,
            terms,
            due_date: dueDate
        };

        try {
            await api.post('/invoices', payload);
            toast.success('Invoice created successfully');
            setTimeout(() => navigate('/invoices'), 1000);
        } catch (error) {
            console.error(error);
            toast.error('Failed to create invoice');
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-10">
            <Toaster position="top-right" />

            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate('/invoices')}
                    className="mr-4 p-2 rounded-full hover:bg-gray-200 transition"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">
                    {quotationId ? 'Convert Quotation to Invoice' : 'New Invoice'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Client Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Client Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Client</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                required
                            >
                                <option value="">-- Select Client --</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Items</h2>

                    <div className="space-y-4">
                        {selectedItems.map((item, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-4 md:items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div className="flex-grow w-full md:w-1/3">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Item</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                                        value={item.item_id}
                                        onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                                        required
                                    >
                                        <option value="">-- Select Item --</option>
                                        {items.map(i => (
                                            <option key={i.id} value={i.id}>{i.name} (₹{i.unit_price})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-full md:w-24">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                    />
                                </div>
                                <div className="w-full md:w-32">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                                        value={item.unit_price}
                                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                    />
                                </div>
                                <div className="w-full md:w-24">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">GST %</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                                        value={item.gst_percentage}
                                        onChange={(e) => handleItemChange(index, 'gst_percentage', e.target.value)}
                                    />
                                </div>
                                <div className="w-full md:w-32 md:text-right font-semibold text-gray-700 pb-2 flex justify-between md:block">
                                    <span className="md:hidden text-xs text-gray-500 mr-2 self-center">Total:</span>
                                    <span>₹{((item.quantity * item.unit_price) * (1 + item.gst_percentage / 100)).toFixed(2)}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeItemRow(index)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg self-end md:self-auto"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addItemRow}
                        className="mt-4 flex items-center text-primary-600 hover:text-primary-800 font-medium"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Add Another Item
                    </button>
                </div>

                {/* Summary Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex flex-col md:flex-row justify-between">
                        <div className="w-full md:w-1/2 md:pr-8 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    rows="2"
                                    placeholder="Thank you for your business!"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                                    rows="4"
                                    value={terms}
                                    onChange={(e) => setTerms(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="w-full md:w-1/3 mt-6 md:mt-0 space-y-3 bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal:</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-600">
                                <span>Discount:</span>
                                <div className="flex items-center space-x-2 w-32">
                                    <select
                                        className="w-1/2 p-1 text-xs border rounded"
                                        value={discountType}
                                        onChange={(e) => setDiscountType(e.target.value)}
                                    >
                                        <option value="percentage">%</option>
                                        <option value="fixed">₹</option>
                                    </select>
                                    <input
                                        type="number"
                                        className="w-1/2 p-1 text-xs border rounded"
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Tax (GST):</span>
                                <span>₹{taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-gray-300 pt-3 flex justify-between font-bold text-lg text-gray-900">
                                <span>Total:</span>
                                <span>₹{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/invoices')}
                        className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 shadow-lg flex items-center"
                    >
                        <Save className="w-5 h-5 mr-2" />
                        Generate Invoice
                    </button>
                </div>

            </form>
        </div>
    );
};

export default InvoiceForm;
