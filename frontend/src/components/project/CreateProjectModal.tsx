import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert } from '../ui/feedback';
import { Button } from '../ui/buttons';
import { AnimatedInput, Textarea } from '../ui/forms';
import { useCreateProject } from '../../hooks/useProjects';
import { Card } from '../ui/cards/Card';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  title: string;
  description?: string;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { t } = useTranslation();
  const { createProject } = useCreateProject();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setError(null);
    setIsLoading(true);

    try {
      await createProject(data);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('project.createError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] px-4"
    >
      <Card className="w-full max-w-md p-8 shadow-large">
        <h2 className="text-3xl font-black text-black mb-6">{t('project.new')}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <AnimatedInput
              label={t('project.title')}
              {...register('title', { required: t('project.titleRequired') })}
              darkMode={false}
            />
            {errors.title && (
              <p className="text-red-500 text-sm font-bold mt-2">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-2">
              {t('project.descriptionOptional')}
            </label>
            <Textarea
              {...register('description')}
              rows={3}
              placeholder={t('project.descriptionPlaceholder')}
            />
          </div>

          {error && <Alert variant="error" message={error} />}

          <div className="flex gap-4 justify-end pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? t('common.creating') : t('common.create')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
