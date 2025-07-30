import { redirect } from "next/navigation";

export default function Home() {
  // Redirect langsung ke login
  redirect("/login");
}
