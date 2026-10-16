import { redirect } from "next/navigation";

export default function AuthSignupRoot() {
  redirect("/auth/login");
}
