import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterPage() {
  const cookiesList = await cookies();
  const session = getSession(cookiesList);

  if (session) {
    redirect("/dashboard");
  }

  return <RegisterForm />;
}
