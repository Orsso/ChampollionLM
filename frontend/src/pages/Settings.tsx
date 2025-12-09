import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks';
import { AnimatedInput } from '../components/ui/forms';
import { Button } from '../components/ui/buttons';
import { Alert } from '../components/ui/feedback';
import { BrutalPageHeader } from '../components/ui/layout';
import { BRUTAL_CARD_VARIANTS, BRUTAL_BORDERS } from '../constants/styles';

interface ApiKeyFormData {
  apiKey: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function Settings() {
  const { user, updateApiKey, changePassword, testApiKey } = useAuth();

  // API Key form state
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [apiKeySuccess, setApiKeySuccess] = useState<string | null>(null);
  const [isApiKeyLoading, setIsApiKeyLoading] = useState(false);
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);

  // Password form state
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const {
    register: registerApiKey,
    handleSubmit: handleApiKeySubmit,
    formState: { errors: apiKeyErrors }
  } = useForm<ApiKeyFormData>();

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    watch,
    reset: resetPasswordForm
  } = useForm<PasswordFormData>();

  const newPassword = watch('newPassword');

  const onApiKeySubmit = async (data: ApiKeyFormData) => {
    setApiKeyError(null);
    setApiKeySuccess(null);
    setIsApiKeyLoading(true);

    try {
      await updateApiKey(data.apiKey);
      setApiKeySuccess('Clé API mise à jour avec succès');
    } catch (err) {
      setApiKeyError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsApiKeyLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setPasswordError(null);
    setPasswordSuccess(null);
    setIsPasswordLoading(true);

    try {
      await changePassword(data.currentPassword, data.newPassword);
      setPasswordSuccess('Mot de passe modifié avec succès');
      resetPasswordForm();
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleTestApiKey = async () => {
    setApiKeyError(null);
    setApiKeySuccess(null);
    setIsTestingApiKey(true);

    try {
      const result = await testApiKey();
      setApiKeySuccess(result.message);
    } catch (err) {
      setApiKeyError(err instanceof Error ? err.message : 'Erreur lors du test de la clé API');
    } finally {
      setIsTestingApiKey(false);
    }
  };

  return (
    <div className="flex-1">
      <div className="max-w-4xl mx-auto">
        {/* Page header with brutal styling */}
        <BrutalPageHeader
          title="Paramètres"
          subtitle="Configurez votre compte et vos préférences"
          variant="colored"
        />

        {/* API Key Section - Brutal Card */}
        <div className={`mb-6 p-6 ${BRUTAL_CARD_VARIANTS.default}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-black">Clé API</h2>
            {user?.has_api_key && (
              <span className="flex items-center text-green-600 text-sm font-bold px-3 py-1 bg-green-100 border-2 border-black">
                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Clé configurée
              </span>
            )}
          </div>
          <p className="text-gray-600 font-medium mb-4">
            Configurez votre clé API pour les services de transcription et génération de notes
          </p>

          <form onSubmit={handleApiKeySubmit(onApiKeySubmit)} className="space-y-5" autoComplete="off">
            {/* Hidden field to trick password managers */}
            <input type="password" style={{ display: 'none' }} tabIndex={-1} autoComplete="new-password" />

            <div>
              <AnimatedInput
                label="Clé API STT/LLM"
                type="password"
                placeholder="sk-..."
                autoComplete="one-time-code"
                data-lpignore="true"
                data-form-type="other"
                {...registerApiKey('apiKey', { required: 'Clé API requise' })}
                darkMode={false}
              />
              {apiKeyErrors.apiKey && (
                <p className="text-red-500 text-sm mt-1 font-bold">{apiKeyErrors.apiKey.message}</p>
              )}
            </div>

            {apiKeyError && <Alert variant="error" message={apiKeyError} />}
            {apiKeySuccess && <Alert variant="success" message={apiKeySuccess} />}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={isApiKeyLoading || isTestingApiKey}
              >
                {isApiKeyLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>

              {user?.has_api_key && (
                <Button
                  type="button"
                  onClick={handleTestApiKey}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={isApiKeyLoading || isTestingApiKey}
                >
                  {isTestingApiKey ? 'Test en cours...' : 'Tester la connexion'}
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Password Change Section - Brutal Card */}
        <div className={`mb-6 p-6 ${BRUTAL_CARD_VARIANTS.default}`}>
          <h2 className="text-2xl font-bold text-black mb-4">Mot de passe</h2>
          <p className="text-gray-600 font-medium mb-4">
            Modifiez votre mot de passe de connexion
          </p>

          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5" autoComplete="off">
            {/* Hidden fields to trick password managers */}
            <input type="text" style={{ display: 'none' }} tabIndex={-1} />
            <input type="password" style={{ display: 'none' }} tabIndex={-1} />

            <div>
              <AnimatedInput
                label="Mot de passe actuel"
                type="password"
                placeholder="••••••••"
                autoComplete="one-time-code"
                data-lpignore="true"
                data-form-type="other"
                {...registerPassword('currentPassword', {
                  required: 'Mot de passe actuel requis'
                })}
                darkMode={false}
              />
              {passwordErrors.currentPassword && (
                <p className="text-red-500 text-sm mt-1 font-bold">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <AnimatedInput
                label="Nouveau mot de passe"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                data-lpignore="true"
                {...registerPassword('newPassword', {
                  required: 'Nouveau mot de passe requis',
                  minLength: {
                    value: 8,
                    message: 'Le mot de passe doit contenir au moins 8 caractères'
                  }
                })}
                darkMode={false}
              />
              {passwordErrors.newPassword && (
                <p className="text-red-500 text-sm mt-1 font-bold">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <div>
              <AnimatedInput
                label="Confirmer le nouveau mot de passe"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                data-lpignore="true"
                {...registerPassword('confirmPassword', {
                  required: 'Confirmation requise',
                  validate: (value) =>
                    value === newPassword || 'Les mots de passe ne correspondent pas'
                })}
                darkMode={false}
              />
              {passwordErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1 font-bold">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>

            {passwordError && <Alert variant="error" message={passwordError} />}
            {passwordSuccess && <Alert variant="success" message={passwordSuccess} />}

            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isPasswordLoading}
            >
              {isPasswordLoading ? 'Modification...' : 'Modifier le mot de passe'}
            </Button>
          </form>
        </div>

        {/* Profile Section - Brutal Card */}
        <div className={`p-6 ${BRUTAL_CARD_VARIANTS.default}`}>
          <h2 className="text-2xl font-bold text-black mb-4">Profil</h2>
          <div className="space-y-4">
            <div className={`pb-3 ${BRUTAL_BORDERS.normal} border-b-gray-300`}>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-wide mb-1">Email</p>
              <p className="text-black font-medium text-lg">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

