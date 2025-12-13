import { useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { PillNav } from '../ui/navigation';
import type { PillNavItem } from '../ui/navigation';
import { useAuth } from '../../hooks';
import { CreateProjectModal } from '../project/CreateProjectModal';
import { FloatingActionButton } from '../ui/buttons';
import { ClickSpark } from '../ui/effects';
import { PatternBackground } from '../ui';
import { BORDERS, BACKGROUNDS, BUTTON_DANGER } from '../../constants/styles';

/**
 * Format remaining time for demo badge display
 */
function formatDemoRemaining(dateStr: string | null): string {
  if (!dateStr) return '';
  const now = new Date();
  const expires = new Date(dateStr);
  const diffMs = expires.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Expiré';
  if (diffDays === 1) return '1 jour';
  return `${diffDays} jours`;
}

/**
 * Props for the Layout component.
 */
interface LayoutProps {
  children: ReactNode;
}

/**
 * Main application layout with navigation, header, and floating action button.
 * Includes animated background and click effects.
 */
export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hasPlayedAnimation] = useState(() => {
    // Vérifier si l'animation a déjà été jouée dans cette session
    return sessionStorage.getItem('pillnav-animation-played') === 'true';
  });

  const onDashboard = location.pathname === '/dashboard';
  const onProjectPage = location.pathname.startsWith('/projects/');

  // Marquer l'animation comme jouée après le premier rendu
  useEffect(() => {
    if (!hasPlayedAnimation) {
      sessionStorage.setItem('pillnav-animation-played', 'true');
    }
  }, [hasPlayedAnimation]);

  const navItems = useMemo<PillNavItem[]>(() => [
    {
      label: 'Projets',
      href: '/dashboard',
    },
    {
      label: 'Paramètres',
      href: '/settings',
    },
  ], []);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    // Réinitialiser le flag d'animation pour la prochaine connexion
    sessionStorage.removeItem('pillnav-animation-played');
    logout();
  };

  const getCurrentHref = () => {
    if (location.pathname === '/dashboard') return '/dashboard';
    if (location.pathname === '/settings') return '/settings';
    if (location.pathname.startsWith('/projects')) return '/dashboard';
    return undefined;
  };

  return (
    <div className={`relative min-h-screen ${BACKGROUNDS.main}`}>
      {/* Background with geometric shapes */}
      <PatternBackground variant="grid" />

      {/* Global click spark effect */}
      <ClickSpark />

      {/* Header with bold border */}
      <header className={`fixed top-0 left-0 right-0 z-50 bg-white ${BORDERS.thick} border-b-black`}>
        <div className="flex items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-4">
            {/* Logo with Beta badge */}
            <div className="relative flex-shrink-0">
              <img src="/logo.svg" alt="Champollion" className="w-[55px] h-[55px] mt-[10px]" />
              <span className="absolute bottom-[0px] right-[-0px] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider bg-yellow-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded">
                Beta
              </span>
            </div>
            <PillNav
              items={navItems}
              activeHref={getCurrentHref()}
              baseColor="#ffffff"
              pillColor="#f97316"
              hoveredPillTextColor="#ffffff"
              pillTextColor="#000000"
              initialLoadAnimation={!hasPlayedAnimation}
            />
          </div>
          <div className="flex items-center gap-3">
            {user?.is_demo_user && (
              <Link
                to="/settings"
                className="px-2 py-1 text-[10px] font-black uppercase tracking-wider bg-cyan-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded hover:bg-cyan-300 transition-colors"
              >
                Demo {user.demo_expires_at && `• ${formatDemoRemaining(user.demo_expires_at)}`}
              </Link>
            )}
            <button
              onClick={handleLogout}
              className={`text-sm uppercase tracking-wide ${BUTTON_DANGER} flex items-center gap-2`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="hidden md:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className={`relative z-10 pt-24 px-4 sm:px-8 ${onProjectPage ? 'h-screen overflow-hidden' : 'pb-16 min-h-screen'}`}>
        {children}
      </main>

      {/* Floating action button (only on dashboard) */}
      {onDashboard && (
        <FloatingActionButton
          onClick={() => setShowCreateModal(true)}
          label=""
          icon="✚"
        />
      )}

      {/* Create project modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
