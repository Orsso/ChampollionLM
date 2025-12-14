import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks';
import { AnimatedInput } from '../ui/forms';
import { Button } from '../ui/buttons';
import { Alert } from '../ui/feedback';
import { PageHeader } from '../ui/layout';
import { Card } from '../ui/cards/Card';

/**
 * Props for the AuthForm component.
 */
interface AuthFormProps {
  mode: 'login' | 'register';
}

/** Form data structure for authentication. */
interface FormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

/**
 * Handles user authentication (login or registration).
 * Features styled inputs and form validation.
 */
export function AuthForm({ mode }: AuthFormProps) {
  const { t } = useTranslation();
  const { login, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>();
  const password = watch('password');

  const onSubmit = async (data: FormData) => {
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login({ username: data.email, password: data.password });
      } else {
        await registerUser(data);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <Card className="relative z-10 w-full max-w-md p-8">
        {/* Back to home link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-500 transition-colors mb-6"
        >
          <span>←</span>
          <span>{t('common.backToHome')}</span>
        </Link>

        {/* Header */}
        <PageHeader
          title="Champollion"
          subtitle={mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
          variant="colored"
          subtitleVariant="highlight"
          className="text-center"
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <AnimatedInput
              label={t('auth.email')}
              type="email"
              autoComplete="email"
              {...register('email', {
                required: t('auth.emailRequired'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('auth.emailInvalid')
                }
              })}
              darkMode={false}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1 font-bold">{errors.email.message}</p>
            )}
          </div>

          <div>
            <AnimatedInput
              label={t('auth.password')}
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              {...register('password', {
                required: t('auth.passwordRequired'),
                minLength: {
                  value: 6,
                  message: t('auth.passwordMinLength')
                }
              })}
              darkMode={false}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1 font-bold">{errors.password.message}</p>
            )}
          </div>

          {mode === 'register' && (
            <div>
              <AnimatedInput
                label={t('auth.confirmPassword')}
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword', {
                  required: t('auth.confirmRequired'),
                  validate: (value) =>
                    value === password || t('auth.passwordMismatch')
                })}
                darkMode={false}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1 font-bold">{errors.confirmPassword.message}</p>
              )}
            </div>
          )}

          {error && <Alert variant="error" message={error} />}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? t('common.loading') : mode === 'login' ? t('auth.login') : t('auth.register')}
          </Button>
        </form>

        {/* Links */}
        <p className="text-black text-sm mt-6 text-center font-medium">
          {mode === 'login' ? (
            <>
              {t('auth.noAccount')}{' '}
              <Link
                to="/register"
                className="text-orange-500 font-bold hover:text-orange-600 underline decoration-2 underline-offset-4"
              >
                {t('auth.register')}
              </Link>
            </>
          ) : (
            <>
              {t('auth.hasAccount')}{' '}
              <Link
                to="/login"
                className="text-orange-500 font-bold hover:text-orange-600 underline decoration-2 underline-offset-4"
              >
                {t('auth.login')}
              </Link>
            </>
          )}
        </p>
      </Card>
    </div>
  );
}
