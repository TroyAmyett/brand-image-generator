import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Canvas - Sign In',
  description: 'Sign in to your Canvas account',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: '#000000',
    }}>
      {children}
    </div>
  );
}
