import { useTranslation } from 'react-i18next';
import { BORDERS, RADIUS } from '../../../constants/styles';

/**
 * Language selector dropdown component.
 * Allows users to switch between available languages.
 */
export function LanguageSelector() {
    const { i18n, t } = useTranslation();

    const languages = [
        { code: 'fr', label: t('settings.language.french') },
        { code: 'en', label: t('settings.language.english') }
    ];

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        i18n.changeLanguage(e.target.value);
    };

    return (
        <select
            value={i18n.language}
            onChange={handleChange}
            className={`
        px-3 py-2 bg-white text-black font-bold
        ${BORDERS.normal} border-black ${RADIUS.subtle}
        cursor-pointer hover:bg-gray-100 transition-colors
        focus:outline-none focus:ring-2 focus:ring-orange-500
      `}
            aria-label={t('settings.language.title')}
        >
            {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                    {lang.label}
                </option>
            ))}
        </select>
    );
}
