import { Suspense } from "react";
import TopNav from "@/components/TopNav";
import AuthForm from "@/components/AuthForm";

const roleRedirects = {
  manufacturer: "/manufacturer/dashboard",
  wholesaler: "/wholesaler/dashboard",
  retailer: "/retailer/dashboard",
  distributor: "/distributor/dashboard",
};

export function generateStaticParams() {
  return [
    { role: "manufacturer" },
    { role: "wholesaler" },
    { role: "retailer" },
    { role: "distributor" },
  ];
}

async function RoleLoginContent({ params }) {
  const { role: rawRole } = await params;
  const role = rawRole?.toLowerCase() || "manufacturer";
  const redirectPath = roleRedirects[role] || "/retailer/dashboard";

  return (
    <AuthForm
      authType="login"
      userType={role}
      redirectPath={redirectPath}
    />
  );
}

export default function RoleLoginPage({ params }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <Suspense fallback={<div className="flex-1 min-h-screen bg-black" />}>
        <RoleLoginContent params={params} />
      </Suspense>
    </div>
  );
}
