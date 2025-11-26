// DocuSign Integration Types

export interface DocuSignEnvelopeRequest {
  loadId: string;
}

export interface DocuSignEnvelopeResponse {
  envelopeId: string;
  status: string;
  uri: string;
  sentTo: string;
}

export interface DocuSignSignatureStatus {
  envelopeId?: string;
  status: string;
  sentAt?: Date;
  completedAt?: Date;
  signedDocumentUrl?: string;
  message?: string;
}

export interface DocuSignWebhookPayload {
  event: string;
  apiVersion: string;
  uri: string;
  data: {
    accountId: string;
    userId: string;
    envelopeSummary: {
      envelopeId: string;
      status: string;
      emailSubject: string;
      completedDateTime?: string;
      sentDateTime?: string;
      deliveredDateTime?: string;
      declinedDateTime?: string;
      voidedDateTime?: string;
    };
  };
}

export type DocuSignEnvelopeStatus =
  | 'created'
  | 'sent'
  | 'delivered'
  | 'signed'
  | 'completed'
  | 'declined'
  | 'voided'
  | 'deleted';
