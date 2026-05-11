import { redirect } from 'next/navigation';

// Canvas is invite-only / post-purchase. Public signup has been removed —
// /signup now soft-redirects to /login. Anyone with an old bookmark or
// inbound link still lands somewhere sensible. New users get in via an
// invite-acceptance flow (when one ships) or a purchase-driven provisioning.
export default function SignupPage() {
  redirect('/login');
}
