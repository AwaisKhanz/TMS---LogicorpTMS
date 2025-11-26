"use client";

import { useSignatureStatus } from "@/hooks/use-docusign";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck, Clock, CheckCircle2, XCircle, FileText, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface SignatureStatusProps {
  loadId: string;
}

export function SignatureStatus({ loadId }: SignatureStatusProps) {
  const { data, isLoading } = useSignatureStatus(loadId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Signature Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.success || !data?.data) {
    return null;
  }

  const status = data.data.status;
  const sentAt = data.data.sentAt;
  const completedAt = data.data.completedAt;
  const signedDocumentUrl = data.data.signedDocumentUrl;

  // Don't show if not sent
  if (status === 'not_sent') {
    return null;
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending Signature
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Signed
          </Badge>
        );
      case 'declined':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Declined
          </Badge>
        );
      case 'voided':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Voided
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {status}
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileCheck className="h-4 w-4" />
          Rate Confirmation Signature
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status:</span>
          {getStatusBadge()}
        </div>

        {sentAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Sent:</span>
            <span className="text-sm font-medium">
              {format(new Date(sentAt), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
        )}

        {completedAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Completed:</span>
            <span className="text-sm font-medium">
              {format(new Date(completedAt), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
        )}

        {signedDocumentUrl && status === 'completed' && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            asChild
          >
            <a href={signedDocumentUrl} target="_blank" rel="noopener noreferrer">
              <FileText className="h-4 w-4 mr-2" />
              View Signed Document
              <ExternalLink className="h-3 w-3 ml-2" />
            </a>
          </Button>
        )}

        {(status === 'sent' || status === 'delivered') && (
          <p className="text-xs text-muted-foreground mt-2">
            Waiting for carrier to sign the rate confirmation...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
