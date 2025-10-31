"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";

type Props = {
  docs: any[];
  loadDocs: any[] | undefined;
  file: File | null;
  setFile: (f: File | null) => void;
  onUpload: () => void;
  uploading: boolean;
};

export function InvoiceDocuments({ docs, loadDocs, file, setFile, onUpload, uploading }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm max-h-96 overflow-auto pr-1">
              {(docs || []).map((d: any) => (
                <div key={d.id} className="flex items-center justify-between rounded-md border p-2">
                  <div className="truncate pr-2">
                    <span className="text-muted-foreground">{d.type}</span> — {d.name}
                  </div>
                  <a className="text-primary underline" href={d.fileUrl} target="_blank" rel="noreferrer">Open</a>
                </div>
              ))}
              {(docs?.length || 0) === 0 && (
                <div className="text-muted-foreground">No documents</div>
              )}
            </div>
          </CardContent>
        </Card>

        {Array.isArray(loadDocs) && (
          <Card>
            <CardHeader>
              <CardTitle>Load Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(loadDocs || []).map((d: any) => (
                <div key={d.id} className="flex items-center justify-between rounded-md border p-2">
                  <div>
                    {d.type}: {d.name}
                  </div>
                  <a className="text-primary underline" href={d.fileUrl} target="_blank" rel="noreferrer">Open</a>
                </div>
              ))}
              {(loadDocs?.length || 0) === 0 && (
                <div className="text-muted-foreground">No load documents</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <PermissionGuard permission={PERMISSIONS.INVOICE_EDIT}>
          <Card>
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <Button disabled={!file || uploading} onClick={onUpload}>Upload</Button>
              </div>
              <div className="text-xs text-muted-foreground">Attach PDF/Excel and other files to this invoice.</div>
            </CardContent>
          </Card>
        </PermissionGuard>
      </div>
    </div>
  );
}


