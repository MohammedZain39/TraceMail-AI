import AppSidebar from "@/components/AppSidebar";
import TopNavbar from "@/components/TopNavbar";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="tm-app-shell">

      <AppSidebar />

      <div className="tm-main-shell">

        <TopNavbar />

        <main className="tm-page-content">
          {children}
        </main>

      </div>

    </div>
  );
}