import { Navbar } from "./Navbar";

interface Props {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: Props) {
  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <main className="container py-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  );
}
