import { AuthForm } from '../components/auth/AuthForm';
import { PageWrapper } from '../components/ui';

export function Register() {
  return (
    <PageWrapper variant="grid" showShapes={false}>
      <AuthForm mode="register" />
    </PageWrapper>
  );
}
