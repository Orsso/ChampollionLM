import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks';
import { AnimatedInput } from '../ui/forms';
import { Button } from '../ui/buttons';
import { Alert } from '../ui/feedback';
import { BrutalPageHeader } from '../ui/layout';
import { BRUTAL_CARD_VARIANTS } from '../../constants/styles';

interface AuthFormProps {
  mode: 'login' | 'register';
}

interface FormData {
  email: string;
  password: string;
}

export function AuthForm({ mode }: AuthFormProps) {
  const { login, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

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
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className={`relative z-10 w-full max-w-md p-8 ${BRUTAL_CARD_VARIANTS.default}`}>
        {/* Back to home link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-500 transition-colors mb-6"
        >
          <span>←</span>
          <span>Retour à l'accueil</span>
        </Link>

        {/* Header with brutal styling */}
        <BrutalPageHeader
          title="Champollion"
          subtitle={mode === 'login' ? 'Connexion' : 'Créer un compte'}
          variant="colored"
          subtitleVariant="highlight"
          className="text-center"
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <AnimatedInput
              label="Email"
              type="email"
              autoComplete="email"
              {...register('email', {
                required: 'Email requis',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email invalide'
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
              label="Mot de passe"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              {...register('password', {
                required: 'Mot de passe requis',
                minLength: {
                  value: 6,
                  message: 'Minimum 6 caractères'
                }
              })}
              darkMode={false}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1 font-bold">{errors.password.message}</p>
            )}
          </div>

          {error && <Alert variant="error" message={error} />}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </Button>
        </form>

        {/* Links with brutal style */}
        <p className="text-black text-sm mt-6 text-center font-medium">
          {mode === 'login' ? (
            <>
              Pas de compte?{' '}
              <Link
                to="/register"
                className="text-orange-500 font-bold hover:text-orange-600 underline decoration-2 underline-offset-4"
              >
                S'inscrire
              </Link>
            </>
          ) : (
            <>
              Déjà un compte?{' '}
              <Link
                to="/login"
                className="text-orange-500 font-bold hover:text-orange-600 underline decoration-2 underline-offset-4"
              >
                Se connecter
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

