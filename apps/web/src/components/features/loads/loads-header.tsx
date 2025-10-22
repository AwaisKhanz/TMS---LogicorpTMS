import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { CanCreate } from "@/components/auth/can";

export function LoadsHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Loads</h1>
        <p className="text-muted-foreground">
          Manage your shipments and transportation orders
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
        <CanCreate resource="load">
          <Button asChild>
            <Link href="/loads/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Load
            </Link>
          </Button>
        </CanCreate>
      </div>
    </div>
  );
}
