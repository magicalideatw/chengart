import type { Metadata } from "next";
import { SettingsManagement } from "@/components/admin/SettingsManagement";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getBankTransferSettings } from "@/lib/settings/queries";

export const metadata: Metadata = {
  title: "系統設定",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [bankTransferSettings, user] = await Promise.all([
    getBankTransferSettings(),
    getAuthenticatedUser(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <SettingsManagement
        bankTransferSettings={bankTransferSettings}
        canMutate={Boolean(user)}
      />
    </div>
  );
}
