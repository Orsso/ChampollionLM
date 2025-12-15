import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchIcon, SparklesIcon } from '../ui/icons';
import { BORDERS, RADIUS, SHADOWS } from '../../constants/styles';

interface ChatStatusIndicatorProps {
    isSearching: boolean;
    query?: string;
    isTyping: boolean;
}

export function ChatStatusIndicator({ isSearching, query, isTyping }: ChatStatusIndicatorProps) {
    const { t } = useTranslation();
    // Local state to enforce minimum display time for search
    const [displayedSearch, setDisplayedSearch] = useState(isSearching);
    const [displayedQuery, setDisplayedQuery] = useState(query);

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (isSearching) {
            setDisplayedSearch(true);
            setDisplayedQuery(query);
        } else {
            // When search ends, wait a bit before hiding found state if it was too fast
            // But if we are already typing (generating), we might want to switch immediately?
            // User feedback suggests they want to SEE the step.
            // So we enforce a minimum lag only if we were searching.

            // However, simply delaying the "false" state is easier.
            // Let's ensure we show "Searching" for at least 1500ms total logic requires more complex timestamp tracking.
            // Simpler approach: Delay the *hiding* of search by a fixed amount (e.g. 800ms) to ensure smooth transition.

            timeout = setTimeout(() => {
                setDisplayedSearch(false);
            }, 1000);
        }

        return () => clearTimeout(timeout);
    }, [isSearching, query]);

    // Derived state for what to show
    // If displayedSearch is true, we show search state.
    // If not, and isTyping is true, we show generating state.

    // Priority: Search > Typing
    const showSearch = displayedSearch || isSearching;
    const showTyping = !showSearch && isTyping;

    if (!showSearch && !showTyping) return null;

    return (
        <div className="flex justify-start px-2 py-2">
            <div className={`
                flex items-center gap-2 px-3 py-2
                bg-white text-black
                ${BORDERS.thin} border-black ${RADIUS.subtle}
                ${SHADOWS.small}
                transition-all duration-300
            `}>
                {showSearch ? (
                    <>
                        <div className="animate-spin text-orange-600">
                            <SearchIcon size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 animate-pulse">
                            {displayedQuery
                                ? t('project.chat.searchingWithQuery', { query: displayedQuery })
                                : t('project.chat.searching')
                            }
                        </span>
                    </>
                ) : (
                    <>
                        <div className="animate-pulse text-orange-600">
                            <SparklesIcon size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 animate-pulse">
                            {t('project.chat.status.streaming')}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}
