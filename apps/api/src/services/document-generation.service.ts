import {
  LoadAnalytics,
  CarrierPerformanceReport,
  CustomerAnalytics,
  RevenueAnalysis,
  OperationalMetrics,
  TeamPerformance,
  FinancialSummary,
  ReportDashboard,
  ReportExportData,
} from "@tms/shared-types";
import PDFDocument from "pdfkit";

type PdfBuffer = Buffer;

async function getLoadById(loadId: string, organizationId: string) {
  const { default: prisma } = await import("../config/database.js");
  return prisma.load.findFirst({
    where: { id: loadId, organizationId, deletedAt: null },
    include: {
      organization: {
        select: {
          name: true,
          billingEmail: true,
          settings: true,
          address: true,
        },
      },
      customer: true,
      carrier: true,
      loadShippers: { include: { shipper: true } },
      loadConsignees: { include: { consignee: true } },
      assignee: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      creator: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
  });
}

async function getOrganizationDocumentTerms(organizationId: string) {
  const { default: prisma } = await import("../config/database.js");
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { settings: true },
  });
  const settings = (org?.settings as any) || {};
  return settings.documentTerms || {};
}

function sectionTitleFactory(doc: any) {
  return function section(title: string) {
    doc.moveDown(1.5);
    const startX = 36;
    const startY = doc.y;
    doc
      .fontSize(14)
      .fillColor("#1a1a1a")
      .text(title.toUpperCase(), startX, startY, { bold: true, align: "left" });
    const y = doc.y + 4;
    doc
      .moveTo(startX, y)
      .lineTo(559, y)
      .strokeColor("#333")
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.9);
  };
}

function keyValue(doc: any, label: string, value?: string | number | null) {
  const val = value == null || value === "" ? "-" : String(value);
  doc.fontSize(9.5).fillColor("#666").text(`${label}: `, { continued: true });
  doc.fontSize(10).fillColor("#1a1a1a").text(val);
}

function hasValue(value: string | number | null | undefined): boolean {
  if (value == null) return false;
  if (typeof value === "string" && (value.trim() === "" || value === "-"))
    return false;
  return true;
}

function filterKeyValueRows(
  rows: Array<Array<[string, string | number | null | undefined]>>
): Array<Array<[string, string | number | null | undefined]>> {
  return rows
    .map((row) => row.filter(([_, v]) => hasValue(v)))
    .filter((row) => row.length > 0);
}

function keyValueGrid(
  doc: any,
  rows: Array<Array<[string, string | number | null | undefined]>>
) {
  const filteredRows = filterKeyValueRows(rows);
  if (filteredRows.length === 0) return;

  const startX = 36;
  const maxCols = Math.max(...filteredRows.map((r) => r.length), 2);
  const colWidth = (559 - startX) / maxCols;

  filteredRows.forEach((row) => {
    row.forEach(([k, v], idx) => {
      const x = startX + idx * colWidth;
      doc.save();
      doc.text("", x, doc.y);
      keyValue(doc, k, v as any);
      doc.restore();
    });
    // Add more spacing between rows
    doc.moveDown(0.55);
  });
  doc.moveDown(0.4);
}

function table(doc: any, headers: string[], rows: (string | number)[][]) {
  doc.moveDown(0.7);
  const colWidths: number[] = [];
  const totalWidth = 523;
  const numCols = headers.length;
  const baseWidth = totalWidth / numCols;

  headers.forEach(() => {
    colWidths.push(baseWidth);
  });

  const startX = 36;
  let currentX = startX;

  headers.forEach((header, idx) => {
    doc.save();
    doc
      .fontSize(10)
      .fillColor("#1a1a1a")
      .text(header, currentX, doc.y, {
        width: colWidths[idx],
        align: idx === headers.length - 1 ? "right" : "left",
      });
    doc.restore();
    currentX += colWidths[idx];
  });

  doc.moveDown(0.4);
  doc
    .moveTo(startX, doc.y)
    .lineTo(startX + totalWidth, doc.y)
    .strokeColor("#ddd")
    .lineWidth(0.5)
    .stroke();
  doc.moveDown(0.4);

  rows.forEach((r) => {
    currentX = startX;
    r.forEach((cell, idx) => {
      doc.save();
      doc
        .fontSize(9.5)
        .fillColor("#333")
        .text(String(cell), currentX, doc.y, {
          width: colWidths[idx],
          align: idx === headers.length - 1 ? "right" : "left",
        });
      doc.restore();
      currentX += colWidths[idx];
    });
    doc.moveDown(0.35);
  });
  doc.moveDown(0.5);
}

type StopDetail = {
  type: "Pickup" | "Delivery";
  sequence: number;
  company?: string | null;
  phone?: string | null;
  contact?: string | null;
  address: string;
  scheduleType?: string | null;
  windowSummary: string;
  windowBegin?: string;
  windowEnd?: string;
  instructions?: string | null;
};

function normalizeAddress(address?: Record<string, string | null>) {
  if (!address) return "-";
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zip,
    address.country,
  ]
    .filter((part) => part && String(part).trim().length > 0)
    .join(", ");
  return parts || "-";
}

function formatDateValue(value?: Date | string | null) {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

function formatTimeValue(time?: string | null) {
  if (!time) return undefined;
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  if (Number.isNaN(hour)) return time;
  const meridiem = hour >= 12 ? "PM" : "AM";
  const normalizedHour = ((hour + 11) % 12) + 1;
  return `${String(normalizedHour).padStart(2, "0")}:${minuteStr ?? "00"} ${meridiem}`;
}

function formatDateTimeValue(
  date?: Date | string | null,
  time?: string | null
) {
  const datePart = formatDateValue(date);
  const timePart = formatTimeValue(time);
  if (!timePart || timePart === undefined || timePart === null) return datePart;
  if (datePart === "-") return timePart;
  return `${datePart} @ ${timePart}`;
}

function buildStops(load: any): StopDetail[] {
  const shipperStops = (load.loadShippers || []).map(
    (stop: any, index: number) => {
      const begin = formatDateTimeValue(stop.pickupDate, stop.pickupStart);
      const end = formatDateTimeValue(stop.pickupDate, stop.pickupEnd);
      return {
        type: "Pickup" as const,
        sequence: stop.sequence ?? index + 1,
        company: stop.shipper?.companyName,
        phone: stop.shipper?.phone,
        contact: stop.shipper?.contactPerson,
        address: normalizeAddress(stop.shipper?.address as any),
        scheduleType: stop.pickupType,
        windowSummary:
          begin !== "-" || end !== "-"
            ? `${begin}${end && end !== "-" ? ` - ${end}` : ""}`
            : "-",
        windowBegin: begin,
        windowEnd: end,
        instructions: stop.pickupNotes,
      };
    }
  );

  const consigneeStops = (load.loadConsignees || []).map(
    (stop: any, index: number) => {
      const begin = formatDateTimeValue(stop.deliveryDate, stop.deliveryStart);
      const end = formatDateTimeValue(stop.deliveryDate, stop.deliveryEnd);
      return {
        type: "Delivery" as const,
        sequence: stop.sequence ?? index + 1,
        company: stop.consignee?.companyName,
        phone: stop.consignee?.phone,
        contact: stop.consignee?.contactPerson,
        address: normalizeAddress(stop.consignee?.address as any),
        scheduleType: stop.deliveryType,
        windowSummary:
          begin !== "-" || end !== "-"
            ? `${begin}${end && end !== "-" ? ` - ${end}` : ""}`
            : "-",
        windowBegin: begin,
        windowEnd: end,
        instructions: stop.deliveryNotes,
      };
    }
  );

  const combined = [...shipperStops, ...consigneeStops].sort((a, b) => {
    if (a.type === b.type) {
      return (a.sequence ?? 0) - (b.sequence ?? 0);
    }
    return a.type === "Pickup" ? -1 : 1;
  });

  return combined.map((stop, index) => ({
    ...stop,
    windowSummary: stop.windowSummary === "-" ? "-" : stop.windowSummary,
    sequence: index + 1,
  }));
}

function collectInstructions(load: any) {
  const instructions: string[] = [];
  if (load.internalNotes) {
    instructions.push(load.internalNotes);
  }

  (load.loadShippers || []).forEach((stop: any, idx: number) => {
    if (stop.pickupNotes) {
      instructions.push(
        `Pickup ${idx + 1}: ${String(stop.pickupNotes).trim()}`
      );
    }
  });

  (load.loadConsignees || []).forEach((stop: any, idx: number) => {
    if (stop.deliveryNotes) {
      instructions.push(
        `Delivery ${idx + 1}: ${String(stop.deliveryNotes).trim()}`
      );
    }
  });

  return instructions.join("\n\n");
}

function getTemperatureSummary(load: any) {
  if (load.equipmentType !== "REEFER") {
    return "-";
  }
  const unit = load.temperatureUnit === "CELSIUS" ? "°C" : "°F";
  if (load.minTemperature != null && load.maxTemperature != null) {
    return `${load.minTemperature}${unit} - ${load.maxTemperature}${unit}`;
  }
  if (load.minTemperature != null) {
    return `${load.minTemperature}${unit}`;
  }
  if (load.maxTemperature != null) {
    return `${load.maxTemperature}${unit}`;
  }
  if (load.continuousTemperature != null) {
    return load.continuousTemperature ? `Continuous ${unit}` : "-";
  }
  return "-";
}

function parseAccessorials(value: unknown) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function sumAccessorials(value: unknown) {
  const accessorials = parseAccessorials(value);
  return accessorials.reduce(
    (total: number, acc: any) => total + (Number(acc?.amount) || 0),
    0
  );
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function getPrimaryContact(load: any) {
  const orgSettings = (load.organization?.settings || {}) as Record<
    string,
    unknown
  >;
  const person = load.assignee || load.creator;
  const name = person
    ? [person.firstName, person.lastName].filter(Boolean).join(" ").trim()
    : load.organization?.name;
  const email =
    person?.email ||
    (orgSettings.contactEmail as string | undefined) ||
    load.organization?.billingEmail;
  const phone =
    person?.phone ||
    (orgSettings.contactPhone as string | undefined) ||
    (orgSettings.phone as string | undefined);

  return {
    name: name || "-",
    email: email || "-",
    phone: phone || "-",
  };
}

function deriveInvoiceDate(source?: Date | string | null) {
  if (!source) return undefined;
  return formatDateValue(source);
}

function deriveDueDate(
  dateSource?: Date | string | null,
  paymentTerms?: string | null
) {
  if (!dateSource) return undefined;
  const baseDate = new Date(dateSource);
  if (Number.isNaN(baseDate.getTime())) return undefined;
  if (paymentTerms) {
    const match = paymentTerms.match(/(\d+)/);
    if (match) {
      const due = new Date(baseDate);
      due.setDate(due.getDate() + Number(match[1]));
      return formatDateValue(due);
    }
  }
  return formatDateValue(baseDate);
}

type InvoiceChargeRow = {
  description: string;
  rate: string;
  units: string;
  uom: string;
  amount: string;
};

type InvoiceRenderData = {
  organizationName: string;
  organizationAddress?: string;
  organizationContact?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  loadNumber?: string;
  orderNumber?: string;
  pickup?: { label: string; location: string };
  delivery?: { label: string; location: string };
  billToName?: string;
  billToAddress?: string;
  charges: InvoiceChargeRow[];
  totalCharges: string;
  balanceDue: string;
  notes?: string;
  remitTo?: string;
};

function renderInvoiceDocument(doc: any, data: InvoiceRenderData) {
  const title = sectionTitleFactory(doc);
  const startX = 36;
  const pageWidth = 523;
  const rightColumnX = 350;

  // Professional Header Section
  doc.moveDown(0.5);

  // Save Y position for right column alignment
  const headerStartY = doc.y;

  // Company Info (Left Column)
  const orgName = data.organizationName || "Invoice";
  doc
    .fontSize(20)
    .fillColor("#1a1a1a")
    .text(orgName, startX, doc.y, { bold: true });
  doc.moveDown(0.4);

  let leftColumnY = doc.y;
  if (data.organizationAddress) {
    doc
      .fontSize(10)
      .fillColor("#666")
      .text(data.organizationAddress, startX, leftColumnY);
    leftColumnY += 12;
  }
  if (data.organizationContact) {
    doc
      .fontSize(10)
      .fillColor("#666")
      .text(data.organizationContact, startX, leftColumnY);
    leftColumnY += 12;
  }

  // Invoice Details (Right Column)
  const invoiceDetails: string[] = [];
  if (data.invoiceNumber)
    invoiceDetails.push(`Invoice #: ${data.invoiceNumber}`);
  if (data.invoiceDate)
    invoiceDetails.push(`Invoice Date: ${data.invoiceDate}`);
  if (data.dueDate) invoiceDetails.push(`Due Date: ${data.dueDate}`);
  if (data.loadNumber) invoiceDetails.push(`Load Number: ${data.loadNumber}`);
  if (data.orderNumber)
    invoiceDetails.push(`Order Number: ${data.orderNumber}`);

  let rightColumnY = headerStartY;
  invoiceDetails.forEach((line) => {
    doc
      .fontSize(10)
      .fillColor("#1a1a1a")
      .text(line, rightColumnX, rightColumnY, { align: "right" });
    rightColumnY += 15;
  });

  // Set Y to the bottom of the taller column
  doc.y = Math.max(leftColumnY, rightColumnY) + 10;

  // Divider line
  doc.moveDown(1.2);
  doc
    .moveTo(startX, doc.y)
    .lineTo(startX + pageWidth, doc.y)
    .strokeColor("#ddd")
    .lineWidth(1)
    .stroke();
  doc.moveDown(1);

  // Bill To Section
  title("Bill To");
  if (data.billToName) {
    doc.fontSize(12).fillColor("#1a1a1a").text(data.billToName, { bold: true });
    doc.moveDown(0.4);
  }
  if (data.billToAddress) {
    doc.fontSize(10).fillColor("#666").text(data.billToAddress, {
      width: pageWidth,
      align: "left",
    });
    doc.moveDown(0.3);
  }

  // Pickup & Delivery Section
  if (data.pickup || data.delivery) {
    title("Pickup & Delivery");

    if (data.pickup) {
      doc
        .fontSize(11)
        .fillColor("#1a1a1a")
        .text(data.pickup.label, { bold: true });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor("#666").text(data.pickup.location, {
        width: pageWidth,
        align: "left",
      });
      doc.moveDown(0.5);
    }
    if (data.delivery) {
      doc
        .fontSize(11)
        .fillColor("#1a1a1a")
        .text(data.delivery.label, { bold: true });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor("#666").text(data.delivery.location, {
        width: pageWidth,
        align: "left",
      });
      doc.moveDown(0.3);
    }
  }

  // Charges Section with Professional Table
  if (data.charges.length > 0) {
    title("Charges");

    // Professional table with better styling
    doc.moveDown(0.5);
    const tableStartY = doc.y;
    const colWidths = [200, 90, 60, 80, 93]; // Description, Rate, Units, UOM, Amount
    const tableStartX = startX;

    // Table Header with background
    const headerY = tableStartY;
    doc.rect(tableStartX, headerY - 5, pageWidth, 20).fill("#f5f5f5");
    doc.rect(tableStartX, headerY - 5, pageWidth, 20).stroke("#ddd");

    let colX = tableStartX;
    const headers = ["Description", "Rate", "Units", "UOM", "Amount"];
    headers.forEach((header, idx) => {
      doc
        .fontSize(10)
        .fillColor("#1a1a1a")
        .text(header, colX + 5, headerY, {
          width: colWidths[idx] - 10,
          align: idx === 4 ? "right" : "left",
          bold: true,
        });
      colX += colWidths[idx];
    });

    // Table Rows
    let rowY = headerY + 20;
    data.charges.forEach((row, rowIdx) => {
      colX = tableStartX;
      [row.description, row.rate, row.units, row.uom, row.amount].forEach(
        (cell, idx) => {
          doc
            .fontSize(10)
            .fillColor("#333")
            .text(String(cell), colX + 5, rowY, {
              width: colWidths[idx] - 10,
              align: idx === 4 ? "right" : "left",
            });
          colX += colWidths[idx];
        }
      );

      // Row separator
      if (rowIdx < data.charges.length - 1) {
        doc
          .moveTo(tableStartX, rowY + 12)
          .lineTo(tableStartX + pageWidth, rowY + 12)
          .strokeColor("#f0f0f0")
          .lineWidth(0.5)
          .stroke();
      }
      rowY += 18;
    });

    // Bottom border
    doc
      .moveTo(tableStartX, rowY - 3)
      .lineTo(tableStartX + pageWidth, rowY - 3)
      .strokeColor("#ddd")
      .lineWidth(1)
      .stroke();

    doc.y = rowY + 10;

    // Totals Section
    doc.moveDown(0.6);
    const totalsX = tableStartX + pageWidth - 200;
    doc
      .fontSize(10)
      .fillColor("#666")
      .text("Total Charges:", totalsX, doc.y, { align: "right" });
    doc
      .fontSize(10)
      .fillColor("#1a1a1a")
      .text(data.totalCharges, { align: "right" });
    doc.moveDown(0.4);

    doc
      .fontSize(12)
      .fillColor("#1a1a1a")
      .text("Balance Due:", totalsX, doc.y, { align: "right", bold: true });
    doc
      .fontSize(12)
      .fillColor("#1a1a1a")
      .text(data.balanceDue, { align: "right", bold: true });
    doc.moveDown(0.5);
  }

  // Notes Section
  if (data.notes) {
    title("Notes");
    doc.fontSize(10).fillColor("#666").text(data.notes, {
      width: pageWidth,
      align: "left",
    });
    doc.moveDown(0.4);
  }

  // Remit To Section
  if (data.remitTo) {
    title("Remit To");
    doc.fontSize(10).fillColor("#666").text(data.remitTo, {
      width: pageWidth,
      align: "left",
    });
  }
}

async function createPdfBuffer(title: string, build: (doc: any) => void) {
  return await new Promise<PdfBuffer>((resolve, reject) => {
    const doc: any = new (PDFDocument as any)({ size: "A4", margin: 36 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Professional Header - only for documents that need a standard header
    // Rate Confirmation, BOL, and Invoice have custom headers in their build functions
    if (
      title !== "Rate Confirmation" &&
      title !== "Bill of Lading" &&
      title !== "Invoice"
    ) {
      doc.fontSize(18).fillColor("#000").text(title, { align: "left" });
      doc.moveDown(0.25);
      doc.moveTo(36, doc.y).lineTo(559, doc.y).strokeColor("#000").stroke();
      doc.moveDown(0.5);
    }

    build(doc);

    doc.end();
  });
}

export class DocumentGenerationService {
  async generateReportPdf(
    reportId: string,
    _reportName: string,
    _data:
      | LoadAnalytics
      | CarrierPerformanceReport
      | CustomerAnalytics
      | RevenueAnalysis
      | OperationalMetrics
      | TeamPerformance
      | FinancialSummary
      | ReportDashboard
      | ReportExportData,
    _organizationId: string,
    _userId: string
  ): Promise<string> {
    return `https://example.com/reports/${reportId}.pdf`;
  }

  async generateReportExcel(
    reportId: string,
    _reportName: string,
    _data:
      | LoadAnalytics
      | CarrierPerformanceReport
      | CustomerAnalytics
      | RevenueAnalysis
      | OperationalMetrics
      | TeamPerformance
      | FinancialSummary
      | ReportDashboard
      | ReportExportData,
    _organizationId: string,
    _userId: string
  ): Promise<string> {
    return `https://example.com/reports/${reportId}.xlsx`;
  }

  async generateReportCsv(
    reportId: string,
    _reportName: string,
    _data:
      | LoadAnalytics
      | CarrierPerformanceReport
      | CustomerAnalytics
      | RevenueAnalysis
      | OperationalMetrics
      | TeamPerformance
      | FinancialSummary
      | ReportDashboard
      | ReportExportData,
    _organizationId: string,
    _userId: string
  ): Promise<string> {
    return `https://example.com/reports/${reportId}.csv`;
  }

  async generateReportJson(
    reportId: string,
    _reportName: string,
    _data:
      | LoadAnalytics
      | CarrierPerformanceReport
      | CustomerAnalytics
      | RevenueAnalysis
      | OperationalMetrics
      | TeamPerformance
      | FinancialSummary
      | ReportDashboard
      | ReportExportData,
    _organizationId: string,
    _userId: string
  ): Promise<string> {
    return `https://example.com/reports/${reportId}.json`;
  }

  async generateRateConfirmation(
    loadId: string,
    _organizationId: string,
    _userId: string
  ): Promise<PdfBuffer> {
    const load = await getLoadById(loadId, _organizationId);
    if (!load) throw new Error("Load not found");
    const terms = await getOrganizationDocumentTerms(_organizationId);
    const stops = buildStops(load);
    const instructions = collectInstructions(load);
    const temperatureSummary = getTemperatureSummary(load);
    const contact = getPrimaryContact(load);
    const accessorialTotal = sumAccessorials(load.accessorials);
    const netLineHaul = Number(load.carrierRate) || 0;
    const totalCost = netLineHaul + accessorialTotal;
    const accessorials = parseAccessorials(load.accessorials);
    const createdDate = formatDateValue(load.createdAt);

    return createPdfBuffer("Rate Confirmation", (doc) => {
      const title = sectionTitleFactory(doc);

      // Document Title
      doc
        .fontSize(24)
        .fillColor("#1a1a1a")
        .text("RATE CONFIRMATION", { align: "center", bold: true });
      doc.moveDown(1);

      // Header with company name
      doc
        .fontSize(18)
        .fillColor("#1a1a1a")
        .text(load.organization?.name || "", { align: "center" });
      doc.moveDown(1.5);

      // Contact and Load Information Section
      title("Contact & Load Information");
      const contactInfoRows: Array<
        Array<[string, string | number | null | undefined]>
      > = [];

      // Build rows dynamically based on available data
      const contactRow: Array<[string, string | number | null | undefined]> =
        [];
      if (hasValue(contact.name)) contactRow.push(["Contact", contact.name]);
      if (hasValue(contact.email)) contactRow.push(["Email", contact.email]);
      if (contactRow.length > 0) contactInfoRows.push(contactRow);

      const contactRow2: Array<[string, string | number | null | undefined]> =
        [];
      if (hasValue(contact.phone)) contactRow2.push(["Phone", contact.phone]);
      if (hasValue(load.equipmentType))
        contactRow2.push(["Equipment Type", load.equipmentType]);
      if (contactRow2.length > 0) contactInfoRows.push(contactRow2);

      const weightRow: Array<[string, string | number | null | undefined]> = [];
      if (hasValue(load.weight))
        weightRow.push(["Total Weight", `${load.weight} lbs`]);
      if (weightRow.length > 0) contactInfoRows.push(weightRow);

      const tempRow: Array<[string, string | number | null | undefined]> = [];
      if (hasValue(temperatureSummary))
        tempRow.push(["Temperature", temperatureSummary]);
      if (hasValue(createdDate)) tempRow.push(["Load Date", createdDate]);
      if (tempRow.length > 0) contactInfoRows.push(tempRow);

      const tripRow: Array<[string, string | number | null | undefined]> = [];
      if (hasValue(load.loadNumber)) tripRow.push(["Trip #", load.loadNumber]);
      if (hasValue(load.referenceNumber))
        tripRow.push(["Order #", load.referenceNumber]);
      if (tripRow.length > 0) contactInfoRows.push(tripRow);

      if (contactInfoRows.length > 0) {
        keyValueGrid(doc, contactInfoRows);
      }

      // Carrier Fees Section
      title("Carrier Fees");
      keyValueGrid(doc, [
        [
          ["Net Line Haul", formatCurrency(netLineHaul)],
          ["Accessorial Charges", formatCurrency(accessorialTotal)],
        ],
        [
          ["Total Cost", formatCurrency(totalCost)],
          ["Carrier", load.carrier?.companyName || "-"],
        ],
      ]);

      // Accessorials Table
      if (accessorials.length > 0) {
        const validAccessorials = accessorials.filter(
          (item: any) =>
            hasValue(item.type) ||
            hasValue(item.description) ||
            Number(item.amount) > 0
        );
        if (validAccessorials.length > 0) {
          doc.moveDown(0.3);
          table(
            doc,
            ["Type", "Description", "Amount"],
            validAccessorials.map((item: any) => [
              item.type || "",
              item.description || "",
              formatCurrency(Number(item.amount) || 0),
            ])
          );
        }
      }

      // General Instructions Section
      title("General Instructions");
      if (instructions && instructions.trim()) {
        doc.fontSize(10).fillColor("#333").text(instructions, 36, doc.y, {
          width: 523,
          align: "left",
        });
        doc.moveDown(0.5);
      } else {
        doc
          .fontSize(10)
          .fillColor("#999")
          .text("No special instructions provided.", 36, doc.y, {
            align: "left",
          });
        doc.moveDown(0.5);
      }

      // Stop Details Section
      title("Stop Details");
      if (stops.length === 0) {
        doc
          .fontSize(10)
          .fillColor("#999")
          .text("No stop data provided.", 36, doc.y, {
            align: "left",
          });
      } else {
        stops.forEach((stop, index) => {
          if (index > 0) {
            doc.moveDown(1.2);
          }

          // Stop Header
          doc
            .fontSize(13)
            .fillColor("#1a1a1a")
            .text(
              `${stop.type === "Pickup" ? "Shipper" : "Consignee"} (Stop ${
                index + 1
              } of ${stops.length})`,
              36,
              doc.y,
              { bold: true, align: "left" }
            );
          doc.moveDown(0.7);

          // Stop Information Grid - build dynamically
          const stopInfoRows: Array<
            Array<[string, string | number | null | undefined]>
          > = [];

          const companyRow: Array<
            [string, string | number | null | undefined]
          > = [];
          if (hasValue(stop.company))
            companyRow.push(["Company", stop.company]);
          if (hasValue(stop.phone)) companyRow.push(["Phone", stop.phone]);
          if (companyRow.length > 0) stopInfoRows.push(companyRow);

          const addressRow: Array<
            [string, string | number | null | undefined]
          > = [];
          if (hasValue(stop.address))
            addressRow.push(["Address", stop.address]);
          if (hasValue(stop.contact))
            addressRow.push(["Contact", stop.contact]);
          if (addressRow.length > 0) stopInfoRows.push(addressRow);

          const loadingRow: Array<
            [string, string | number | null | undefined]
          > = [];
          if (hasValue(load.loadType))
            loadingRow.push(["Loading Type", load.loadType]);
          if (hasValue(stop.scheduleType))
            loadingRow.push(["Schedule Type", stop.scheduleType]);
          if (loadingRow.length > 0) stopInfoRows.push(loadingRow);

          const windowRow: Array<[string, string | number | null | undefined]> =
            [];
          if (hasValue(stop.windowBegin)) {
            windowRow.push([
              `${stop.type === "Pickup" ? "PU" : "DEL"} Window Begin`,
              stop.windowBegin,
            ]);
          }
          if (hasValue(stop.windowEnd)) {
            windowRow.push([
              `${stop.type === "Pickup" ? "PU" : "DEL"} Window End`,
              stop.windowEnd,
            ]);
          }
          if (windowRow.length > 0) stopInfoRows.push(windowRow);

          if (stopInfoRows.length > 0) {
            keyValueGrid(doc, stopInfoRows);
          }

          // Add spacing before commodity section
          doc.moveDown(0.3);

          // Commodity and Weight Information - build dynamically
          const commodityRows: Array<
            Array<[string, string | number | null | undefined]>
          > = [];

          const unitsRow: Array<[string, string | number | null | undefined]> =
            [];
          if (hasValue(load.pieces)) {
            unitsRow.push(["Units", `${load.pieces} Units`]);
            unitsRow.push(["Pieces", load.pieces]);
          }
          if (unitsRow.length > 0) commodityRows.push(unitsRow);

          const commodityRow: Array<
            [string, string | number | null | undefined]
          > = [];
          if (hasValue(load.commodity))
            commodityRow.push(["Commodity", load.commodity]);
          if (hasValue(load.weight))
            commodityRow.push(["Weight", `${load.weight} lbs`]);
          if (commodityRow.length > 0) commodityRows.push(commodityRow);

          const tempNotesRow: Array<
            [string, string | number | null | undefined]
          > = [];
          if (hasValue(temperatureSummary))
            tempNotesRow.push(["Temperature", temperatureSummary]);
          if (hasValue(stop.instructions))
            tempNotesRow.push(["Notes", stop.instructions]);
          if (tempNotesRow.length > 0) commodityRows.push(tempNotesRow);

          if (commodityRows.length > 0) {
            keyValueGrid(doc, commodityRows);
          }

          doc.moveDown(1);
        });
      }

      // Terms & Conditions Section
      if (terms.rateConfirmationTerms) {
        title("Terms & Conditions");
        doc.fontSize(10).fillColor("#333");
        const lines = terms.rateConfirmationTerms.split("\n");
        lines.forEach((line: string) => {
          if (line.trim()) {
            doc.text(line, { width: 523, align: "left" });
          } else {
            doc.moveDown(0.2);
          }
        });
      }
    });
  }

  async generateBOL(
    loadId: string,
    _organizationId: string,
    _userId: string
  ): Promise<PdfBuffer> {
    const load = await getLoadById(loadId, _organizationId);
    if (!load) throw new Error("Load not found");
    const terms = await getOrganizationDocumentTerms(_organizationId);
    const temperatureSummary = getTemperatureSummary(load);
    const driverContactName =
      load.driverName || load.carrier?.contactName || load.carrier?.companyName;
    const driverContactPhone =
      load.driverPhone || load.carrier?.contactPhone || load.carrier?.phone;
    const generalInstructions = collectInstructions(load);
    const stops = buildStops(load);

    return createPdfBuffer("Bill of Lading", (doc) => {
      const title = sectionTitleFactory(doc);
      // Header / Summary
      title(load.organization?.name || "");
      keyValueGrid(doc, [
        [
          ["Contact", driverContactName || "-"],
          ["Contact Phone", driverContactPhone || "-"],
        ],
        [
          ["Load Number", load.loadNumber],
          ["Equipment Type", load.equipmentType],
        ],
        [
          ["Total Weight", load.weight ? `${load.weight} lbs` : "-"],
          ["Pieces", load.pieces ?? "-"],
        ],
        [
          ["Total Miles", "-"],
          ["Temperature", temperatureSummary],
        ],
      ]);

      title("General Instructions");
      doc
        .fontSize(10)
        .fillColor("#000")
        .text(generalInstructions || "No special instructions provided.");

      if (load.carrier || load.driverName || load.truckNumber) {
        title("Carrier & Equipment");
        keyValueGrid(doc, [
          [
            ["Carrier", load.carrier?.companyName || "-"],
            ["MC #", load.carrier?.mcNumber || "-"],
          ],
          [
            ["Driver Name", load.driverName || "-"],
            ["Driver Phone", load.driverPhone || "-"],
          ],
          [
            ["Truck Number", load.truckNumber || "-"],
            ["Trailer Number", load.trailerNumber || "-"],
          ],
        ]);
      }

      if (stops.length > 0) {
        title("Stop Details");
        stops.forEach((stop, index) => {
          doc
            .fontSize(11)
            .fillColor("#111")
            .text(
              `${stop.type === "Pickup" ? "Shipper" : "Consignee"} (Stop ${
                index + 1
              } of ${stops.length})`
            );
          keyValueGrid(doc, [
            [
              ["Company", stop.company || "-"],
              ["Phone", stop.phone || "-"],
            ],
            [
              ["Address", stop.address],
              ["Schedule Window", stop.windowSummary || "-"],
            ],
            [
              ["Schedule Type", stop.scheduleType || "-"],
              ["Contact", stop.contact || "-"],
            ],
          ]);

          keyValueGrid(doc, [
            [
              ["Units", load.pieces ? `${load.pieces} Units` : "-"],
              ["Pieces", load.pieces ?? "-"],
            ],
            [
              ["Commodity", load.commodity || "-"],
              ["Weight", load.weight ? `${load.weight} lbs` : "-"],
            ],
            [
              ["Temperature", temperatureSummary],
              ["Notes", stop.instructions || "-"],
            ],
          ]);
          doc.moveDown(0.4);
        });
      }

      if (
        load.equipmentType === "REEFER" &&
        (load.minTemperature || load.maxTemperature)
      ) {
        title("Temperature Requirements");
        const tempInfo: Array<[string, string | number | null | undefined]> =
          [];
        if (load.minTemperature) {
          tempInfo.push([
            "Minimum",
            `${load.minTemperature}°${load.temperatureUnit === "CELSIUS" ? "C" : "F"}`,
          ] as [string, string]);
        }
        if (load.maxTemperature) {
          tempInfo.push([
            "Maximum",
            `${load.maxTemperature}°${load.temperatureUnit === "CELSIUS" ? "C" : "F"}`,
          ] as [string, string]);
        }
        if (load.temperatureUnit) {
          tempInfo.push(["Unit", load.temperatureUnit] as [string, string]);
        }
        if (load.continuousTemperature !== undefined) {
          tempInfo.push([
            "Continuous",
            load.continuousTemperature ? "Yes" : "No",
          ] as [string, string]);
        }
        if (tempInfo.length > 0) {
          keyValueGrid(doc, [tempInfo]);
        }
      }

      title("Signatures");
      doc
        .fontSize(10)
        .fillColor("#000")
        .text(
          "Pickup Signature: _____________________________    Date: __________"
        );
      doc.moveDown(0.4);
      doc.text(
        "Delivery Signature: ___________________________    Date: __________"
      );
      doc.moveDown(0.4);
      doc.text(
        "Notes: ____________________________________________________________"
      );

      if (terms.bolTerms) {
        doc.moveDown(1);
        title("Terms & Conditions");
        doc.fontSize(10).fillColor("#000");
        const lines = terms.bolTerms.split("\n");
        lines.forEach((line: string) => {
          doc.text(line || " ");
        });
      }
    });
  }

  async generateInvoice(
    loadId: string,
    _organizationId: string,
    _userId: string
  ): Promise<PdfBuffer> {
    const load = await getLoadById(loadId, _organizationId);
    if (!load) throw new Error("Load not found");
    const adjustments = (load as any).financialAdjustments || [];
    const adjTotal = Array.isArray(adjustments)
      ? adjustments.reduce(
          (sum: number, a: any) => sum + (Number(a.amount) || 0),
          0
        )
      : 0;
    const customerRate = Number(load.customerRate) || 0;
    const totalDue = customerRate + adjTotal;
    const terms = await getOrganizationDocumentTerms(_organizationId);
    const billToAddress = normalizeAddress(
      load.customer?.billingAddress as any
    );
    const organizationAddress = normalizeAddress(
      load.organization?.address as any
    );
    const primaryPickup =
      load.loadShippers.find((s: any) => s.isPrimary) || load.loadShippers[0];
    const primaryDelivery =
      load.loadConsignees.find((c: any) => c.isPrimary) ||
      load.loadConsignees[0];
    const pickupLocation = primaryPickup
      ? [
          primaryPickup.shipper?.companyName,
          normalizeAddress(primaryPickup.shipper?.address as any),
          formatDateTimeValue(
            primaryPickup.pickupDate,
            primaryPickup.pickupStart
          ),
        ]
          .filter((value) => value && value !== "-")
          .join("\n")
      : undefined;
    const deliveryLocation = primaryDelivery
      ? [
          primaryDelivery.consignee?.companyName,
          normalizeAddress(primaryDelivery.consignee?.address as any),
          formatDateTimeValue(
            primaryDelivery.deliveryDate,
            primaryDelivery.deliveryStart
          ),
        ]
          .filter((value) => value && value !== "-")
          .join("\n")
      : undefined;

    const invoiceDateSource =
      load.invoicedAt ||
      load.deliveredAt ||
      load.updatedAt ||
      load.createdAt ||
      null;
    const invoiceDateFormatted = deriveInvoiceDate(invoiceDateSource);
    const dueDateFormatted = deriveDueDate(
      invoiceDateSource,
      load.customer?.paymentTerms
    );

    const charges: InvoiceChargeRow[] = [
      {
        description: "Linehaul",
        rate: formatCurrency(customerRate),
        units:
          load.pieces != null
            ? String(load.pieces)
            : load.weight != null
              ? String(load.weight)
              : "",
        uom: load.loadType || load.equipmentType || "",
        amount: formatCurrency(customerRate),
      },
    ];

    if (Array.isArray(adjustments) && adjustments.length > 0) {
      adjustments.forEach((adj: any) => {
        charges.push({
          description: adj.category || adj.description || "Adjustment",
          rate: formatCurrency(Number(adj.amount) || 0),
          units:
            adj.unit != null
              ? String(adj.unit)
              : adj.quantity != null
                ? String(adj.quantity)
                : "",
          uom: adj.side || "",
          amount: formatCurrency(Number(adj.amount) || 0),
        });
      });
    }

    const notes = [load.internalNotes, terms.invoiceTerms]
      .filter((value): value is string => Boolean(value && value.trim()))
      .join("\n\n");
    const remitTo = [
      load.organization?.name,
      organizationAddress,
      load.organization?.billingEmail
        ? `Email: ${load.organization?.billingEmail}`
        : undefined,
    ]
      .filter((value) => value && value !== "-")
      .join("\n");

    return createPdfBuffer("Invoice", (doc) => {
      renderInvoiceDocument(doc, {
        organizationName: load.organization?.name || "Invoice",
        organizationAddress,
        organizationContact: load.organization?.billingEmail
          ? `Accounting: ${load.organization?.billingEmail}`
          : undefined,
        invoiceNumber: load.loadNumber,
        invoiceDate: invoiceDateFormatted,
        dueDate: dueDateFormatted,
        loadNumber: load.loadNumber,
        orderNumber: load.referenceNumber || undefined,
        billToName: load.customer?.companyName,
        billToAddress:
          billToAddress && billToAddress !== "-" ? billToAddress : undefined,
        pickup: pickupLocation
          ? { label: "Pickup 1", location: pickupLocation }
          : undefined,
        delivery: deliveryLocation
          ? { label: "Delivery 1", location: deliveryLocation }
          : undefined,
        charges,
        totalCharges: formatCurrency(totalDue),
        balanceDue: formatCurrency(totalDue),
        notes,
        remitTo,
      });
    });
  }

  // Generate invoice PDF from invoice id (for exporting invoices)
  async generateInvoiceFromInvoiceId(
    invoiceId: string,
    _organizationId: string,
    _userId: string
  ): Promise<PdfBuffer> {
    const { default: prisma } = await import("../config/database.js");
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: _organizationId },
      include: {
        customer: true,
        carrier: true,
        organization: {
          select: {
            name: true,
            address: true,
            billingEmail: true,
          },
        },
        lineItems: {
          include: {
            load: {
              include: {
                loadShippers: { include: { shipper: true } },
                loadConsignees: { include: { consignee: true } },
              },
            },
          },
        },
        payments: true,
      },
    });
    if (!invoice) throw new Error("Invoice not found");

    const paid = Number(invoice.paidAmount || 0);
    const balance = Number(invoice.total) - paid;
    const terms = await getOrganizationDocumentTerms(_organizationId);
    const organizationAddress = normalizeAddress(
      invoice.organization?.address as any
    );
    const billToAddress = normalizeAddress(
      invoice.customer?.billingAddress as any
    );
    const lineItems = invoice.lineItems.length
      ? invoice.lineItems
      : [
          {
            description: "Services",
            quantity: 1,
            rate: invoice.total,
            amount: invoice.total,
          },
        ];
    const charges: InvoiceChargeRow[] = lineItems.map((li: any) => ({
      description: li.description || "Line Item",
      rate: formatCurrency(Number(li.rate) || 0),
      units: li.quantity != null ? String(li.quantity) : "",
      uom: li.load?.loadType || "",
      amount: formatCurrency(Number(li.amount) || 0),
    }));
    const associatedLoad = invoice.lineItems.find((li: any) => li.load)?.load;
    const pickupStop =
      associatedLoad?.loadShippers?.find((s: any) => s.isPrimary) ||
      associatedLoad?.loadShippers?.[0];
    const deliveryStop =
      associatedLoad?.loadConsignees?.find((c: any) => c.isPrimary) ||
      associatedLoad?.loadConsignees?.[0];

    const pickupLocation = pickupStop
      ? [
          pickupStop.shipper?.companyName,
          normalizeAddress(pickupStop.shipper?.address as any),
          formatDateTimeValue(pickupStop.pickupDate, pickupStop.pickupStart),
        ]
          .filter((value) => value && value !== "-")
          .join("\n")
      : undefined;
    const deliveryLocation = deliveryStop
      ? [
          deliveryStop.consignee?.companyName,
          normalizeAddress(deliveryStop.consignee?.address as any),
          formatDateTimeValue(
            deliveryStop.deliveryDate,
            deliveryStop.deliveryStart
          ),
        ]
          .filter((value) => value && value !== "-")
          .join("\n")
      : undefined;

    const notes = [invoice.notes, terms.invoiceTerms]
      .filter((value): value is string => Boolean(value && value.trim()))
      .join("\n\n");
    const remitTo = [
      invoice.organization?.name,
      organizationAddress,
      invoice.organization?.billingEmail
        ? `Email: ${invoice.organization?.billingEmail}`
        : undefined,
    ]
      .filter((value) => value && value !== "-")
      .join("\n");

    return createPdfBuffer("Invoice", (doc) => {
      renderInvoiceDocument(doc, {
        organizationName: invoice.organization?.name || "Invoice",
        organizationAddress,
        organizationContact: invoice.organization?.billingEmail
          ? `Accounting: ${invoice.organization?.billingEmail}`
          : undefined,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: formatDateValue(invoice.invoiceDate),
        dueDate: formatDateValue(invoice.dueDate),
        loadNumber: associatedLoad?.loadNumber,
        orderNumber: associatedLoad?.referenceNumber || undefined,
        billToName: invoice.customer?.companyName,
        billToAddress:
          billToAddress && billToAddress !== "-" ? billToAddress : undefined,
        pickup: pickupLocation
          ? { label: "Pickup 1", location: pickupLocation }
          : undefined,
        delivery: deliveryLocation
          ? { label: "Delivery 1", location: deliveryLocation }
          : undefined,
        charges,
        totalCharges: formatCurrency(Number(invoice.total) || 0),
        balanceDue: formatCurrency(balance),
        notes,
        remitTo,
      });
    });
  }
  async generatePOD(
    loadId: string,
    _organizationId: string,
    _userId: string
  ): Promise<PdfBuffer> {
    const load = await getLoadById(loadId, _organizationId);
    if (!load) throw new Error("Load not found");
    const c =
      load.loadConsignees.find((x) => x.isPrimary) || load.loadConsignees[0];

    return createPdfBuffer("Proof of Delivery", (doc) => {
      const title = sectionTitleFactory(doc);
      title(load.organization?.name || "");
      keyValueGrid(doc, [
        [
          ["Load Number", load.loadNumber],
          ["Delivered On", new Date().toISOString().split("T")[0]],
        ],
        [
          ["Delivered To", load.customer?.companyName],
          ["Consignee", c?.consignee?.companyName],
        ],
      ]);

      title("Notes");
      doc
        .fontSize(10)
        .fillColor("#000")
        .text("Signature: __________________________");
      doc.moveDown(0.6);
      doc.text("Printed Name: ______________________");
      doc.moveDown(0.6);
      doc.text("Date: ______________________________");
    });
  }
}
