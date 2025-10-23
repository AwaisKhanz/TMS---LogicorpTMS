import {
  RateConfirmationData,
  BOLData,
  InvoiceData,
  OrganizationBasicInfo,
} from "../types/document.types.js";
import type { Address } from "../types/common.types.js";
import prisma from "../config/database.js";
import fs from "fs/promises";
import { storageService, generateFileKey } from "./storage.service.js";
import { logger } from "../config/logger.js";
import { PDFGeneratorService } from "./pdf-generator.service.js";

export class DocumentGenerationService {
  private outputDir = process.env.UPLOADS_DIR || "uploads";
  private pdfGenerator: PDFGeneratorService;

  constructor() {
    this.ensureOutputDirectory();
    this.pdfGenerator = new PDFGeneratorService();
  }

  private async ensureOutputDirectory() {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
    }
  }

  async generateRateConfirmation(
    loadId: string,
    organizationId: string,
    userId: string
  ) {
    // Fetch load data
    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        organizationId,
        deletedAt: null,
      },
      include: {
        customer: true,
        carrier: true,
        organization: true,
      },
    });

    if (!load) {
      throw new Error("Load not found");
    }

    if (!load.carrier) {
      throw new Error(
        "Load must have a carrier assigned to generate rate confirmation"
      );
    }

    // Parse JSON address fields
    const shipperAddress = load.shipperAddress as Address;
    const consigneeAddress = load.consigneeAddress as Address;
    const customerAddress = load.customer.billingAddress as Address;

    const data: RateConfirmationData = {
      loadId: load.id,
      loadNumber: load.loadNumber,
      customerName: load.customer.companyName,
      customerAddress,
      carrierName: load.carrier.companyName,
      carrierMC: load.carrier.mcNumber,
      pickupDate: load.pickupDate.toISOString().split("T")[0],
      deliveryDate: load.deliveryDate.toISOString().split("T")[0],
      shipper: {
        name: load.shipperName,
        address: shipperAddress,
        phone: load.shipperPhone,
      },
      consignee: {
        name: load.consigneeName,
        address: consigneeAddress,
        phone: load.consigneePhone,
      },
      commodity: load.commodity,
      weight: load.weight,
      equipmentType: load.equipmentType,
      customerRate: Number(load.customerRate),
      carrierRate: Number(load.carrierRate || 0),
      pickupInstructions: load.pickupNotes || undefined,
      deliveryInstructions: load.deliveryNotes || undefined,
    };

    // Generate PDF content
    const orgInfo: OrganizationBasicInfo = {
      name: load.organization.name,
      address: load.organization.address as Address,
      phone: undefined,
      email: load.organization.billingEmail || undefined,
      logo: load.organization.logo,
    };
    const pdfBuffer = await this.pdfGenerator.generateRateConfirmationPDF(
      data,
      orgInfo
    );
    const fileName = `rate-confirmation-${load.loadNumber}.pdf`;

    // Generate file key for storage
    const fileKey = generateFileKey(organizationId, "LOAD", loadId, fileName);

    // Create mock file for storage service
    const mockFile = {
      fieldname: "file",
      originalname: fileName,
      encoding: "7bit",
      mimetype: "application/pdf",
      buffer: pdfBuffer,
      size: pdfBuffer.length,
      stream: null,
      destination: "",
      filename: "",
      path: "",
    };

    // Upload to storage service
    const uploadResult = await storageService.upload(mockFile, fileKey, {
      contentType: "application/pdf",
      metadata: {
        entityType: "LOAD",
        entityId: loadId,
        uploadedBy: userId,
        generated: "true",
      },
    });

    logger.info(
      `Rate Confirmation generated: ${fileKey} -> ${uploadResult.url}`
    );

    // Create document record
    const document = await prisma.document.create({
      data: {
        organizationId,
        entityType: "LOAD",
        entityId: loadId,
        type: "RATE_CONFIRMATION",
        name: `Rate Confirmation - ${load.loadNumber}`,
        fileUrl: uploadResult.url,
        fileSize: uploadResult.size,
        mimeType: uploadResult.mimetype,
        uploadedBy: userId,
      },
    });

    return document;
  }

  async generateBOL(loadId: string, organizationId: string, userId: string) {
    // Fetch load data
    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        organizationId,
        deletedAt: null,
      },
      include: {
        carrier: true,
        organization: true,
      },
    });

    if (!load) {
      throw new Error("Load not found");
    }

    if (!load.carrier) {
      throw new Error("Load must have a carrier assigned to generate BOL");
    }

    // Parse JSON address fields
    const shipperAddress = load.shipperAddress as Address;
    const consigneeAddress = load.consigneeAddress as Address;

    const data: BOLData = {
      loadId: load.id,
      loadNumber: load.loadNumber,
      bolNumber: load.loadNumber, // Use load number as BOL number
      shipper: {
        name: load.shipperName,
        address: shipperAddress,
        phone: load.shipperPhone,
      },
      consignee: {
        name: load.consigneeName,
        address: consigneeAddress,
        phone: load.consigneePhone,
      },
      carrierName: load.carrier.companyName,
      carrierMC: load.carrier.mcNumber,
      driverName: undefined, // TODO: Add driver info to load model
      truckNumber: undefined, // TODO: Add truck info to load model
      trailerNumber: undefined, // TODO: Add trailer info to load model
      commodity: load.commodity,
      weight: load.weight,
      pieces: load.pieces || 1,
      equipmentType: load.equipmentType,
      pickupDate: load.pickupDate.toISOString().split("T")[0],
      pickupTime: load.pickupStart,
      deliveryDate: load.deliveryDate.toISOString().split("T")[0],
      deliveryTime: load.deliveryStart,
      specialInstructions: load.internalNotes || undefined,
      hazmat: false, // TODO: Add hazmat field to load model
    };

    // Generate PDF content
    const orgInfo: OrganizationBasicInfo = {
      name: load.organization.name,
      address: load.organization.address as Address,
      phone: undefined,
      email: load.organization.billingEmail || undefined,
      logo: load.organization.logo,
    };
    const pdfBuffer = await this.pdfGenerator.generateBOLPDF(data, orgInfo);
    const fileName = `bol-${load.loadNumber}.pdf`;

    // Generate file key for storage
    const fileKey = generateFileKey(organizationId, "LOAD", loadId, fileName);

    // Create mock file for storage service
    const mockFile = {
      fieldname: "file",
      originalname: fileName,
      encoding: "7bit",
      mimetype: "application/pdf",
      buffer: pdfBuffer,
      size: pdfBuffer.length,
      stream: null,
      destination: "",
      filename: "",
      path: "",
    };

    // Upload to storage service
    const uploadResult = await storageService.upload(mockFile, fileKey, {
      contentType: "application/pdf",
      metadata: {
        entityType: "LOAD",
        entityId: loadId,
        uploadedBy: userId,
        generated: "true",
      },
    });

    logger.info(`BOL generated: ${fileKey} -> ${uploadResult.url}`);

    // Create document record
    const document = await prisma.document.create({
      data: {
        organizationId,
        entityType: "LOAD",
        entityId: loadId,
        type: "BOL",
        name: `Bill of Lading - ${load.loadNumber}`,
        fileUrl: uploadResult.url,
        fileSize: uploadResult.size,
        mimeType: uploadResult.mimetype,
        uploadedBy: userId,
      },
    });

    return document;
  }

  async generateInvoice(
    loadId: string,
    organizationId: string,
    userId: string
  ) {
    // Fetch load data with customer info
    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        organizationId,
        deletedAt: null,
      },
      include: {
        customer: true,
        carrier: true,
        organization: true,
      },
    });

    if (!load) {
      throw new Error("Load not found");
    }

    // Parse JSON address fields
    const customerAddress = load.customer.billingAddress as Address;

    const data: InvoiceData = {
      loadId: load.id,
      loadNumber: load.loadNumber,
      invoiceNumber: await this.generateInvoiceNumber(organizationId),
      customerName: load.customer.companyName,
      customerAddress,
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 30 days from now
      terms: "NET30",
      lineItems: [
        {
          description: `Transportation services for Load ${load.loadNumber}`,
          quantity: 1,
          rate: Number(load.customerRate),
          amount: Number(load.customerRate),
        },
      ],
      subtotal: Number(load.customerRate),
      tax: 0, // TODO: Add tax calculation
      total: Number(load.customerRate),
      notes: load.internalNotes || undefined,
    };

    // Generate PDF content
    const orgInfo: OrganizationBasicInfo = {
      name: load.organization.name,
      address: load.organization.address as Address,
      phone: undefined,
      email: load.organization.billingEmail || undefined,
      logo: load.organization.logo,
    };
    const pdfBuffer = await this.pdfGenerator.generateInvoicePDF(data, orgInfo);
    const fileName = `invoice-${data.invoiceNumber}.pdf`;

    // Generate file key for storage
    const fileKey = generateFileKey(organizationId, "LOAD", loadId, fileName);

    // Create mock file for storage service
    const mockFile = {
      fieldname: "file",
      originalname: fileName,
      encoding: "7bit",
      mimetype: "application/pdf",
      buffer: pdfBuffer,
      size: pdfBuffer.length,
      stream: null,
      destination: "",
      filename: "",
      path: "",
    };

    // Upload to storage service
    const uploadResult = await storageService.upload(mockFile, fileKey, {
      contentType: "application/pdf",
      metadata: {
        entityType: "LOAD",
        entityId: loadId,
        uploadedBy: userId,
        generated: "true",
      },
    });

    logger.info(`Invoice generated: ${fileKey} -> ${uploadResult.url}`);

    // Create document record
    const document = await prisma.document.create({
      data: {
        organizationId,
        entityType: "LOAD",
        entityId: loadId,
        type: "INVOICE",
        name: `Invoice - ${data.invoiceNumber}`,
        fileUrl: uploadResult.url,
        fileSize: uploadResult.size,
        mimeType: uploadResult.mimetype,
        uploadedBy: userId,
      },
    });

    return document;
  }

  async generatePOD(loadId: string, organizationId: string, userId: string) {
    // Fetch load data
    const load = await prisma.load.findFirst({
      where: {
        id: loadId,
        organizationId,
        deletedAt: null,
      },
      include: {
        carrier: true,
        organization: true,
      },
    });

    if (!load) {
      throw new Error("Load not found");
    }

    if (!load.carrier) {
      throw new Error("Load must have a carrier assigned to generate POD");
    }

    // Parse JSON address fields
    const consigneeAddress = load.consigneeAddress as Address;

    const data = {
      loadId: load.id,
      loadNumber: load.loadNumber,
      podNumber: await this.generatePODNumber(organizationId),
      consignee: {
        name: load.consigneeName,
        address: consigneeAddress,
        phone: load.consigneePhone,
      },
      carrierName: load.carrier.companyName,
      carrierMC: load.carrier.mcNumber,
      commodity: load.commodity,
      weight: load.weight,
      pieces: load.pieces || 1,
      equipmentType: load.equipmentType,
      deliveryDate: load.deliveryDate.toISOString().split("T")[0],
      deliveryTime: load.deliveryStart,
      specialInstructions: load.deliveryNotes || undefined,
    };

    // Generate PDF content
    const orgInfo: OrganizationBasicInfo = {
      name: load.organization.name,
      address: load.organization.address as Address,
      phone: undefined,
      email: load.organization.billingEmail || undefined,
      logo: load.organization.logo,
    };
    const pdfBuffer = await this.pdfGenerator.generatePODPDF(data, orgInfo);
    const fileName = `pod-${data.podNumber}.pdf`;

    // Generate file key for storage
    const fileKey = generateFileKey(organizationId, "LOAD", loadId, fileName);

    // Create mock file for storage service
    const mockFile = {
      fieldname: "file",
      originalname: fileName,
      encoding: "7bit",
      mimetype: "application/pdf",
      buffer: pdfBuffer,
      size: pdfBuffer.length,
      stream: null,
      destination: "",
      filename: "",
      path: "",
    };

    // Upload to storage service
    const uploadResult = await storageService.upload(mockFile, fileKey, {
      contentType: "application/pdf",
      metadata: {
        entityType: "LOAD",
        entityId: loadId,
        uploadedBy: userId,
        generated: "true",
      },
    });

    logger.info(`POD generated: ${fileKey} -> ${uploadResult.url}`);

    // Create document record
    const document = await prisma.document.create({
      data: {
        organizationId,
        entityType: "LOAD",
        entityId: loadId,
        type: "POD",
        name: `Proof of Delivery - ${data.podNumber}`,
        fileUrl: uploadResult.url,
        fileSize: uploadResult.size,
        mimeType: uploadResult.mimetype,
        uploadedBy: userId,
      },
    });

    return document;
  }

  private async generateInvoiceNumber(organizationId: string): Promise<string> {
    // Get organization settings for invoice numbering
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { documentNumbering: true },
    });

    const settings = (org?.documentNumbering as any) || {};
    const invoiceSettings = settings.INVOICE || {
      prefix: "INV",
      startNumber: 1,
      currentNumber: 0,
    };

    // Get next number
    const nextNumber = invoiceSettings.currentNumber + 1;
    const invoiceNumber = `${invoiceSettings.prefix}${nextNumber.toString().padStart(4, "0")}`;

    // Update current number in organization settings
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        documentNumbering: {
          ...settings,
          INVOICE: {
            ...invoiceSettings,
            currentNumber: nextNumber,
          },
        },
      },
    });

    return invoiceNumber;
  }

  private async generatePODNumber(organizationId: string): Promise<string> {
    // Get organization settings for POD numbering
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { documentNumbering: true },
    });

    const settings = (org?.documentNumbering as any) || {};
    const podSettings = settings.POD || {
      prefix: "POD",
      startNumber: 1,
      currentNumber: 0,
    };

    // Get next number
    const nextNumber = podSettings.currentNumber + 1;
    const podNumber = `${podSettings.prefix}${nextNumber.toString().padStart(4, "0")}`;

    // Update current number in organization settings
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        documentNumbering: {
          ...settings,
          POD: {
            ...podSettings,
            currentNumber: nextNumber,
          },
        },
      },
    });

    return podNumber;
  }
}
