import { AuthForm } from '../components/auth/AuthForm';
import { BrutalPage } from '../components/ui';

export function Register() {
  return (
    <BrutalPage variant="grid" showShapes={false}>
      <AuthForm mode="register" />
    </BrutalPage>
  );
}

