import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from '../ui/feedback';
import { Button } from '../ui/buttons';
import { useCreateProject } from '../../hooks/useProjects';
import {
  BRUTAL_BORDERS,
  BRUTAL_SHADOWS,
  BRUTAL_RADIUS,
  BRUTAL_CARD_VARIANTS,
  TRANSITIONS
} from '../../constants/styles';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  title: string;
  description?: string;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
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
      setError(err instanceof Error ? err.message : 'Erreur lors de la creation');
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
      <div className={`
        ${BRUTAL_CARD_VARIANTS.default}
        ${BRUTAL_RADIUS.normal}
        ${BRUTAL_SHADOWS.large}
        w-full max-w-md p-8
      `}>
        <h2 className="text-3xl font-black text-black mb-6">Nouveau projet</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Titre du projet
            </label>
            <input
              {...register('title', { required: 'Titre requis' })}
              className={`
                w-full px-4 py-3
                bg-white
                ${BRUTAL_BORDERS.normal}
                border-black
                ${BRUTAL_RADIUS.subtle}
                font-bold text-black
                placeholder:text-slate-400
                focus:outline-none
                focus:ring-4 focus:ring-orange-500/30
                transition-all ${TRANSITIONS.fast}
              `}
              placeholder="Ex: Cours de Mathematiques"
            />
            {errors.title && (
              <p className="text-red-500 text-sm font-bold mt-2">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Description (optionnel)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className={`
                w-full px-4 py-3
                bg-white
                ${BRUTAL_BORDERS.normal}
                border-black
                ${BRUTAL_RADIUS.subtle}
                font-medium text-black
                placeholder:text-slate-400
                focus:outline-none
                focus:ring-4 focus:ring-orange-500/30
                transition-all ${TRANSITIONS.fast}
                resize-none
              `}
              placeholder="Decrivez votre projet..."
            />
          </div>

          {error && <Alert variant="error" message={error} />}

          <div className="flex gap-4 justify-end pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? 'Creation...' : 'Creer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

