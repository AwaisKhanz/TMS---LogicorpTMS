import PDFDocument from "pdfkit";
import type {
  RateConfirmationData,
  BOLData,
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

        // Header with organization name
        doc
          .fontSize(20)
          .fillColor("#0066cc")
          .text(organization.name || "TMS", { align: "center" });
        doc.moveDown(0.5);
        doc
          .fontSize(16)
          .fillColor("#333")
          .text("RATE CONFIRMATION", { align: "center" });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke("#0066cc");
        doc.moveDown(1);

        // Document info
        doc.fontSize(10).fillColor("#666");
        doc.text(`Load Number: ${data.loadNumber}`, 50, doc.y, {
          continued: true,
        });
        doc.text(`Date: ${new Date().toLocaleDateString()}`, {
          align: "right",
        });
        doc.moveDown(1.5);

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
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Header
        doc
          .fontSize(20)
          .fillColor("#0066cc")
          .text(organization.name || "TMS", { align: "center" });
        doc.moveDown(0.5);
        doc
          .fontSize(16)
          .fillColor("#333")
          .text("BILL OF LADING", { align: "center" });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke("#0066cc");
        doc.moveDown(1);

        // Document Numbers
        doc.fontSize(10).fillColor("#666");
        doc.text(`BOL Number: ${data.bolNumber}`, 50, doc.y, {
          continued: true,
        });
        doc.text(`Load Number: ${data.loadNumber}`, { align: "right" });
        doc.text(`Date: ${new Date().toLocaleDateString()}`, {
          align: "right",
        });
        doc.moveDown(1.5);

        // Three-column layout for shipper, consignee, carrier
        const startY = doc.y;
        const columnWidth = 170;

        // Shipper Column
        doc.fontSize(11).fillColor("#0066cc").text("SHIPPER", 50, startY);
        doc.fontSize(9).fillColor("#333");
        doc.text(data.shipper.name, 50, startY + 20, { width: columnWidth });
        doc.text(this.formatAddress(data.shipper.address), 50, doc.y + 3, {
          width: columnWidth,
        });
        doc.text(`Phone: ${data.shipper.phone}`, 50, doc.y + 3);

        // Consignee Column
        doc.fontSize(11).fillColor("#0066cc").text("CONSIGNEE", 230, startY);
        doc.fontSize(9).fillColor("#333");
        doc.text(data.consignee.name, 230, startY + 20, { width: columnWidth });
        doc.text(this.formatAddress(data.consignee.address), 230, doc.y + 3, {
          width: columnWidth,
        });
        doc.text(`Phone: ${data.consignee.phone}`, 230, doc.y + 3);

        // Carrier Column
        doc.fontSize(11).fillColor("#0066cc").text("CARRIER", 410, startY);
        doc.fontSize(9).fillColor("#333");
        doc.text(data.carrierName, 410, startY + 20, { width: columnWidth });
        doc.text(`MC: ${data.carrierMC}`, 410, doc.y + 3);
        if (data.driverName) {
          doc.text(`Driver: ${data.driverName}`, 410, doc.y + 3);
        }
        if (data.truckNumber) {
          doc.text(`Truck: ${data.truckNumber}`, 410, doc.y + 3);
        }
        if (data.trailerNumber) {
          doc.text(`Trailer: ${data.trailerNumber}`, 410, doc.y + 3);
        }

        // Move down past the tallest column
        doc.y = Math.max(doc.y, startY + 110);
        doc.moveDown(2);

        // Load Details
        this.addSection(doc, "LOAD DETAILS", [
          { label: "Commodity", value: data.commodity },
          { label: "Weight", value: `${data.weight} lbs` },
          { label: "Pieces", value: data.pieces.toString() },
          { label: "Equipment Type", value: data.equipmentType },
          {
            label: "Hazmat",
            value: data.hazmat ? "YES" : "NO",
          },
        ]);

        // Pickup Details
        this.addSection(doc, "PICKUP", [
          { label: "Date", value: data.pickupDate },
          {
            label: "Time",
            value: data.pickupTime || "As scheduled",
          },
        ]);

        // Delivery Details
        this.addSection(doc, "DELIVERY", [
          { label: "Date", value: data.deliveryDate },
          {
            label: "Time",
            value: data.deliveryTime || "As scheduled",
          },
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

        // Shipper Signature
        doc.text("SHIPPER SIGNATURE", 50, sigY);
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

        // Consignee Signature
        doc.fontSize(9).text("CONSIGNEE SIGNATURE", 410, sigY);
        doc
          .moveTo(410, sigY + 50)
          .lineTo(410 + sigWidth, sigY + 50)
          .stroke();
        doc.fontSize(7).text("Date: __________", 410, sigY + 55);

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
