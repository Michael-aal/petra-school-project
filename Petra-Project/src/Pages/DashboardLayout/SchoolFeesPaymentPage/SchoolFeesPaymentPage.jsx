import { Navigate } from "react-router-dom";

// Payments must start from the authenticated parent portal. That flow loads the
// linked student's real fees and obtains a Paystack checkout URL from the API.
export default function SchoolFeesPaymentPage() {
  return <Navigate to="/portal/fees" replace />;
}
