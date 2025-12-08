import { Link } from 'react-router-dom';
import { BrutalPage } from '../components/ui/BrutalPage';
import {
  MicrophoneIcon,
  SparklesIcon,
  FolderOpenIcon,
  YouTubeIcon
} from '../components/ui/icons/Icons';
import {
  BRUTAL_CARD_VARIANTS,
  BRUTAL_BUTTON_VARIANTS,
  BRUTAL_SHADOWS,
  BRUTAL_RADIUS,
  BRUTAL_BORDERS,
  TRANSITIONS,
} from '../constants/styles';

interface Feature {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: MicrophoneIcon,
    title: 'Transcription Audio',
    description: 'Convertissez vos enregistrements en texte avec Mistral Voxtral STT. Précision maximale pour vos cours.',
    color: 'bg-brutal-cyan',
  },
  {
    icon: YouTubeIcon,
    title: 'Vidéos YouTube',
    description: 'Importez les transcriptions de vidéos YouTube en un clic. Idéal pour les conférences et tutoriels.',
    color: 'bg-red-500',
  },
  {
    icon: FolderOpenIcon,
    title: 'Multi-Sources',
    description: 'Combinez audio, vidéos et documents. Créez des notes complètes à partir de toutes vos ressources.',
    color: 'bg-brutal-yellow',
  },
  {
    icon: SparklesIcon,
    title: 'Synthèse IA',
    description: 'Mistral AI structure vos contenus en documents professionnels.',
    color: 'bg-brutal-pink',
  },
];

export function Home() {
  return (
    <BrutalPage variant="grid" showShapes={true}>
      {/* Navigation Bar */}
      <nav className="relative z-20 border-b-3 border-black bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">Champollion</h1>
          <div className="flex gap-3">
            <Link to="/login">
              <button
                className={`${BRUTAL_BUTTON_VARIANTS.secondary} ${BRUTAL_SHADOWS.medium} ${BRUTAL_RADIUS.normal} px-6 py-2 text-sm`}
              >
                Se connecter
              </button>
            </Link>
            <Link to="/register">
              <button
                className={`${BRUTAL_BUTTON_VARIANTS.primary} ${BRUTAL_SHADOWS.medium} ${BRUTAL_RADIUS.normal} px-6 py-2 text-sm`}
              >
                S'inscrire
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="space-y-6">
            <div className="inline-block">
              <span
                className={`inline-block px-4 py-2 ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} bg-brutal-yellow text-black text-sm font-bold ${BRUTAL_SHADOWS.small}`}
              >
                IA • Transcription • Notes
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-black leading-tight">
              Transformez vos
              <span className="relative inline-block ml-3">
                <span className="relative z-10">sources</span>
                <span className="absolute inset-0 bg-orange-500 -rotate-1 -z-10 rounded" />
              </span>
              <br />
              en notes structurées
            </h1>

            <p className="text-xl text-slate-700 leading-relaxed max-w-xl">
              Champollion utilise l'IA pour transcrire vos enregistrements et vidéos YouTube,
              puis générer des notes de cours claires et professionnelles.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/register">
                <button
                  className={`${BRUTAL_BUTTON_VARIANTS.primary} ${BRUTAL_SHADOWS.large} ${BRUTAL_RADIUS.normal} px-8 py-4 text-lg ${TRANSITIONS.normal}`}
                >
                  Commencer gratuitement
                </button>
              </Link>
              <Link to="/login">
                <button
                  className={`${BRUTAL_BUTTON_VARIANTS.ghost} ${BRUTAL_SHADOWS.large} ${BRUTAL_RADIUS.normal} px-8 py-4 text-lg ${TRANSITIONS.normal} bg-white`}
                >
                  Se connecter
                </button>
              </Link>
            </div>

            <p className="text-sm text-slate-600 pt-2">
              Utilisez votre propre clé API Mistral • Contrôle total sur vos coûts
            </p>
          </div>

          {/* Right: Mockup Illustration */}
          <div className="relative">
            {/* Main Card Mockup */}
            <div
              className={`${BRUTAL_CARD_VARIANTS.default} ${BRUTAL_RADIUS.normal} p-6 space-y-4 transform rotate-2`}
            >
              {/* Mockup Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 border-3 border-black rounded-lg" />
                  <div>
                    <div className="h-4 w-32 bg-slate-800 rounded" />
                    <div className="h-3 w-24 bg-slate-400 rounded mt-2" />
                  </div>
                </div>
              </div>

              {/* Mockup Audio Waveform */}
              <div className={`${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} bg-orange-100 p-4`}>
                <div className="flex items-end gap-1 h-16 justify-center">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-orange-500 w-2 rounded-sm"
                      style={{
                        height: `${Math.random() * 100}%`,
                        minHeight: '20%',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Mockup Transcript Lines */}
              <div className="space-y-3">
                <div className="h-3 w-full bg-slate-300 rounded" />
                <div className="h-3 w-5/6 bg-slate-300 rounded" />
                <div className="h-3 w-4/6 bg-slate-300 rounded" />
              </div>

              {/* Mockup Button */}
              <button
                className={`${BRUTAL_BUTTON_VARIANTS.primary} ${BRUTAL_SHADOWS.small} ${BRUTAL_RADIUS.normal} w-full py-2 text-sm pointer-events-none`}
              >
                Générer les notes
              </button>
            </div>

            {/* Floating Badge */}
            <div
              className={`absolute -top-6 -left-6 ${BRUTAL_CARD_VARIANTS.accent} ${BRUTAL_RADIUS.normal} px-4 py-2 transform -rotate-12`}
            >
              <p className="text-white font-bold text-sm">Powered by Mistral AI</p>
            </div>

            {/* Floating Badge 2 */}
            <div
              className={`absolute -bottom-4 -right-4 bg-brutal-cyan ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} ${BRUTAL_SHADOWS.medium} px-4 py-2 transform rotate-6`}
            >
              <p className="text-black font-bold text-sm">Export PDF</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-xl text-slate-700 max-w-2xl mx-auto">
            Une suite complète pour capturer, structurer et exporter vos contenus académiques
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={`${BRUTAL_CARD_VARIANTS.default} ${BRUTAL_RADIUS.normal} p-6 space-y-4 hover:translate-y-[-4px] ${TRANSITIONS.normal}`}
              >
                <div
                  className={`w-14 h-14 ${feature.color} ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} ${BRUTAL_SHADOWS.small} flex items-center justify-center`}
                >
                  <Icon size={28} className="text-black" />
                </div>
                <h3 className="text-xl font-bold text-black">
                  {feature.title}
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div
          className={`${BRUTAL_CARD_VARIANTS.accent} ${BRUTAL_RADIUS.normal} p-12 text-center space-y-6`}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Prêt à démarrer ?
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Créez votre compte et commencez à transformer vos enregistrements en notes structurées dès aujourd'hui.
          </p>
          <Link to="/register">
            <button
              className={`bg-white text-black ${BRUTAL_BORDERS.normal} border-black ${BRUTAL_RADIUS.normal} ${BRUTAL_SHADOWS.large} px-10 py-4 text-lg font-bold hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${TRANSITIONS.normal}`}
            >
              S'inscrire maintenant
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t-3 border-black bg-white mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-600">
              © 2025 Champollion • Propulsé par Mistral AI
            </p>
            <div className="flex gap-6 text-sm text-slate-600">
              <a href="https://github.com/orsso" className="hover:text-orange-500 transition-colors">
                GitHub
              </a>
              <a href="/login" className="hover:text-orange-500 transition-colors">
                Documentation
              </a>
            </div>
          </div>
        </div>
      </footer>
    </BrutalPage>
  );
}
