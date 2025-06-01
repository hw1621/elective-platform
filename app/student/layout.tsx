import { getServerSession } from "next-auth";
import { authOptions } from "@/auth-options";
import { redirect } from "next/navigation";
import StudentNavbar from "@/components/StudentNavbar";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "student") {
    redirect("/unauthorized");
  }

  return (
    <> 
      <StudentNavbar/>
      <div className="h-10 bg-[#f9fafb]" />
      {children}
    </>
  );
}
