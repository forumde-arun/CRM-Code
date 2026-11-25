
import ForgotPasswordView from '@/views/ForgotPasswordView';

export const metadata = {
  title: 'Forgot Password | CRM',
  description: 'Request a password reset link for your CRM account.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
