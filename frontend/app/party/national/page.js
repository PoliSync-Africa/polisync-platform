import { redirect } from "next/navigation";

// Political parties do not have a separate National Admin dashboard.
// The certified party creator receives the national_party_admin role
// and uses the same national Party Command Center at /party.
export default function PartyNationalRedirect() {
  redirect("/party");
}
