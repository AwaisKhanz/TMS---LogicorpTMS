// DocuSign API Methods
import { apiClient } from './api-client';

export const docusignApi = {
  // Send rate confirmation for signature
  async sendForSignature(loadId: string) {
    const response = await apiClient.post<any>(`/loads/${loadId}/send-for-signature`);
    return response.data;
  },

  // Get signature status
  async getSignatureStatus(loadId: string) {
    const response = await apiClient.get<any>(`/loads/${loadId}/signature-status`);
    return response.data;
  },
};
