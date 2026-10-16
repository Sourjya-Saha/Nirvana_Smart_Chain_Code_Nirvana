import { Suspense } from "react";
import TopNav from "@/components/TopNav";
import AuthForm from "@/components/AuthForm";

export function generateStaticParams() {
  return [
    { role: "manufacturer" },
    { role: "wholesaler" },
    { role: "retailer" },
    { role: "distributor" },
  ];
}

async function RoleSignupContent({ params }) {
  const { role: rawRole } = await params;
  const role = rawRole?.toLowerCase() || "manufacturer";

  return (
    <AuthForm
      authType="signup"
      userType={role}
      redirectPath={`/auth/login/${role}`}
    />
  );
}

export default function RoleSignupPage({ params }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <Suspense fallback={<div className="flex-1 min-h-screen bg-black" />}>
        <RoleSignupContent params={params} />
      </Suspense>
    </div>
  );
}
