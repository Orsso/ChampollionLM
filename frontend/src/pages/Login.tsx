import { AuthForm } from '../components/auth/AuthForm';
import { PageWrapper } from '../components/ui';

export function Login() {
  return (
    <PageWrapper variant="grid" showShapes={false}>
      <AuthForm mode="login" />
    </PageWrapper>
  );
}
