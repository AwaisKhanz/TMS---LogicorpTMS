import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { docusignApi } from '@/lib/docusign-api';
import { toast } from 'sonner';

// Hook to send rate confirmation for signature
export function useSendForSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (loadId: string) => docusignApi.sendForSignature(loadId),
    onSuccess: (_data, loadId) => {
      toast.success('Rate confirmation sent for signature successfully');
      // Invalidate load query to refresh data
      queryClient.invalidateQueries({ queryKey: ['load', loadId] });
      queryClient.invalidateQueries({ queryKey: ['signature-status', loadId] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to send for signature';
      toast.error(message);
    },
  });
}

// Hook to get signature status
export function useSignatureStatus(loadId: string) {
  return useQuery({
    queryKey: ['signature-status', loadId],
    queryFn: () => docusignApi.getSignatureStatus(loadId),
    enabled: !!loadId,
    refetchInterval: (query) => {
      // Poll every 10 seconds if status is 'sent' or 'delivered'
      const status = query.state.data?.data?.status;
      if (status === 'sent' || status === 'delivered') {
        return 10000; // 10 seconds
      }
      return false; // Don't poll if completed or not sent
    },
  });
}
