const express = require('express');
const router = express.Router();
const { db } = require('../database');

// Helper to generate Invoice Number (e.g., INV-2023001)
const generateInvoiceNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const count = db.prepare('SELECT COUNT(*) as count FROM invoices').get().count + 1;
    return `INV-${year}${String(count).padStart(4, '0')}`;
};

// Get all invoices
router.get('/', (req, res) => {
    try {
        const rows = db.prepare(`
            SELECT i.*, c.name as client_name 
            FROM invoices i 
            JOIN clients c ON i.client_id = c.id
            ORDER BY i.created_at DESC
        `).all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single invoice by ID
router.get('/:id', (req, res) => {
    try {
        const invoice = db.prepare(`
            SELECT i.*, c.name as client_name, c.email as client_email, c.phone as client_phone, c.address as client_address, c.gstin as client_gstin
            FROM invoices i 
            JOIN clients c ON i.client_id = c.id
            WHERE i.id = ?
        `).get(req.params.id);

        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const items = db.prepare(`
            SELECT ii.*, i.name, i.description 
            FROM invoice_items ii
            JOIN items i ON ii.item_id = i.id
            WHERE ii.invoice_id = ?
        `).all(req.params.id);

        res.json({ ...invoice, items });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Invoice
router.post('/', (req, res) => {
    const { client_id, user_id, quotation_id, items, discount_type, discount_value, notes, terms, due_date } = req.body;

    // Calculate totals
    let subtotal = 0;
    let tax_amount = 0;

    items.forEach(item => {
        const amount = item.quantity * item.unit_price;
        subtotal += amount;
        tax_amount += (amount * (item.gst_percentage / 100));
    });

    let total_amount = subtotal + tax_amount;

    // Check if discount is applied
    if (discount_type === 'percentage') {
        const discount = (total_amount * discount_value) / 100;
        total_amount -= discount;
    } else if (discount_type === 'fixed') {
        total_amount -= discount_value;
    }

    const invoice_number = generateInvoiceNumber();

    const insertTransaction = db.transaction(() => {
        const result = db.prepare(`
            INSERT INTO invoices (invoice_number, quotation_id, client_id, user_id, subtotal, discount_type, discount_value, tax_amount, total_amount, notes, terms, due_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(invoice_number, quotation_id, client_id, user_id, subtotal, discount_type, discount_value, tax_amount, total_amount, notes, terms, due_date);

        const invoice_id = result.lastInsertRowid;

        const insertItem = db.prepare(`
            INSERT INTO invoice_items (invoice_id, item_id, quantity, unit_price, gst_percentage, amount)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        items.forEach(item => {
            const amount = item.quantity * item.unit_price;
            insertItem.run(invoice_id, item.item_id, item.quantity, item.unit_price, item.gst_percentage, amount);
        });

        if (quotation_id) {
            db.prepare('UPDATE quotations SET status = "approved" WHERE id = ?').run(quotation_id);
        }

        return { id: invoice_id, invoice_number };
    });

    try {
        const result = insertTransaction();
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Update Invoice Payment Status
router.patch('/:id/payment', (req, res) => {
    const { payment_status, paid_amount } = req.body;
    try {
        db.prepare(`
            UPDATE invoices 
            SET payment_status = ?, paid_amount = ? 
            WHERE id = ?
        `).run(payment_status, paid_amount, req.params.id);
        res.json({ message: 'Payment updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete Invoice
router.delete('/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
        res.json({ message: 'Invoice deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
