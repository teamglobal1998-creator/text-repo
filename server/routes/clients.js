const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { body, validationResult } = require('express-validator');

// Get all clients
router.get('/', (req, res) => {
    try {
        const clients = db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
        res.json(clients);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create new client
router.post('/', [
    body('name').notEmpty().withMessage('Name is required'),
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, address, gstin } = req.body;

    try {
        const result = db.prepare(`
      INSERT INTO clients (name, email, phone, address, gstin)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, email, phone, address, gstin);

        res.status(201).json({ id: result.lastInsertRowid, ...req.body });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update client
router.put('/:id', (req, res) => {
    const { name, email, phone, address, gstin } = req.body;

    try {
        const result = db.prepare(`
      UPDATE clients 
      SET name = ?, email = ?, phone = ?, address = ?, gstin = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, email, phone, address, gstin, req.params.id);

        if (result.changes === 0) return res.status(404).json({ message: 'Client not found' });

        res.json({ message: 'Client updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete client
router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ message: 'Client not found' });
        res.json({ message: 'Client deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
