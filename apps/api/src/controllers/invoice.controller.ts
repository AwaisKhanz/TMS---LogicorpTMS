import { Request, Response, NextFunction } from "express";
import { InvoiceService } from "../services/invoice.service.js";
import { DocumentGenerationService } from "../services/document-generation.service.js";
import { DocumentService } from "../services/document.service.js";
import { DocumentType } from "@tms/shared-types";

const invoiceService = new InvoiceService();
const docGen = new DocumentGenerationService();
const documentService = new DocumentService();

export class InvoiceController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) throw new Error("Authentication required");
      const { page, limit, status, search } = req.query as any;
      const result = await invoiceService.list(req.auth.organizationId, {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        status,
        search,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) throw new Error("Authentication required");
      const invoice = await invoiceService.getById(
        req.params.id,
        req.auth.organizationId
      );
      res.json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  }

  async addPayment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) throw new Error("Authentication required");
      const payment = await invoiceService.addPayment(req.params.id, req.auth.organizationId, {
        type: req.body.type,
        amount: req.body.amount,
        method: req.body.method,
        date: req.body.date ? new Date(req.body.date) : undefined,
        reference: req.body.reference,
        notes: req.body.notes,
        userId: req.auth.userId,
      });
      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  async exportPdf(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) throw new Error("Authentication required");
      // Generate invoice PDF from invoice id and persist as Document under entityType=INVOICE
      const pdfBuffer = await docGen.generateInvoiceFromInvoiceId(
        req.params.id,
        req.auth.organizationId,
        req.auth.userId
      );
      const saved = await documentService.saveGeneratedDocument(
        req.auth.organizationId,
        "INVOICE",
        req.params.id,
        DocumentType.INVOICE,
        `Invoice-${req.params.id}`,
        pdfBuffer,
        req.auth.userId
      );
      res.status(201).json({ success: true, data: saved });
    } catch (error) {
      next(error);
    }
  }
}

export const invoiceController = new InvoiceController();


