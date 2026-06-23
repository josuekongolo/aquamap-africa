import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';

export default function Home() {
  const { t } = useLang();

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden text-white py-20 px-6"
        style={{ background: 'linear-gradient(135deg, #0D6B8A 0%, #00A878 100%)' }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-9xl">🌊</div>
          <div className="absolute bottom-10 right-10 text-9xl">🐠</div>
          <div className="absolute top-20 right-20 text-6xl">🦐</div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="text-5xl mb-4">🐠</div>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            {t.home.hero}
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            {t.home.heroSub}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="text-white font-bold px-8 py-4 rounded-xl text-lg shadow-lg hover:opacity-90 transition"
              style={{ backgroundColor: '#F4A261' }}
            >
              {t.home.cta}
            </Link>
            <Link
              to="/map"
              className="bg-white/20 backdrop-blur text-white font-bold px-8 py-4 rounded-xl text-lg hover:bg-white/30 transition"
            >
              🗺️ Voir la carte
            </Link>
          </div>
          <p className="mt-4 text-white/60 text-sm">{t.home.ctaSub}</p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-8 px-6" style={{ backgroundColor: '#0D6B8A' }}>
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 text-white text-center">
          <div>
            <div className="text-3xl font-bold">500+</div>
            <div className="text-white/70 text-sm">{t.home.stats}</div>
          </div>
          <div className="border-l border-white/20 pl-8">
            <div className="text-3xl font-bold">3</div>
            <div className="text-white/70 text-sm">{t.home.countries}</div>
          </div>
          <div className="border-l border-white/20 pl-8">
            <div className="text-3xl font-bold">2.1</div>
            <div className="text-white/70 text-sm">{t.home.fcr}</div>
          </div>
          <div className="border-l border-white/20 pl-8">
            <div className="text-3xl font-bold">1,200t</div>
            <div className="text-white/70 text-sm">Production annuelle</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="font-bold text-lg mb-3" style={{ color: '#0D6B8A' }}>{t.home.feature1}</h3>
            <p className="text-gray-600">{t.home.feature1desc}</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition text-center">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="font-bold text-lg mb-3" style={{ color: '#0D6B8A' }}>{t.home.feature2}</h3>
            <p className="text-gray-600">{t.home.feature2desc}</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition text-center">
            <div className="text-5xl mb-4">🏪</div>
            <h3 className="font-bold text-lg mb-3" style={{ color: '#0D6B8A' }}>{t.home.feature3}</h3>
            <p className="text-gray-600">{t.home.feature3desc}</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-12" style={{ color: '#0D6B8A' }}>
            {t.home.how}
          </h2>
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
            {[
              { num: '1', icon: '📝', label: t.home.step1, desc: t.home.step1desc },
              { num: '2', icon: '📈', label: t.home.step2, desc: t.home.step2desc },
              { num: '3', icon: '🚀', label: t.home.step3, desc: t.home.step3desc },
            ].map((step, i) => (
              <div key={i} className="flex-1">
                <div className="relative">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4"
                    style={{ backgroundColor: '#0D6B8A' }}
                  >
                    {step.num}
                  </div>
                  <div className="text-3xl mb-3">{step.icon}</div>
                </div>
                <h3 className="font-bold text-lg mb-2">{step.label}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section
        className="py-16 px-6 text-center"
        style={{ background: 'linear-gradient(135deg, #00A878 0%, #0D6B8A 100%)' }}
      >
        <div className="max-w-2xl mx-auto text-white">
          <div className="text-4xl mb-4">🌊</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Rejoignez la communauté aquacole africaine
          </h2>
          <p className="text-white/80 mb-8">
            Gratuit pour tous les opérateurs. Données sécurisées. Support communautaire.
          </p>
          <Link
            to="/register"
            className="inline-block text-white font-bold px-10 py-4 rounded-xl text-lg shadow-lg hover:opacity-90 transition"
            style={{ backgroundColor: '#F4A261' }}
          >
            {t.home.cta} →
          </Link>
        </div>
      </section>
    </div>
  );
}
