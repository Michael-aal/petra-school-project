import { Navigate } from "react-router-dom";

// Standardize student payment route to the primary Petra Payment workflow
export default function StudentPaymentPage() {
  return <Navigate to="/payment" replace />;
}