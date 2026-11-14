import { ActionBar } from "@/components/layout/action-bar";
import { EmergencyDialog } from "@/components/layout/emergency-dialog";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

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
