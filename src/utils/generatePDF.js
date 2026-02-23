import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const getBase64ImageFromURL = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.setAttribute("crossOrigin", "anonymous");
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL("image/png");
            resolve(dataURL);
        };
        img.onerror = error => {
            // resolve null instead of rejecting to allow fallback
            console.warn("Failed to load logo image", error);
            resolve(null);
        };
        img.src = url;
    });
};

export const generateQuotationPDF = async (quotation) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    const type = quotation.type === 'INVOICE' ? 'INVOICE' : 'QUOTATION';
    const number = quotation.type === 'INVOICE' ? quotation.invoice_number : quotation.quotation_number;
    const dateLabel = quotation.type === 'INVOICE' ? 'Due Date' : 'Valid Until';
    const dateValue = quotation.type === 'INVOICE' ? quotation.due_date : quotation.valid_until;
    const color = quotation.type === 'INVOICE' ? [46, 125, 50] : [66, 133, 244]; // Green for Invoice, Blue for Quotation

    // --- LOAD LOGO ---
    const logoUrl = '/SkyLub-System.png';
    let logoData = null;
    try {
        logoData = await getBase64ImageFromURL(logoUrl);
    } catch (e) {
        console.warn("Logo loading error", e);
    }

    // --- LOGO & HEADER SECTION ---

    if (logoData) {
        // Add Real Image Logo
        // Adjust width/height ratio. Assume aspect ratio is roughly 3:1 or so for a logo? Or square?
        // Let's constrain width to ~40 units and keep aspect ratio.
        // But since we don't know dimensions easily without pre-calc, let's just use fixed box for now 
        // or calculate aspect inside helper if needed. But Image obj has width/height.
        // For simplicity: standardized width 50, height auto
        doc.addImage(logoData, 'PNG', 14, 10, 50, 15); // x, y, w, h
    } else {
        // Fallback Vector Logo (Stylized Drop/S)
        doc.setFillColor(66, 133, 244); // Blue
        doc.circle(20, 20, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("S", 18, 22);
    }

    // Company Name (If logo is image, maybe skip text name if logo has text? 
    // Usually cleaner to just use Logo OR Logo + Name. 
    // If Logo is provided, maybe we move Name to below or smaller? 
    // Let's keep Company Name next to logo for now, but maybe adjust X position if Logo is wide.
    // If logo data exists, we shift text right? 
    // Let's assume the logo replaces the vector logo at (14,10) position.
    // The "Skylub System" text was at (35, 22). With image logo width 50, it overlaps.
    // If image logo is used, we might not need "Skylub System" text title if logo contains it.
    // But usually safer to keep text for clarity unless logo has text.
    // Let's shift text to right if logo is present? Or remove text title if logo present?
    // Let's remove the Title Text if logo is present, assume logo has name.

    if (!logoData) {
        doc.setTextColor(0, 0, 0); // Black
        doc.setFontSize(22);
        doc.text("Skylub System", 35, 22);
    }

    // Document Type Label (Right Aligned)
    doc.setFontSize(20);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(type, pageWidth - 14, 22, { align: "right" });

    // Company Address Details (Below Logo)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80); // Gray
    doc.text("Centralized Lubrication Systems", 14, 35);
    doc.text("Plot No. 45, GIDC Industrial Estate, Ahmedabad, Gujarat - 380015", 14, 40);
    doc.text("Email: sales@skylubsystem.com | Phone: +91 98765 43210", 14, 45);
    doc.text("GSTIN: 24AAACS1234K1Z2", 14, 50);

    // Separator Line
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(14, 55, pageWidth - 14, 55);

    // --- CLIENT & DOC INFO SECTION ---

    // Left Side: Client Details
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("To:", 14, 65);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(quotation.client_name || 'Client Name', 14, 70);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    if (quotation.client_address) {
        // Handle multi-line address
        const splitAddress = doc.splitTextToSize(quotation.client_address, 80);
        doc.text(splitAddress, 14, 75);
    }

    // GSTIN often below address
    // Estimate Y position based on address lines
    const addressHeight = quotation.client_address ? (doc.splitTextToSize(quotation.client_address, 80).length * 5) : 5;
    if (quotation.client_gstin) doc.text(`GSTIN: ${quotation.client_gstin}`, 14, 75 + addressHeight);

    // Right Side: Document Specifics
    const infoX = pageWidth - 60;
    doc.setTextColor(50);

    doc.text(`${type} No:`, infoX, 65);
    doc.setFont("helvetica", "bold");
    doc.text(number, pageWidth - 14, 65, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.text("Date:", infoX, 71);
    doc.text(new Date(quotation.created_at).toLocaleDateString(), pageWidth - 14, 71, { align: "right" });

    doc.text(`${dateLabel}:`, infoX, 77);
    doc.text(dateValue ? new Date(dateValue).toLocaleDateString() : 'N/A', pageWidth - 14, 77, { align: "right" });

    // --- ITEMS TABLE ---
    const tableColumn = ["#", "Item Description", "Qty", "Price", "GST%", "Total"];
    const tableRows = [];

    quotation.items.forEach((item, index) => {
        const itemData = [
            index + 1,
            `${item.name || 'Item'} \n${item.description || ''}`,
            item.quantity,
            `Rs. ${item.unit_price.toFixed(2)}`,
            `${item.gst_percentage}%`,
            `Rs. ${item.amount.toFixed(2)}`
        ];
        tableRows.push(itemData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 100, // Fixed start Y to ensure clearance
        theme: 'grid',
        headStyles: {
            fillColor: color,
            textColor: 255,
            cellPadding: 3
        },
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 80 }, // Description
            2: { cellWidth: 15, halign: 'center' }, // Qty
            3: { cellWidth: 25, halign: 'right' }, // Price
            4: { cellWidth: 15, halign: 'center' }, // GST
            5: { cellWidth: 35, halign: 'right' }  // Total
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        }
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // --- TOTALS SECTION ---
    const totalsXLabel = pageWidth - 70;
    const totalsXValue = pageWidth - 14;

    doc.setFontSize(10);
    doc.setTextColor(50);

    // Subtotal
    doc.text("Subtotal:", totalsXLabel, finalY);
    doc.text(`Rs. ${quotation.subtotal.toFixed(2)}`, totalsXValue, finalY, { align: "right" });

    // Discount
    let currentY = finalY;
    if (quotation.discount_value > 0) {
        currentY += 6;
        doc.text(`Discount (${quotation.discount_type}):`, totalsXLabel, currentY);
        doc.text(`- Rs. ${quotation.discount_value.toFixed(2)}`, totalsXValue, currentY, { align: "right" });
    }

    // Tax
    currentY += 6;
    doc.text("Tax (GST):", totalsXLabel, currentY);
    doc.text(`Rs. ${quotation.tax_amount.toFixed(2)}`, totalsXValue, currentY, { align: "right" });

    // Grand Total
    currentY += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.setFillColor(color[0], color[1], color[2]);
    // Draw a colored background box for absolute total could be nice, but simple text is cleaner
    doc.text("Total Amount:", totalsXLabel, currentY);
    doc.text(`Rs. ${quotation.total_amount.toFixed(2)}`, totalsXValue, currentY, { align: "right" });

    // --- FOOTER & TERMS ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80);

    if (quotation.terms) {
        const termsY = finalY + 10; // Left side aligned with totals top
        // Ensure terms don't overlap totals if they are long? 
        // Best to put them below or to the left if space permits.
        // Let's put them absolute below table on left side.

        doc.text("Terms & Conditions:", 14, termsY);
        const terms = doc.splitTextToSize(quotation.terms, 100); // 100 width limit
        doc.text(terms, 14, termsY + 5);
    }

    // Signature
    doc.text("For Skylub System", pageWidth - 60, currentY + 30);
    doc.text("Authorised Signatory", pageWidth - 60, currentY + 50);

    doc.save(`${number}.pdf`);
};
