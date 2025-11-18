import { useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { PillNav } from '../ui/navigation';
import type { PillNavItem } from '../ui/navigation';
import { useAuth } from '../../hooks';
import { CreateProjectModal } from '../project/CreateProjectModal';
import { FloatingActionButton } from '../ui/buttons';
import { ClickSpark } from '../ui/effects';
import { BrutalBackground } from '../ui';
import { BRUTAL_BORDERS, BRUTAL_BACKGROUNDS, BRUTAL_BUTTON_DANGER } from '../../constants/styles';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { logout } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hasPlayedAnimation] = useState(() => {
    // Vérifier si l'animation a déjà été jouée dans cette session
    return sessionStorage.getItem('pillnav-animation-played') === 'true';
  });

  const onDashboard = location.pathname === '/dashboard';

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
    <div className={`relative min-h-screen ${BRUTAL_BACKGROUNDS.main}`}>
      {/* Neo-brutalist background with geometric shapes */}
      <BrutalBackground variant="grid" />

      {/* Global click spark effect */}
      <ClickSpark />

      {/* Header with brutal border */}
      <header className={`fixed top-0 left-0 right-0 z-50 bg-white ${BRUTAL_BORDERS.thick} border-b-black`}>
        <div className="flex items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-4">
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
          <button
            onClick={handleLogout}
            className={`text-sm uppercase tracking-wide ${BRUTAL_BUTTON_DANGER}`}
          >
            <span className="md:hidden">✕</span>
            <span className="hidden md:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Main content area */}
      <main className="relative z-10 pt-24 pb-16 px-4 sm:px-8 min-h-screen">
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

