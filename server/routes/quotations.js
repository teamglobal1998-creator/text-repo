const express = require('express');
const router = express.Router();
const { db } = require('../database');

// Helper to generate Quotation Number (e.g., QT-2023001)
const generateQuotationNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const count = db.prepare('SELECT COUNT(*) as count FROM quotations').get().count + 1;
    return `QT-${year}${String(count).padStart(4, '0')}`;
};

// Get all quotations
router.get('/', (req, res) => {
    try {
        const rows = db.prepare(`
            SELECT q.*, c.name as client_name 
            FROM quotations q 
            JOIN clients c ON q.client_id = c.id
            ORDER BY q.created_at DESC
        `).all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single quotation by ID
router.get('/:id', (req, res) => {
    try {
        const quotation = db.prepare(`
            SELECT q.*, c.name as client_name, c.email as client_email, c.phone as client_phone, c.address as client_address, c.gstin as client_gstin
            FROM quotations q 
            JOIN clients c ON q.client_id = c.id
            WHERE q.id = ?
        `).get(req.params.id);

        if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

        const items = db.prepare(`
            SELECT qi.*, i.name, i.description 
            FROM quotation_items qi
            JOIN items i ON qi.item_id = i.id
            WHERE qi.quotation_id = ?
        `).all(req.params.id);

        res.json({ ...quotation, items });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Quotation
router.post('/', (req, res) => {
    const { client_id, user_id, items, discount_type, discount_value, notes, terms, valid_until } = req.body;

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

    const quotation_number = generateQuotationNumber();

    const insertTransaction = db.transaction(() => {
        const result = db.prepare(`
            INSERT INTO quotations (quotation_number, client_id, user_id, subtotal, discount_type, discount_value, tax_amount, total_amount, notes, terms, valid_until)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(quotation_number, client_id, user_id, subtotal, discount_type, discount_value, tax_amount, total_amount, notes, terms, valid_until);

        const quotation_id = result.lastInsertRowid;

        const insertItem = db.prepare(`
            INSERT INTO quotation_items (quotation_id, item_id, quantity, unit_price, gst_percentage, amount)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        items.forEach(item => {
            const amount = item.quantity * item.unit_price;
            insertItem.run(quotation_id, item.item_id, item.quantity, item.unit_price, item.gst_percentage, amount);
        });

        return { id: quotation_id, quotation_number };
    });

    try {
        const result = insertTransaction();
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Update Quotation Status
router.patch('/:id/status', (req, res) => {
    const { status } = req.body;
    try {
        db.prepare('UPDATE quotations SET status = ? WHERE id = ?').run(status, req.params.id);
        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Delete Quotation
router.delete('/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM quotations WHERE id = ?').run(req.params.id);
        res.json({ message: 'Quotation deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
