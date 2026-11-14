import { ActionBar } from "@/components/layout/ActionBar";
import { EmergencyDialog } from "@/components/layout/EmergencyDialog";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main id="top">{children}</main>
      <Footer />
      <EmergencyDialog />
      <ActionBar />
    </>
  );
}
