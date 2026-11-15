import { ActionBar } from "@/components/layout/action-bar";
import { EmergencyDialog } from "@/components/layout/emergency-dialog";
import { Footer } from "@/components/layout/footer";
import { HashScroll } from "@/components/layout/hash-scroll";
import { Header } from "@/components/layout/header";
import { ServiceWorkerRegister } from "@/components/layout/service-worker-register";
import { AlertBanner } from "@/features/early-warning/components/alert-banner";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <AlertBanner />
      <main id="top">{children}</main>
      <Footer />
      <EmergencyDialog />
      <ActionBar />
      <ServiceWorkerRegister />
      <HashScroll />
    </>
  );
}
