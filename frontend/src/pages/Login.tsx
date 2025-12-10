import { AuthForm } from '../components/auth/AuthForm';
import { BrutalPage } from '../components/ui';

export function Login() {
  return (
    <BrutalPage variant="grid" showShapes={false}>
      <AuthForm mode="login" />
    </BrutalPage>
  );
}

