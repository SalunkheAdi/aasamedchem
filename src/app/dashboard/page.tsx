import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminDashboard from "@/components/AdminDashboard";
import SellerDashboard from "@/components/SellerDashboard";

export default async function DashboardPage() {
  const cookiesList = await cookies();
  const session = getSession(cookiesList);

  if (!session) {
    redirect("/");
  }

  if (session.role === "ADMIN") {
    return <AdminDashboard user={session} />;
  } else {
    return <SellerDashboard user={session} />;
  }
}
