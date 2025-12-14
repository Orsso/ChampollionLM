import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageWrapper } from '../components/ui/PageWrapper';
import { Button } from '../components/ui/buttons/Button';
import { Card } from '../components/ui/cards/Card';
import {
  MicrophoneIcon,
  SparklesIcon,
  FolderOpenIcon,
  YouTubeIcon
} from '../components/ui/icons/Icons';
import {
  SHADOWS,
  RADIUS,
  BORDERS,
  TRANSITIONS,
} from '../constants/styles';

interface Feature {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  titleKey: string;
  descriptionKey: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: MicrophoneIcon,
    titleKey: 'home.features.transcription.title',
    descriptionKey: 'home.features.transcription.description',
    color: 'bg-accent-cyan',
  },
  {
    icon: YouTubeIcon,
    titleKey: 'home.features.youtube.title',
    descriptionKey: 'home.features.youtube.description',
    color: 'bg-red-500',
  },
  {
    icon: FolderOpenIcon,
    titleKey: 'home.features.multiSource.title',
    descriptionKey: 'home.features.multiSource.description',
    color: 'bg-accent-yellow',
  },
  {
    icon: SparklesIcon,
    titleKey: 'home.features.synthesis.title',
    descriptionKey: 'home.features.synthesis.description',
    color: 'bg-accent-pink',
  },
];

export function Home() {
  const { t } = useTranslation();

  return (
    <PageWrapper variant="grid" showShapes={false}>
      {/* Navigation Bar */}
      <nav className="relative z-20 border-b-3 border-black bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">Champollion</h1>
          <div className="flex gap-3">
            <Link to="/login">
              <Button variant="secondary" size="sm">
                {t('auth.login')}
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">
                {t('auth.register')}
              </Button>
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
                className={`inline-block px-4 py-2 ${BORDERS.normal} border-black ${RADIUS.normal} bg-accent-yellow text-black text-sm font-bold ${SHADOWS.small}`}
              >
                {t('home.tagline')}
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-black leading-tight">
              {t('home.heroTitle')}
              <span className="relative inline-block ml-3">
                <span className="relative z-10">{t('home.heroTitleHighlight')}</span>
                <span className="absolute inset-0 bg-orange-500 -rotate-1 -z-10 rounded" />
              </span>
              <br />
              {t('home.heroTitle2')}
            </h1>

            <p className="text-xl text-slate-700 leading-relaxed max-w-xl">
              {t('home.heroDescription')}
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/register">
                <Button variant="primary" size="lg" className="px-8 py-4 text-lg h-auto">
                  {t('home.cta')}
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg" className="px-8 py-4 text-lg h-auto">
                  {t('home.ctaLogin')}
                </Button>
              </Link>
            </div>

            <p className="text-sm text-slate-600 pt-2">
              {t('home.subText')}
            </p>
          </div>

          {/* Right: Mockup Illustration */}
          <div className="relative">
            {/* Main Card Mockup */}
            <Card
              variant="default"
              className={`space-y-4 transform rotate-2`}
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
              <div className={`${BORDERS.normal} border-black ${RADIUS.normal} bg-orange-100 p-4`}>
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
              <Button
                variant="primary"
                size="md"
                className="w-full pointer-events-none"
              >
                {t('home.mockup.generateNotes')}
              </Button>
            </Card>

            {/* Floating Badge */}
            <Card
              variant="accent"
              className={`absolute -top-6 -left-6 px-4 py-2 transform -rotate-12`}
            >
              <p className="text-white font-bold text-sm">{t('home.mockup.poweredBy')}</p>
            </Card>

            {/* Floating Badge 2 */}
            <div
              className={`absolute -bottom-4 -right-4 bg-accent-cyan ${BORDERS.normal} border-black ${RADIUS.normal} ${SHADOWS.medium} px-4 py-2 transform rotate-6`}
            >
              <p className="text-black font-bold text-sm">{t('home.mockup.exportPdf')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            {t('home.featuresTitle')}
          </h2>
          <p className="text-xl text-slate-700 max-w-2xl mx-auto">
            {t('home.featuresSubtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className={`space-y-4 hover:translate-y-[-4px] ${TRANSITIONS.normal}`}
              >
                <div
                  className={`w-14 h-14 ${feature.color} ${BORDERS.normal} border-black ${RADIUS.normal} ${SHADOWS.small} flex items-center justify-center`}
                >
                  <Icon size={28} className="text-black" />
                </div>
                <h3 className="text-xl font-bold text-black">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  {t(feature.descriptionKey)}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <Card
          variant="accent"
          className={`p-12 text-center space-y-6`}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            {t('home.readyTitle')}
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            {t('home.readyDescription')}
          </p>
          <div className="flex justify-center">
            <Link to="/register">
              <Button
                variant="secondary"
                size="lg"
                className="px-10 py-4 text-lg h-auto"
              >
                {t('home.readyCta')}
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t-3 border-black bg-white mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-600">
              {t('home.footer')}
            </p>
            <div className="flex gap-6 text-sm text-slate-600">
              <a href="https://github.com/orsso/champollionlm" className="hover:text-orange-500 transition-colors">
                GitHub
              </a>
              <a href="https://github.com/Orsso/ChampollionLM/blob/main/docs/ARCHITECTURE.md" className="hover:text-orange-500 transition-colors">
                {t('home.documentation')}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </PageWrapper>
  );
}
