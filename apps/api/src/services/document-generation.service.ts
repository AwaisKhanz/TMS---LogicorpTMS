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
      organization: { select: { name: true } },
      customer: true,
      carrier: true,
      loadShippers: { include: { shipper: true } },
      loadConsignees: { include: { consignee: true } },
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
    doc.moveDown(0.6);
    doc
      .fontSize(12)
      .fillColor("#111")
      .text(title.toUpperCase(), { bold: true });
    const y = doc.y + 2;
    doc.moveTo(36, y).lineTo(559, y).strokeColor("#DDD").stroke();
    doc.moveDown(0.4);
  };
}

function keyValue(doc: any, label: string, value?: string | number | null) {
  const val = value == null || value === "" ? "-" : String(value);
  doc.fontSize(10).fillColor("#333").text(`${label}: `, { continued: true });
  doc.fillColor("#000").text(val);
}

function keyValueGrid(
  doc: any,
  rows: Array<Array<[string, string | number | null | undefined]>>
) {
  const startX = 36;
  const colWidth = (559 - startX) / rows[0].length;
  rows.forEach((row) => {
    row.forEach(([k, v], idx) => {
      const x = startX + idx * colWidth;
      doc.save();
      doc.text("", x, doc.y);
      keyValue(doc, k, v as any);
      doc.restore();
    });
    doc.moveDown(0.2);
  });
}

function table(doc: any, headers: string[], rows: (string | number)[][]) {
  doc.moveDown(0.4);
  doc.fontSize(10).fillColor("#111").text(headers.join("   "));
  doc.moveDown(0.2);
  rows.forEach((r) => {
    doc.fillColor("#000").text(r.join("   "));
  });
}

async function createPdfBuffer(title: string, build: (doc: any) => void) {
  return await new Promise<PdfBuffer>((resolve, reject) => {
    const doc: any = new (PDFDocument as any)({ size: "A4", margin: 36 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc.fontSize(18).fillColor("#000").text(title, { align: "left" });
    doc.moveDown(0.25);
    doc.moveTo(36, doc.y).lineTo(559, doc.y).strokeColor("#000").stroke();
    doc.moveDown(0.5);

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
    const primaryShipper =
      load.loadShippers.find((s) => s.isPrimary) || load.loadShippers[0];
    const primaryConsignee =
      load.loadConsignees.find((c) => c.isPrimary) || load.loadConsignees[0];
    const terms = await getOrganizationDocumentTerms(_organizationId);

    return createPdfBuffer("Rate Confirmation", (doc) => {
      const title = sectionTitleFactory(doc);
      title(load.organization?.name || "");
      keyValueGrid(doc, [
        [
          ["Load Number", load.loadNumber],
          ["Status", load.status],
          ["Created", new Date(load.createdAt).toISOString().split("T")[0]],
        ],
      ]);

      title("Parties");
      keyValueGrid(doc, [
        [
          ["Customer", load.customer?.companyName],
          ["Carrier", load.carrier?.companyName],
        ],
        [
          [
            "Pickup",
            primaryShipper?.pickupDate
              ? primaryShipper.pickupDate.toISOString().split("T")[0]
              : "-",
          ],
          [
            "Delivery",
            primaryConsignee?.deliveryDate
              ? primaryConsignee.deliveryDate.toISOString().split("T")[0]
              : "-",
          ],
        ],
      ]);

      title("Rates");
      keyValueGrid(doc, [
        [
          ["Customer Rate", Number(load.customerRate).toFixed(2)],
          [
            "Carrier Rate",
            load.carrierRate ? Number(load.carrierRate).toFixed(2) : "-",
          ],
        ],
        [
          ["Equipment", load.equipmentType],
          ["Load Type", load.loadType],
        ],
      ]);

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

      if (terms.rateConfirmationTerms) {
        doc.moveDown(1);
        title("Terms & Conditions");
        doc.fontSize(10).fillColor("#000");
        const lines = terms.rateConfirmationTerms.split("\n");
        lines.forEach((line: string) => {
          doc.text(line || " ");
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
    const s =
      load.loadShippers.find((x) => x.isPrimary) || load.loadShippers[0];
    const c =
      load.loadConsignees.find((x) => x.isPrimary) || load.loadConsignees[0];
    const terms = await getOrganizationDocumentTerms(_organizationId);

    return createPdfBuffer("Bill of Lading", (doc) => {
      const title = sectionTitleFactory(doc);
      title(load.organization?.name || "");
      keyValueGrid(doc, [
        [
          ["Load Number", load.loadNumber],
          ["Commodity", load.commodity],
        ],
        [
          ["Weight", load.weight],
          ["Pieces", load.pieces ?? "-"],
        ],
      ]);

      title("Shipper");
      keyValueGrid(doc, [
        [
          ["Company", s?.shipper?.companyName],
          ["Phone", s?.shipper?.phone],
        ],
        [
          [
            "Address",
            s
              ? (() => {
                  const addr = s.shipper.address as any;
                  return `${addr?.street || ""}, ${addr?.city || ""}, ${addr?.state || ""} ${addr?.zip || ""}`;
                })()
              : "-",
          ],
          ["Pickup Date", s?.pickupDate?.toISOString().split("T")[0]],
        ],
      ]);

      title("Consignee");
      keyValueGrid(doc, [
        [
          ["Company", c?.consignee?.companyName],
          ["Phone", c?.consignee?.phone],
        ],
        [
          [
            "Address",
            c
              ? (() => {
                  const addr = c.consignee.address as any;
                  return `${addr?.street || ""}, ${addr?.city || ""}, ${addr?.state || ""} ${addr?.zip || ""}`;
                })()
              : "-",
          ],
          ["Delivery Date", c?.deliveryDate?.toISOString().split("T")[0]],
        ],
      ]);

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
    const carrierRate = Number(load.carrierRate || 0) || 0;
    const totalDue = customerRate + adjTotal;
    const terms = await getOrganizationDocumentTerms(_organizationId);

    return createPdfBuffer("Invoice", (doc) => {
      const title = sectionTitleFactory(doc);
      title(load.organization?.name || "");
      keyValueGrid(doc, [
        [
          ["Invoice For Load", load.loadNumber],
          ["Date", new Date().toISOString().split("T")[0]],
        ],
        [
          ["Bill To (Customer)", load.customer?.companyName],
          ["", ""],
        ],
      ]);

      title("Summary");
      keyValueGrid(doc, [
        [
          ["Customer Rate", customerRate.toFixed(2)],
          ["Carrier Cost", carrierRate ? carrierRate.toFixed(2) : "-"],
        ],
        [
          ["Adjustments", adjTotal.toFixed(2)],
          ["Total Due", totalDue.toFixed(2)],
        ],
      ]);

      if (Array.isArray(adjustments) && adjustments.length > 0) {
        title("Adjustments");
        table(
          doc,
          ["Category", "Side", "Amount", "Description"],
          adjustments.map((a: any) => [
            a.category || "-",
            a.side || "-",
            (Number(a.amount) || 0).toFixed(2),
            a.description || "",
          ])
        );
      }

      if (terms.invoiceTerms) {
        doc.moveDown(1);
        title("Terms & Conditions");
        doc.fontSize(10).fillColor("#000");
        const lines = terms.invoiceTerms.split("\n");
        lines.forEach((line: string) => {
          doc.text(line || " ");
        });
      }
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
        lineItems: { include: { load: true } },
        payments: true,
      },
    });
    if (!invoice) throw new Error("Invoice not found");

    const paid = Number(invoice.paidAmount || 0);
    const balance = Number(invoice.total) - paid;
    const terms = await getOrganizationDocumentTerms(_organizationId);
    return createPdfBuffer("Invoice", (doc) => {
      const title = sectionTitleFactory(doc);
      title("Invoice");
      keyValueGrid(doc, [
        [
          ["Invoice #", invoice.invoiceNumber],
          ["Date", new Date(invoice.invoiceDate).toISOString().split("T")[0]],
        ],
        [
          ["Customer", invoice.customer?.companyName],
          ["Total", Number(invoice.total).toFixed(2)],
        ],
        [
          ["Paid", paid.toFixed(2)],
          ["Balance", balance.toFixed(2)],
        ],
      ]);

      if (invoice.lineItems.length > 0) {
        title("Line Items");
        const rows = invoice.lineItems.map((li: any) => [
          li.description,
          String(li.quantity),
          Number(li.rate).toFixed(2),
          Number(li.amount).toFixed(2),
        ]);
        table(doc, ["Description", "Qty", "Rate", "Amount"], rows);
      }

      if (invoice.payments.length > 0) {
        title("Payments");
        const rows = invoice.payments.map((p: any) => [
          new Date(p.date).toISOString().split("T")[0],
          p.type,
          p.method,
          Number(p.amount).toFixed(2),
        ]);
        table(doc, ["Date", "Type", "Method", "Amount"], rows);
      }

      if (terms.invoiceTerms) {
        doc.moveDown(1);
        title("Terms & Conditions");
        doc.fontSize(10).fillColor("#000");
        const lines = terms.invoiceTerms.split("\n");
        lines.forEach((line: string) => {
          doc.text(line || " ");
        });
      }
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
