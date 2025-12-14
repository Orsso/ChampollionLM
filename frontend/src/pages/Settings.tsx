import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks';
import { AnimatedInput } from '../components/ui/forms';
import { Button } from '../components/ui/buttons';
import { Alert } from '../components/ui/feedback';
import { PageHeader } from '../components/ui/layout';
import { Card } from '../components/ui/cards/Card';
import { LanguageSelector } from '../components/ui/navigation';
import { BORDERS } from '../constants/styles';

interface ApiKeyFormData {
  apiKey: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function Settings() {
  const { t, i18n } = useTranslation();
  const { user, updateApiKey, changePassword, testApiKey, deleteAccount } = useAuth();

  // API Key form state
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [apiKeySuccess, setApiKeySuccess] = useState<string | null>(null);
  const [isApiKeyLoading, setIsApiKeyLoading] = useState(false);
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);

  // Password form state
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Delete account state
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Get the delete keyword based on current language
  const deleteKeyword = i18n.language === 'en' ? 'DELETE' : 'SUPPRIMER';

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
      setApiKeySuccess(t('settings.apiKey.success'));
    } catch (err) {
      setApiKeyError(err instanceof Error ? err.message : t('settings.apiKey.errorUpdate'));
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
      setPasswordSuccess(t('settings.password.success'));
      resetPasswordForm();
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : t('settings.password.error'));
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
      setApiKeyError(err instanceof Error ? err.message : t('settings.apiKey.errorTest'));
    } finally {
      setIsTestingApiKey(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    if (deleteConfirmText !== deleteKeyword) {
      setDeleteError(t('settings.dangerZone.deleteError'));
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteAccount();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t('settings.dangerZone.error'));
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1">
      <div className="max-w-4xl mx-auto">
        {/* Page header */}
        <PageHeader
          title={t('settings.title')}
          subtitle={t('settings.subtitle')}
          variant="colored"
        />

        {/* Language Section */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-black mb-2">{t('settings.language.title')}</h2>
          <p className="text-gray-600 font-medium mb-4">
            {t('settings.language.description')}
          </p>
          <LanguageSelector />
        </Card>

        {/* Demo Access Info - Only visible to demo users */}
        {user?.is_demo_user && (
          <Card variant="colored" className="mb-6 bg-cyan-100">
            <h2 className="text-xl font-bold text-black mb-2">{t('settings.demo.title')}</h2>
            <p className="text-gray-700 mb-3">
              {t('settings.demo.description')}
              {user.demo_expires_at && (
                <span className="font-bold"> {t('settings.demo.expiresAt', { date: new Date(user.demo_expires_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) })}</span>
              )}
            </p>
            <p className="text-gray-600 text-sm">
              {t('settings.demo.continueInfo')}
            </p>
          </Card>
        )}

        {/* API Key Section */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-black">{t('settings.apiKey.title')}</h2>
              {/* Help tooltip */}
              <div className="relative group">
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-black bg-gray-200 border-2 border-black rounded-full cursor-help hover:bg-orange-200 transition-colors">
                  ?
                </span>
                <div className="absolute left-0 top-full mt-2 w-80 p-4 bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm text-black opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <p className="font-bold mb-2">{t('settings.apiKey.help.title')}</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700 mb-3">
                    <li>{t('settings.apiKey.help.step1')} <a href="https://console.mistral.ai" target="_blank" rel="noopener noreferrer" className="text-orange-500 underline hover:text-orange-600">console.mistral.ai</a></li>
                    <li>{t('settings.apiKey.help.step2')} <strong>{t('settings.apiKey.help.step2Bold')}</strong> {t('settings.apiKey.help.step2Suffix')}</li>
                    <li>{t('settings.apiKey.help.step3')}</li>
                    <li>{t('settings.apiKey.help.step4')}</li>
                  </ol>
                  <p className="text-xs text-gray-500">
                    <strong>{t('settings.apiKey.help.planInfo')}</strong>
                  </p>
                </div>
              </div>
            </div>
            {user?.has_api_key && (
              <span className="flex items-center text-green-600 text-sm font-bold px-3 py-1 bg-green-100 border-2 border-black">
                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {t('settings.apiKey.configured')}
              </span>
            )}
          </div>
          <p className="text-gray-600 font-medium mb-4">
            {t('settings.apiKey.description')}
          </p>

          <form onSubmit={handleApiKeySubmit(onApiKeySubmit)} className="space-y-5" autoComplete="off">
            {/* Hidden field to trick password managers */}
            <input type="password" style={{ display: 'none' }} tabIndex={-1} autoComplete="new-password" />

            <div>
              <AnimatedInput
                label={t('settings.apiKey.label')}
                type="password"
                placeholder={t('settings.apiKey.placeholder')}
                autoComplete="one-time-code"
                data-lpignore="true"
                data-form-type="other"
                {...registerApiKey('apiKey', { required: t('settings.apiKey.required') })}
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
                {isApiKeyLoading ? t('common.saving') : t('common.save')}
              </Button>

              {user?.has_api_key && (
                <Button
                  type="button"
                  onClick={handleTestApiKey}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={isApiKeyLoading || isTestingApiKey}
                >
                  {isTestingApiKey ? t('common.testing') : t('common.testConnection')}
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Password Change Section */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-black mb-4">{t('settings.password.title')}</h2>
          <p className="text-gray-600 font-medium mb-4">
            {t('settings.password.description')}
          </p>

          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5" autoComplete="off">
            {/* Hidden fields to trick password managers */}
            <input type="text" style={{ display: 'none' }} tabIndex={-1} />
            <input type="password" style={{ display: 'none' }} tabIndex={-1} />

            <div>
              <AnimatedInput
                label={t('settings.password.current')}
                type="password"
                placeholder="••••••••"
                autoComplete="one-time-code"
                data-lpignore="true"
                data-form-type="other"
                {...registerPassword('currentPassword', {
                  required: t('settings.password.currentRequired')
                })}
                darkMode={false}
              />
              {passwordErrors.currentPassword && (
                <p className="text-red-500 text-sm mt-1 font-bold">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <AnimatedInput
                label={t('settings.password.new')}
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                data-lpignore="true"
                {...registerPassword('newPassword', {
                  required: t('settings.password.newRequired'),
                  minLength: {
                    value: 8,
                    message: t('settings.password.minLength')
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
                label={t('settings.password.confirm')}
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                data-lpignore="true"
                {...registerPassword('confirmPassword', {
                  required: t('auth.confirmRequired'),
                  validate: (value) =>
                    value === newPassword || t('auth.passwordMismatch')
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
              {isPasswordLoading ? t('settings.password.submitting') : t('settings.password.submit')}
            </Button>
          </form>
        </Card>

        {/* Profile Section */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-black mb-4">{t('settings.profile.title')}</h2>
          <div className="space-y-4">
            <div className={`pb-3 ${BORDERS.normal} border-b-gray-300`}>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-wide mb-1">{t('settings.profile.email')}</p>
              <p className="text-black font-medium text-lg">{user?.email}</p>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="mt-6 border-red-500">
          <h2 className="text-2xl font-bold text-red-600 mb-2">{t('settings.dangerZone.title')}</h2>
          <p className="text-gray-600 font-medium mb-4">
            {t('settings.dangerZone.description')}
          </p>

          {deleteError && <Alert variant="error" message={deleteError} />}

          {showDeleteConfirm && (
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {t('settings.dangerZone.deletePrompt')} <span className="text-red-600 font-mono">{deleteKeyword}</span> {t('settings.dangerZone.deletePromptSuffix')}
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-2 border-3 border-black bg-white text-black font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder={deleteKeyword}
                autoComplete="off"
              />
            </div>
          )}

          <Button
            type="button"
            onClick={handleDeleteAccount}
            className="bg-red-500 hover:bg-red-600 text-white"
            disabled={isDeleting || (showDeleteConfirm && deleteConfirmText !== deleteKeyword)}
          >
            {isDeleting ? t('settings.dangerZone.deleting') : showDeleteConfirm ? t('settings.dangerZone.deleteConfirm') : t('settings.dangerZone.deleteAccount')}
          </Button>

          {showDeleteConfirm && (
            <Button
              type="button"
              onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeleteError(null); }}
              className="ml-3 bg-gray-200 hover:bg-gray-300 text-black"
              disabled={isDeleting}
            >
              {t('common.cancel')}
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
