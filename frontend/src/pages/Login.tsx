import { AuthForm } from '../components/auth/AuthForm';
import { BrutalPage } from '../components/ui';

export function Login() {
  return (
    <BrutalPage variant="dots">
      <AuthForm mode="login" />
    </BrutalPage>
  );
}

