import PDFDocument from "pdfkit";
import type {
  RateConfirmationData,
  BOLData,
  InvoiceData,
  OrganizationBasicInfo,
} from "../types/document.types.js";

/**
 * Professional PDF Generation Service using PDFKit
 * Generates styled, production-ready PDF documents
 */
export class PDFGeneratorService {
  /**
   * Generate a professional Rate Confirmation PDF
   */
  async generateRateConfirmationPDF(
    data: RateConfirmationData,
    organization: OrganizationBasicInfo
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "LETTER",
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Professional Header with Company Info
        doc.rect(40, 40, 512, 60).fill("#f8f9fa");
        doc.rect(40, 40, 512, 60).stroke("#dee2e6");

        // Company Name and Logo Area
        doc
          .fontSize(24)
          .fillColor("#1a365d")
          .text(organization.name || "TMS", 60, 55);
        doc
          .fontSize(10)
          .fillColor("#666")
          .text("TRANSPORTATION MANAGEMENT", 60, 80);

        // Document Title
        doc
          .fontSize(28)
          .fillColor("#2d3748")
          .text("RATE CONFIRMATION", { align: "center" });

        // Document Numbers in Header
        doc.fontSize(10).fillColor("#4a5568");
        doc.text(`Load #: ${data.loadNumber}`, 450, 55);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 450, 70);
        doc.text(`Rate Confirmation`, 450, 85);

        doc.moveDown(3);

        // Customer Information
        this.addSection(doc, "CUSTOMER INFORMATION", [
          { label: "Company", value: data.customerName },
          {
            label: "Address",
            value: this.formatAddress(data.customerAddress),
          },
        ]);

        // Carrier Information
        this.addSection(doc, "CARRIER INFORMATION", [
          { label: "Company", value: data.carrierName },
          { label: "MC Number", value: data.carrierMC },
        ]);

        // Pickup Information
        this.addSection(doc, "PICKUP INFORMATION", [
          { label: "Shipper", value: data.shipper.name },
          { label: "Address", value: this.formatAddress(data.shipper.address) },
          { label: "Phone", value: data.shipper.phone },
          { label: "Date", value: data.pickupDate },
        ]);

        // Delivery Information
        this.addSection(doc, "DELIVERY INFORMATION", [
          { label: "Consignee", value: data.consignee.name },
          {
            label: "Address",
            value: this.formatAddress(data.consignee.address),
          },
          { label: "Phone", value: data.consignee.phone },
          { label: "Date", value: data.deliveryDate },
        ]);

        // Load Details
        this.addSection(doc, "LOAD DETAILS", [
          { label: "Commodity", value: data.commodity },
          { label: "Weight", value: `${data.weight} lbs` },
          { label: "Equipment Type", value: data.equipmentType },
        ]);

        // Rates (highlighted box)
        const ratesY = doc.y;
        doc.fillColor("#f5f5f5").rect(50, ratesY, 512, 90).fill();

        doc
          .fillColor("#0066cc")
          .fontSize(12)
          .text("RATES", 60, ratesY + 10);
        doc.fillColor("#333").fontSize(10);
        doc.text(
          `Customer Rate: $${data.customerRate.toFixed(2)}`,
          60,
          ratesY + 35
        );
        doc.text(
          `Carrier Rate: $${data.carrierRate.toFixed(2)}`,
          60,
          doc.y + 5
        );
        const margin = data.customerRate - data.carrierRate;
        doc.text(`Margin: $${margin.toFixed(2)}`, 60, doc.y + 5);

        doc.y = ratesY + 100;
        doc.moveDown(1);

        // Instructions
        if (data.pickupInstructions) {
          doc.fontSize(11).fillColor("#0066cc").text("PICKUP INSTRUCTIONS:");
          doc
            .fontSize(10)
            .fillColor("#333")
            .text(data.pickupInstructions, { width: 500 });
          doc.moveDown(1);
        }

        if (data.deliveryInstructions) {
          doc.fontSize(11).fillColor("#0066cc").text("DELIVERY INSTRUCTIONS:");
          doc
            .fontSize(10)
            .fillColor("#333")
            .text(data.deliveryInstructions, { width: 500 });
          doc.moveDown(1);
        }

        // Footer
        const pageHeight = doc.page.height;
        const footerY = pageHeight - 80;

        doc.fontSize(8).fillColor("#666");
        doc.text(
          "This document serves as a legal contract for the transportation of goods.",
          50,
          footerY,
          { align: "center", width: 512 }
        );
        doc.moveDown(0.5);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, {
          align: "center",
          width: 512,
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate a professional Bill of Lading PDF
   */
  async generateBOLPDF(
    data: BOLData,
    organization: OrganizationBasicInfo
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "LETTER",
          margins: { top: 40, bottom: 40, left: 40, right: 40 },
        });

        const chunks: Buffer[] = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Professional Header with Company Info
        doc.rect(40, 40, 512, 60).fill("#f8f9fa");
        doc.rect(40, 40, 512, 60).stroke("#dee2e6");

        // Company Name and Logo Area
        doc
          .fontSize(24)
          .fillColor("#1a365d")
          .text(organization.name || "TMS", 60, 55);
        doc
          .fontSize(10)
          .fillColor("#666")
          .text("TRANSPORTATION MANAGEMENT", 60, 80);

        // Document Title
        doc
          .fontSize(28)
          .fillColor("#2d3748")
          .text("BILL OF LADING", { align: "center" });

        // Document Numbers in Header
        doc.fontSize(10).fillColor("#4a5568");
        doc.text(`BOL #: ${data.bolNumber}`, 450, 55);
        doc.text(`Load #: ${data.loadNumber}`, 450, 70);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 450, 85);

        doc.moveDown(3);

        // Main Content Area with Professional Layout
        const contentStartY = doc.y;

        // Shipper Information Box
        doc.rect(50, contentStartY, 170, 80).fill("#e6f3ff").stroke("#0066cc");
        doc
          .fontSize(12)
          .fillColor("#0066cc")
          .text("SHIPPER", 60, contentStartY + 10);
        doc.fontSize(10).fillColor("#2d3748");
        doc.text(data.shipper.name, 60, contentStartY + 25);
        doc.text(
          this.formatAddress(data.shipper.address),
          60,
          contentStartY + 40,
          { width: 150 }
        );
        doc.text(`Phone: ${data.shipper.phone}`, 60, contentStartY + 60);

        // Consignee Information Box
        doc.rect(230, contentStartY, 170, 80).fill("#f0fff4").stroke("#38a169");
        doc
          .fontSize(12)
          .fillColor("#38a169")
          .text("CONSIGNEE", 240, contentStartY + 10);
        doc.fontSize(10).fillColor("#2d3748");
        doc.text(data.consignee.name, 240, contentStartY + 25);
        doc.text(
          this.formatAddress(data.consignee.address),
          240,
          contentStartY + 40,
          { width: 150 }
        );
        doc.text(`Phone: ${data.consignee.phone}`, 240, contentStartY + 60);

        // Carrier Information Box
        doc.rect(410, contentStartY, 170, 80).fill("#fff5f5").stroke("#e53e3e");
        doc
          .fontSize(12)
          .fillColor("#e53e3e")
          .text("CARRIER", 420, contentStartY + 10);
        doc.fontSize(10).fillColor("#2d3748");
        doc.text(data.carrierName, 420, contentStartY + 25);
        doc.text(`MC #: ${data.carrierMC}`, 420, contentStartY + 40);
        if (data.driverName) {
          doc.text(`Driver: ${data.driverName}`, 420, contentStartY + 55);
        }
        if (data.truckNumber) {
          doc.text(`Truck: ${data.truckNumber}`, 420, contentStartY + 70);
        }

        // Load Details Section with Professional Table
        doc.moveDown(2.5);
        doc
          .fontSize(14)
          .fillColor("#2d3748")
          .text("LOAD SPECIFICATIONS", 50, doc.y);
        doc.moveDown(0.5);

        // Create a professional table for load details
        const tableData = [
          ["Commodity", data.commodity, "Weight", `${data.weight} lbs`],
          ["Pieces", data.pieces.toString(), "Equipment", data.equipmentType],
          [
            "Hazmat",
            data.hazmat ? "YES" : "NO",
            "Trailer #",
            data.trailerNumber || "N/A",
          ],
          ["Pro Number", data.bolNumber, "Reference", data.loadNumber],
        ];

        tableData.forEach((row, index) => {
          const y = doc.y;
          const rowHeight = 25;

          // Alternate row colors
          if (index % 2 === 0) {
            doc.rect(50, y - 5, 500, rowHeight).fill("#f7fafc");
          }

          doc.fontSize(10).fillColor("#2d3748");
          doc.text(row[0] + ":", 60, y, { width: 100 });
          doc.text(row[1], 160, y, { width: 120 });
          doc.text(row[2] + ":", 300, y, { width: 100 });
          doc.text(row[3], 400, y, { width: 120 });

          doc.moveDown(0.6);
        });

        // Pickup and Delivery Schedule
        doc.moveDown(1);
        doc.fontSize(14).fillColor("#2d3748").text("SCHEDULE", 50, doc.y);
        doc.moveDown(0.5);

        // Pickup Section
        doc.rect(50, doc.y, 240, 60).fill("#e6f3ff").stroke("#0066cc");
        doc
          .fontSize(12)
          .fillColor("#0066cc")
          .text("PICKUP", 60, doc.y + 10);
        doc.fontSize(10).fillColor("#2d3748");
        doc.text(`Date: ${data.pickupDate}`, 60, doc.y + 25);
        doc.text(`Time: ${data.pickupTime || "TBD"}`, 60, doc.y + 40);
        if (data.shipper.phone) {
          doc.text(`Contact: ${data.shipper.phone}`, 60, doc.y + 55);
        }

        // Delivery Section
        doc.rect(310, doc.y, 240, 60).fill("#f0fff4").stroke("#38a169");
        doc
          .fontSize(12)
          .fillColor("#38a169")
          .text("DELIVERY", 320, doc.y + 10);
        doc.fontSize(10).fillColor("#2d3748");
        doc.text(`Date: ${data.deliveryDate}`, 320, doc.y + 25);
        doc.text(`Time: ${data.deliveryTime || "TBD"}`, 320, doc.y + 40);
        if (data.consignee.phone) {
          doc.text(`Contact: ${data.consignee.phone}`, 320, doc.y + 55);
        }

        doc.moveDown(1.5);

        // Special Instructions
        if (data.specialInstructions) {
          doc
            .fontSize(12)
            .fillColor("#2d3748")
            .text("SPECIAL INSTRUCTIONS", 50, doc.y);
          doc.moveDown(0.3);
          doc.rect(50, doc.y, 500, 40).fill("#fffbf0").stroke("#f6ad55");
          doc.fontSize(10).fillColor("#2d3748");
          doc.text(data.specialInstructions, 60, doc.y + 10, { width: 480 });
          doc.moveDown(1);
        }

        // Terms and Conditions
        doc.fontSize(10).fillColor("#4a5568");
        doc.text("TERMS & CONDITIONS:", 50, doc.y);
        doc.moveDown(0.3);
        doc.text(
          "• This Bill of Lading is subject to the terms and conditions of the carrier's tariff.",
          50,
          doc.y,
          { width: 500 }
        );
        doc.text(
          "• The carrier's liability is limited as provided in the carrier's tariff.",
          50,
          doc.y + 3,
          { width: 500 }
        );
        doc.text(
          "• Freight charges are due upon delivery unless otherwise specified.",
          50,
          doc.y + 3,
          { width: 500 }
        );

        // Signature Section with Professional Layout
        doc.moveDown(2);
        doc.fontSize(14).fillColor("#2d3748").text("SIGNATURES", 50, doc.y);
        doc.moveDown(0.5);

        const sigY = doc.y;
        const sigWidth = 150;
        const sigHeight = 60;

        // Shipper Signature Box
        doc
          .rect(50, sigY, sigWidth, sigHeight)
          .fill("#f7fafc")
          .stroke("#cbd5e0");
        doc
          .fontSize(10)
          .fillColor("#2d3748")
          .text("SHIPPER SIGNATURE", 60, sigY + 10);
        doc
          .moveTo(60, sigY + 30)
          .lineTo(60 + sigWidth - 20, sigY + 30)
          .stroke("#4a5568");
        doc
          .fontSize(8)
          .fillColor("#666")
          .text("Date: ___________", 60, sigY + 40);
        doc.text("Print Name: ___________", 60, sigY + 50);

        // Driver Signature Box
        doc
          .rect(220, sigY, sigWidth, sigHeight)
          .fill("#f7fafc")
          .stroke("#cbd5e0");
        doc
          .fontSize(10)
          .fillColor("#2d3748")
          .text("DRIVER SIGNATURE", 230, sigY + 10);
        doc
          .moveTo(230, sigY + 30)
          .lineTo(230 + sigWidth - 20, sigY + 30)
          .stroke("#4a5568");
        doc
          .fontSize(8)
          .fillColor("#666")
          .text("Date: ___________", 230, sigY + 40);
        doc.text("Print Name: ___________", 230, sigY + 50);

        // Consignee Signature Box
        doc
          .rect(390, sigY, sigWidth, sigHeight)
          .fill("#f7fafc")
          .stroke("#cbd5e0");
        doc
          .fontSize(10)
          .fillColor("#2d3748")
          .text("CONSIGNEE SIGNATURE", 400, sigY + 10);
        doc
          .moveTo(400, sigY + 30)
          .lineTo(400 + sigWidth - 20, sigY + 30)
          .stroke("#4a5568");
        doc
          .fontSize(8)
          .fillColor("#666")
          .text("Date: ___________", 400, sigY + 40);
        doc.text("Print Name: ___________", 400, sigY + 50);

        // Professional Footer
        const pageHeight = doc.page.height;
        const footerY = pageHeight - 60;

        doc.rect(40, footerY, 512, 20).fill("#f8f9fa").stroke("#dee2e6");
        doc.fontSize(8).fillColor("#666");
        doc.text(
          "This document serves as a legal contract for the transportation of goods.",
          50,
          footerY + 5,
          { align: "center", width: 512 }
        );
        doc.text(
          `Generated on: ${new Date().toLocaleString()} | Page 1 of 1`,
          50,
          footerY + 15,
          { align: "center", width: 512 }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Helper method to add a section with title and fields
   */
  private addSection(
    doc: PDFKit.PDFDocument,
    title: string,
    fields: Array<{ label: string; value: string }>
  ) {
    doc.fontSize(11).fillColor("#0066cc").text(title);
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#333");

    fields.forEach((field) => {
      const y = doc.y;
      doc.text(`${field.label}:`, 50, y, { width: 150 });
      doc.fillColor("#555").text(field.value, 210, y, { width: 350 });
      doc.fillColor("#333");
      doc.moveDown(0.3);
    });

    doc.moveDown(0.7);
  }

  /**
   * Generate a professional Invoice PDF
   */
  async generateInvoicePDF(
    data: InvoiceData,
    organization: OrganizationBasicInfo
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "LETTER",
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Professional Header with Company Info
        doc.rect(40, 40, 512, 60).fill("#f8f9fa");
        doc.rect(40, 40, 512, 60).stroke("#dee2e6");

        // Company Name and Logo Area
        doc
          .fontSize(24)
          .fillColor("#1a365d")
          .text(organization.name || "TMS", 60, 55);
        doc
          .fontSize(10)
          .fillColor("#666")
          .text("TRANSPORTATION MANAGEMENT", 60, 80);

        // Document Title
        doc
          .fontSize(28)
          .fillColor("#2d3748")
          .text("INVOICE", { align: "center" });

        // Invoice details in header
        doc.fontSize(10).fillColor("#4a5568");
        doc.text(`Invoice #: ${data.invoiceNumber}`, 450, 55);
        doc.text(`Date: ${data.invoiceDate}`, 450, 70);
        doc.text(`Due: ${data.dueDate}`, 450, 85);

        doc.moveDown(3);

        // Bill To section
        this.addSection(doc, "BILL TO", [
          { label: "Company", value: data.customerName },
          { label: "Address", value: this.formatAddress(data.customerAddress) },
        ]);

        // Invoice line items table
        doc.fontSize(12).fillColor("#0066cc").text("INVOICE DETAILS");
        doc.moveDown(0.5);

        // Table header
        const tableY = doc.y;
        doc.fillColor("#f5f5f5").rect(50, tableY, 512, 25).fill();
        doc.fillColor("#333").fontSize(10);
        doc.text("Description", 60, tableY + 8);
        doc.text("Qty", 400, tableY + 8);
        doc.text("Rate", 450, tableY + 8);
        doc.text("Amount", 500, tableY + 8);

        // Table rows
        let currentY = tableY + 25;
        data.lineItems.forEach((item) => {
          doc.fillColor("#333").fontSize(9);
          doc.text(item.description, 60, currentY + 8, { width: 320 });
          doc.text(item.quantity.toString(), 400, currentY + 8);
          doc.text(`$${item.rate.toFixed(2)}`, 450, currentY + 8);
          doc.text(`$${item.amount.toFixed(2)}`, 500, currentY + 8);
          currentY += 20;
        });

        // Totals
        const totalsY = currentY + 10;
        doc.fillColor("#333").fontSize(10);
        doc.text("Subtotal:", 450, totalsY);
        doc.text(`$${data.subtotal.toFixed(2)}`, 500, totalsY);

        if (data.tax && data.tax > 0) {
          doc.text("Tax:", 450, totalsY + 15);
          doc.text(`$${data.tax.toFixed(2)}`, 500, totalsY + 15);
        }

        doc.fontSize(12).fillColor("#0066cc");
        doc.text("Total:", 450, totalsY + 35);
        doc.text(`$${data.total.toFixed(2)}`, 500, totalsY + 35);

        // Terms and notes
        if (data.notes) {
          doc.moveDown(2);
          doc.fontSize(11).fillColor("#0066cc").text("NOTES:");
          doc.fontSize(10).fillColor("#333").text(data.notes, { width: 500 });
        }

        doc.moveDown(1);
        doc.fontSize(11).fillColor("#0066cc").text("TERMS:");
        doc.fontSize(10).fillColor("#333").text(data.terms, { width: 500 });

        // Footer
        const pageHeight = doc.page.height;
        const footerY = pageHeight - 80;

        doc.fontSize(8).fillColor("#666");
        doc.text("Thank you for your business!", 50, footerY, {
          align: "center",
          width: 512,
        });
        doc.moveDown(0.5);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, {
          align: "center",
          width: 512,
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate a professional Proof of Delivery PDF
   */
  async generatePODPDF(
    data: any,
    organization: OrganizationBasicInfo
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "LETTER",
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Professional Header with Company Info
        doc.rect(40, 40, 512, 60).fill("#f8f9fa");
        doc.rect(40, 40, 512, 60).stroke("#dee2e6");

        // Company Name and Logo Area
        doc
          .fontSize(24)
          .fillColor("#1a365d")
          .text(organization.name || "TMS", 60, 55);
        doc
          .fontSize(10)
          .fillColor("#666")
          .text("TRANSPORTATION MANAGEMENT", 60, 80);

        // Document Title
        doc
          .fontSize(28)
          .fillColor("#2d3748")
          .text("PROOF OF DELIVERY", { align: "center" });

        // Document info in header
        doc.fontSize(10).fillColor("#4a5568");
        doc.text(`POD #: ${data.podNumber}`, 450, 55);
        doc.text(`Load #: ${data.loadNumber}`, 450, 70);
        doc.text(`Date: ${data.deliveryDate}`, 450, 85);

        doc.moveDown(3);

        // Delivery Information
        this.addSection(doc, "DELIVERY INFORMATION", [
          { label: "Consignee", value: data.consignee.name },
          {
            label: "Address",
            value: this.formatAddress(data.consignee.address),
          },
          { label: "Phone", value: data.consignee.phone },
          { label: "Date", value: data.deliveryDate },
          { label: "Time", value: data.deliveryTime || "As scheduled" },
        ]);

        // Carrier Information
        this.addSection(doc, "CARRIER INFORMATION", [
          { label: "Company", value: data.carrierName },
          { label: "MC Number", value: data.carrierMC },
        ]);

        // Load Details
        this.addSection(doc, "LOAD DETAILS", [
          { label: "Commodity", value: data.commodity },
          { label: "Weight", value: `${data.weight} lbs` },
          { label: "Pieces", value: data.pieces.toString() },
          { label: "Equipment Type", value: data.equipmentType },
        ]);

        // Special Instructions
        if (data.specialInstructions) {
          doc.fontSize(11).fillColor("#0066cc").text("SPECIAL INSTRUCTIONS:");
          doc
            .fontSize(10)
            .fillColor("#333")
            .text(data.specialInstructions, { width: 500 });
          doc.moveDown(1.5);
        }

        // Signature Section
        doc.moveDown(2);
        const sigY = doc.y;
        const sigWidth = 150;

        doc.fontSize(9).fillColor("#333");

        // Consignee Signature
        doc.text("CONSIGNEE SIGNATURE", 50, sigY);
        doc
          .moveTo(50, sigY + 50)
          .lineTo(50 + sigWidth, sigY + 50)
          .stroke();
        doc.fontSize(7).text("Date: __________", 50, sigY + 55);

        // Driver Signature
        doc.fontSize(9).text("DRIVER SIGNATURE", 230, sigY);
        doc
          .moveTo(230, sigY + 50)
          .lineTo(230 + sigWidth, sigY + 50)
          .stroke();
        doc.fontSize(7).text("Date: __________", 230, sigY + 55);

        // Footer
        const pageHeight = doc.page.height;
        const footerY = pageHeight - 80;

        doc.fontSize(8).fillColor("#666");
        doc.text(
          "This document serves as proof of delivery for the transportation of goods.",
          50,
          footerY,
          { align: "center", width: 512 }
        );
        doc.moveDown(0.5);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, {
          align: "center",
          width: 512,
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Format address for PDF display
   */
  private formatAddress(address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  }): string {
    const parts = [
      address.street,
      `${address.city}, ${address.state} ${address.zip}`,
    ];
    if (address.country && address.country !== "USA") {
      parts.push(address.country);
    }
    return parts.join("\n");
  }
}
