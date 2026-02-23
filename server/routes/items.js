const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { body, validationResult } = require('express-validator');

// Get all items
router.get('/', (req, res) => {
    try {
        const items = db.prepare('SELECT * FROM items ORDER BY created_at DESC').all();
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create new item
router.post('/', [
    body('name').notEmpty().withMessage('Name is required'),
    body('unit_price').isNumeric().withMessage('Price must be a number'),
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, unit_price, gst_percentage, unit } = req.body;

    try {
        const result = db.prepare(`
      INSERT INTO items (name, description, unit_price, gst_percentage, unit)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, description, unit_price, gst_percentage || 18, unit || 'nos');

        res.status(201).json({ id: result.lastInsertRowid, ...req.body });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update item
router.put('/:id', (req, res) => {
    const { name, description, unit_price, gst_percentage, unit } = req.body;

    try {
        const result = db.prepare(`
      UPDATE items 
      SET name = ?, description = ?, unit_price = ?, gst_percentage = ?, unit = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, description, unit_price, gst_percentage, unit, req.params.id);

        if (result.changes === 0) return res.status(404).json({ message: 'Item not found' });

        res.json({ message: 'Item updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete item
router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ message: 'Item not found' });
        res.json({ message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
