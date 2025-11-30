import { useNavigate } from 'react-router-dom';
import { ForgotPasswordForm } from './forgot-password-form';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ForgotPasswordForm onBack={handleBack} />
      </div>
    </div>
  );
}
