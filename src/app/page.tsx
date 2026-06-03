import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export default async function HomePage() {
  const cookiesList = await cookies();
  const session = getSession(cookiesList);

  if (session) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
