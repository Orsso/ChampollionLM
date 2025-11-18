import { AuthForm } from '../components/auth/AuthForm';
import { BrutalPage } from '../components/ui';

export function Register() {
  return (
    <BrutalPage variant="dots">
      <AuthForm mode="register" />
    </BrutalPage>
  );
}

