const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'quotation.db'));

console.log('🌱 Starting Skylub System Data Seeding...');

// 1. Clear existing data (optional, but good for a fresh start)
// Keep Users table to preserve Admin login
db.prepare('DELETE FROM invoice_items').run();
db.prepare('DELETE FROM invoices').run();
db.prepare('DELETE FROM quotation_items').run();
db.prepare('DELETE FROM quotations').run();
db.prepare('DELETE FROM items').run();
db.prepare('DELETE FROM clients').run();
db.prepare('DELETE FROM company_settings').run();

console.log('🧹 Cleared existing operational data.');

// 2. Insert Company Settings
const insertCompany = db.prepare(`
    INSERT INTO company_settings (id, company_name, address, email, phone, gstin)
    VALUES (?, ?, ?, ?, ?, ?)
`);

insertCompany.run(
    1,
    'Skylub System',
    'Plot No. 45, GIDC Industrial Estate, \nAhmedabad, Gujarat - 380015',
    'sales@skylubsystem.com',
    '+91 98765 43210',
    '24AAACS1234K1Z2'
);
console.log('🏢 Company details updated to Skylub System.');

// 3. Insert Items (Lubrication System Parts)
const items = [
    { name: 'Motorized Lubrication Unit (2L)', description: '2 Liter Reservoir, 220V AC, with Timer & Pressure Switch', unit_price: 12500, gst: 18 },
    { name: 'Manual Grease Pump', description: 'Hand Operated Grease Pump for Single Line System', unit_price: 4500, gst: 18 },
    { name: 'Progressive Distributor Block (6 Outlet)', description: 'SS 304, Max Pressure 300 Bar, 0.2cc/stroke', unit_price: 3200, gst: 18 },
    { name: 'Nylon Tubing (6mm OD)', description: 'High Pressure Flexible Nylon Tube (Per Meter)', unit_price: 45, gst: 18 },
    { name: 'Brass Compression Fitting (6mm)', description: 'Straight Connector 6mm x 1/8 BSP', unit_price: 120, gst: 18 },
    { name: 'Electronic Timer Controller', description: 'Digital Timer for Lube Systems, 110/220V', unit_price: 2800, gst: 18 },
    { name: 'Oil Injector (0.1cc)', description: 'Direct Oil Injector for Metering Systems', unit_price: 850, gst: 18 },
    { name: 'Grease Filter Assembly', description: 'In-line Grease Filter with 100 micron element', unit_price: 1500, gst: 18 },
    { name: 'Pressure Switch (50 Bar)', description: 'Adjustable Pressure Switch NO/NC 20-50 Bar', unit_price: 1800, gst: 18 },
    { name: 'Lubrication Oil (ISO VG 68)', description: 'Industrial Gear Oil - 20L Bucket', unit_price: 3500, gst: 18 }
];

const insertItem = db.prepare('INSERT INTO items (name, description, unit_price, gst_percentage) VALUES (?, ?, ?, ?)');
items.forEach(i => insertItem.run(i.name, i.description, i.unit_price, i.gst));
console.log(`🔧 seeded ${items.length} Items.`);

// 4. Insert Clients
const clients = [
    { name: 'Tata Motors Ltd', email: 'procurement@tatamotors.com', phone: '020-66123456', address: 'Pimpri, Pune, Maharashtra', gstin: '27AAACT1234P1Z5' },
    { name: 'Jindal Steel & Power', email: 'purchase@jindalsteel.com', phone: '011-26123456', address: 'Raigarh, Chhattisgarh', gstin: '22AAACJ1234R1Z9' },
    { name: 'Hero MotoCorp', email: 'vendor.connect@heromotocorp.com', phone: '0124-4712345', address: 'Neemrana, Rajasthan', gstin: '08AAACH1234N1Z2' },
    { name: 'Larsen & Toubro', email: 'supplychain@larsentoubro.com', phone: '022-67123456', address: 'Powai, Mumbai, Maharashtra', gstin: '27AAACL1234M1Z8' },
    { name: 'Mahindra & Mahindra', email: 'sourcing@mahindra.com', phone: '022-24912345', address: 'Kandivali, Mumbai, Maharashtra', gstin: '27AAACM1234K1Z1' },
    { name: 'Asian Paints', email: 'materials@asianpaints.com', phone: '022-39812345', address: 'Ankleshwar, Gujarat', gstin: '24AAAAA1234A1Z3' },
    { name: 'Thermax Limited', email: 'vendor@thermaxglobal.com', phone: '020-66012345', address: 'Chinchwad, Pune', gstin: '27AAACT5678P1Z5' }
];

const insertClient = db.prepare('INSERT INTO clients (name, email, phone, address, gstin) VALUES (?, ?, ?, ?, ?)');
const clientIds = clients.map(c => insertClient.run(c.name, c.email, c.phone, c.address, c.gstin).lastInsertRowid);
console.log(`🏭 seeded ${clients.length} Clients.`);

// Helper to get random item
const getRandomItems = () => {
    const count = Math.floor(Math.random() * 3) + 2; // 2 to 4 items
    const selected = [];
    const itemIds = db.prepare('SELECT id, unit_price, gst_percentage FROM items').all();

    for (let i = 0; i < count; i++) {
        const item = itemIds[Math.floor(Math.random() * itemIds.length)];
        selected.push({
            id: item.id,
            qty: Math.floor(Math.random() * 5) + 1, // 1 to 5 qty
            price: item.unit_price,
            gst: item.gst_percentage
        });
    }
    return selected;
};

// 5. Insert Quotations
const insertQuotation = db.prepare(`
    INSERT INTO quotations (quotation_number, client_id, user_id, valid_until, subtotal, tax_amount, total_amount, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertQuotationItem = db.prepare(`
    INSERT INTO quotation_items (quotation_id, item_id, quantity, unit_price, gst_percentage, amount)
    VALUES (?, ?, ?, ?, ?, ?)
`);

for (let i = 1; i <= 8; i++) {
    const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
    const qItems = getRandomItems();

    let subtotal = 0;
    let tax = 0;

    qItems.forEach(item => {
        const amount = item.qty * item.price;
        subtotal += amount;
        tax += amount * (item.gst / 100);
    });

    const total = subtotal + tax;
    const status = ['draft', 'sent', 'approved', 'rejected'][Math.floor(Math.random() * 4)];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Past 30 days

    const validUntil = new Date(date);
    validUntil.setDate(validUntil.getDate() + 15);

    const qNum = `QT-${new Date().getFullYear()}${1000 + i}`;

    const info = insertQuotation.run(qNum, clientId, 1, validUntil.toISOString(), subtotal, tax, total, status, date.toISOString());
    const qId = info.lastInsertRowid;

    qItems.forEach(item => {
        insertQuotationItem.run(qId, item.id, item.qty, item.price, item.gst, item.qty * item.price);
    });
}
console.log('📄 Seeded 8 Quotations.');

// 6. Insert Invoices
const insertInvoice = db.prepare(`
    INSERT INTO invoices (invoice_number, client_id, user_id, due_date, subtotal, tax_amount, total_amount, payment_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertInvoiceItem = db.prepare(`
    INSERT INTO invoice_items (invoice_id, item_id, quantity, unit_price, gst_percentage, amount)
    VALUES (?, ?, ?, ?, ?, ?)
`);

for (let i = 1; i <= 8; i++) {
    const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
    const iItems = getRandomItems();

    let subtotal = 0;
    let tax = 0;

    iItems.forEach(item => {
        const amount = item.qty * item.price;
        subtotal += amount;
        tax += amount * (item.gst / 100);
    });

    const total = subtotal + tax;
    const status = ['paid', 'pending', 'partially_paid'][Math.floor(Math.random() * 3)];

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60)); // Past 60 days

    const dueDate = new Date(date);
    dueDate.setDate(dueDate.getDate() + 30);

    const invNum = `INV-${new Date().getFullYear()}${1000 + i}`;

    const info = insertInvoice.run(invNum, clientId, 1, dueDate.toISOString(), subtotal, tax, total, status, date.toISOString());
    const invId = info.lastInsertRowid;

    iItems.forEach(item => {
        insertInvoiceItem.run(invId, item.id, item.qty, item.price, item.gst, item.qty * item.price);
    });
}
console.log('🧾 Seeded 8 Invoices.');

console.log('✅ Skylub System Data Seeding Complete!');
