import { ArrowRight, CheckCircle2, Lightbulb, Target, FileText } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import dashboardImage from '../../assets/starteria-dashboard.webp';

// Landing público absorbido desde la carpeta landing/ (export de Figma) — ver
// ADR-019. Diseño 1:1; los únicos cambios respecto del original son:
//  - el asset se importa relativo (front no usa el figmaAssetResolver),
//  - las CTAs del piloto navegan internamente a /public/start (no al taplink),
//  - el botón del header depende de la sesión (useApp).
const PILOT_ROUTE = '/public/start';

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useApp();

  const goToPilot = () => navigate(PILOT_ROUTE);
  const goToApp = () => navigate(isAuthenticated ? '/dashboard' : '/auth');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">Starteria</div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#como-funciona" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Cómo funciona</a>
            <a href="#para-quien" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Para quién es</a>
            <button
              type="button"
              onClick={goToApp}
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              {isAuthenticated ? 'Ir a mi panel' : 'Iniciar sesión'}
            </button>
          </nav>
          <button
            type="button"
            onClick={goToPilot}
            className="px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-all hover:shadow-lg"
          >
            Postular al piloto
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 via-white to-transparent"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-32 md:pt-24 md:pb-40">
          <div className="max-w-4xl mx-auto text-center">
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full text-sm font-medium text-slate-700 mb-8 shadow-sm">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              Guiado por IA · Validado por mentor · Alineado con sponsor
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
              Convierte una oportunidad en una iniciativa con impacto
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Starteria es un sistema que ayuda a abordar, dar trazabilidad y sustentar retos y oportunidades a los líderes de tu empresa en 4 pasos.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <button
                type="button"
                onClick={goToPilot}
                className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white text-lg font-medium rounded-xl hover:bg-slate-800 transition-all hover:shadow-xl hover:scale-[1.02]"
              >
                Postular al piloto
                <ArrowRight className="w-5 h-5" />
              </button>
              <a href="#como-funciona" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 border-2 border-slate-200 text-lg font-medium rounded-xl hover:border-slate-300 transition-all">
                Ver cómo funciona
              </a>
            </div>
          </div>
        </div>

        {/* Enhanced Dashboard Preview with Browser Frame - Overlapping Hero */}
        <div className="relative max-w-6xl mx-auto px-6 -mt-24 md:-mt-32 z-10">
          {/* Browser Chrome */}
          <div className="bg-slate-800 rounded-t-2xl px-4 py-3 flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-slate-700 rounded-lg px-4 py-1.5 text-slate-400 text-sm flex items-center gap-2">
                <div className="w-3 h-3 text-slate-500">🔒</div>
                <span>app.starteria.io/iniciativas</span>
              </div>
            </div>
          </div>

          {/* Dashboard Screenshot with Annotations */}
          <div className="bg-white rounded-b-2xl shadow-2xl shadow-slate-300/50 border-x border-b border-slate-200 overflow-hidden">
            {/* Main Screenshot */}
            <img
              src={dashboardImage}
              alt="Starteria Dashboard"
              className="w-full h-auto"
            />
          </div>

        </div>
      </section>

      {/* Support System - No avanzas solo */}
      <section className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            No avanzas solo
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Starteria combina guía de IA, validación experta y alineamiento con sponsor para ayudarte a mover una iniciativa con más claridad y menos ruido.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200/60 rounded-2xl p-8 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Lightbulb className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">IA que guía</h3>
            <p className="text-slate-700 leading-relaxed">
              Te ayuda a ordenar cada etapa y destrabar el siguiente paso.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200/60 rounded-2xl p-8 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Mentor que valida</h3>
            <p className="text-slate-700 leading-relaxed">
              Aporta criterio experto para fortalecer la propuesta.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-white border border-green-200/60 rounded-2xl p-8 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Target className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Sponsor que alinea</h3>
            <p className="text-slate-700 leading-relaxed">
              Conecta la iniciativa con lo que realmente importa al negocio.
            </p>
          </div>
        </div>

        {/* Outcomes Strip */}
        <div className="mt-20 max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Con Starteria obtienes</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-200">
              {[
                { icon: FileText, text: 'Evidencia clara' },
                { icon: Target, text: 'Trazabilidad del avance' },
                { icon: CheckCircle2, text: 'Revisión guiada' },
                { icon: Lightbulb, text: 'Mayor control de la información' }
              ].map((item, i) => (
                <div key={i} className="p-6 text-center hover:bg-slate-50 transition-colors">
                  <div className="flex justify-center mb-3">
                    <item.icon className="w-6 h-6 text-slate-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Transformation Section - Antes y después */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Así cambia la forma de mover iniciativas internas
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              De ideas dispersas a propuestas con evidencia, criterio y dirección.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-4">
            {[
              {
                before: 'La idea queda dispersa en conversaciones',
                after: 'El reto se aterriza y se convierte en iniciativa'
              },
              {
                before: 'No sabes qué hacer primero',
                after: 'Avanzas con una ruta clara paso a paso'
              },
              {
                before: 'Cuesta sustentar el avance',
                after: 'Cada etapa deja evidencia y validación'
              },
              {
                before: 'La empresa no sabe si apostar',
                after: 'El negocio puede decidir con más confianza'
              }
            ].map((item, i) => (
              <div key={i} className="group">
                <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-slate-300 transition-all">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Before */}
                    <div className="flex-1 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600 mb-2">
                        Antes
                      </div>
                      <p className="text-slate-600">{item.before}</p>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-700 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <ArrowRight className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* After */}
                    <div className="flex-1 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full text-xs font-semibold text-green-700 mb-2">
                        Con Starteria
                      </div>
                      <p className="text-slate-900 font-semibold">{item.after}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - Visual Flow */}
      <section id="como-funciona" className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          {/* Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Cómo avanzas con Starteria
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Detectas una oportunidad o desafío. Starteria te ayuda a estructurarlo y avanzar paso a paso hasta convertirlo en una propuesta sustentada.
            </p>
          </div>

          {/* Desktop Flow - Progressive Journey */}
          <div className="hidden lg:block relative max-w-6xl mx-auto">
            {/* Progressive Arrow Path */}
            <svg className="absolute top-[100px] left-0 w-full h-[4px]" style={{ zIndex: 0 }}>
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#cbd5e1" />
                  <stop offset="50%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
                <marker id="arrowhead-flow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="#64748b" />
                </marker>
              </defs>
              <line x1="12%" y1="2" x2="88%" y2="2" stroke="url(#progressGradient)" strokeWidth="3" markerEnd="url(#arrowhead-flow)" />
            </svg>

            {/* Step Cards with Progressive Emphasis */}
            <div className="grid grid-cols-4 gap-4 relative" style={{ zIndex: 1 }}>
              {[
                {
                  num: '01',
                  title: 'Claridad del desafío',
                  desc: 'La IA te ayuda a ordenar el problema o la oportunidad.',
                  accent: 'blue'
                },
                {
                  num: '02',
                  title: 'Diseñar solución',
                  desc: 'Estructuras una propuesta con foco, lógica y criterios claros.',
                  accent: 'purple'
                },
                {
                  num: '03',
                  title: 'Probar en pequeño',
                  desc: 'Validas con evidencia antes de escalar.',
                  accent: 'green'
                },
                {
                  num: '04',
                  title: 'Sustentar impacto',
                  desc: 'Llegas con aprendizajes, evidencia y una propuesta más clara.',
                  accent: 'slate'
                }
              ].map((step, i) => (
                <div key={i} className="relative pt-8">
                  {/* Step Number Badge - Positioned Above Card */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg ${
                      step.accent === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                      step.accent === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                      step.accent === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                      'bg-gradient-to-br from-slate-700 to-slate-800'
                    }`}>
                      {step.num}
                    </div>
                  </div>

                  {/* Card */}
                  <div className={`bg-white rounded-2xl p-6 pt-12 border-2 transition-all hover:shadow-xl hover:-translate-y-1 ${
                    step.accent === 'blue' ? 'border-blue-200 hover:border-blue-300' :
                    step.accent === 'purple' ? 'border-purple-200 hover:border-purple-300' :
                    step.accent === 'green' ? 'border-green-200 hover:border-green-300' :
                    'border-slate-200 hover:border-slate-300'
                  }`}>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 leading-snug min-h-[56px]">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tablet Flow */}
          <div className="hidden md:block lg:hidden relative max-w-3xl mx-auto">
            <div className="grid grid-cols-2 gap-8">
              {[
                {
                  num: '01',
                  title: 'Claridad del desafío',
                  desc: 'La IA te ayuda a ordenar el problema o la oportunidad.',
                  accent: 'blue'
                },
                {
                  num: '02',
                  title: 'Diseñar solución',
                  desc: 'Estructuras una propuesta con foco, lógica y criterios claros.',
                  accent: 'purple'
                },
                {
                  num: '03',
                  title: 'Probar en pequeño',
                  desc: 'Validas con evidencia antes de escalar.',
                  accent: 'green'
                },
                {
                  num: '04',
                  title: 'Sustentar impacto',
                  desc: 'Llegas con aprendizajes, evidencia y una propuesta más clara.',
                  accent: 'slate'
                }
              ].map((step, i) => (
                <div key={i} className="relative">
                  <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 hover:shadow-xl transition-all">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white text-lg font-bold mb-4 ${
                      step.accent === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                      step.accent === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                      step.accent === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                      'bg-gradient-to-br from-slate-700 to-slate-800'
                    }`}>
                      {step.num}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                  {i < 3 && i % 2 === 1 && (
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                      <ArrowRight className="w-6 h-6 text-slate-400 rotate-90" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Flow */}
          <div className="md:hidden space-y-4">
            {[
              {
                num: '01',
                title: 'Claridad del desafío',
                desc: 'La IA te ayuda a ordenar el problema o la oportunidad.',
                accent: 'blue'
              },
              {
                num: '02',
                title: 'Diseñar solución',
                desc: 'Estructuras una propuesta con foco, lógica y criterios claros.',
                accent: 'purple'
              },
              {
                num: '03',
                title: 'Probar en pequeño',
                desc: 'Validas con evidencia antes de escalar.',
                accent: 'green'
              },
              {
                num: '04',
                title: 'Sustentar impacto',
                desc: 'Llegas con aprendizajes, evidencia y una propuesta más clara.',
                accent: 'slate'
              }
            ].map((step, i) => (
              <div key={i}>
                <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold mb-4 ${
                    step.accent === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                    step.accent === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                    step.accent === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                    'bg-gradient-to-br from-slate-700 to-slate-800'
                  }`}>
                    {step.num}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                {i < 3 && (
                  <div className="flex justify-center py-2">
                    <ArrowRight className="w-6 h-6 text-slate-300 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Support Layer Badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-blue-200 rounded-full shadow-sm hover:shadow-md transition-all">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">IA que guía</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-purple-200 rounded-full shadow-sm hover:shadow-md transition-all">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Mentor que valida</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-green-200 rounded-full shadow-sm hover:shadow-md transition-all">
              <Target className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Sponsor que alinea</span>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section id="para-quien" className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Para quién es Starteria
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-10 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all">
              <h3 className="text-2xl font-bold mb-4">Para personas dentro de empresas</h3>
              <p className="text-slate-200 leading-relaxed mb-6">
                Si detectas una oportunidad de mejora pero no sabes cómo empezarla o sustentarla, Starteria te da una estructura clara para moverla.
              </p>
              <ul className="space-y-3">
                {[
                  'Estructura tu idea con método',
                  'Valida antes de invertir tiempo',
                  'Presenta con evidencia sólida'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-10 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all">
              <h3 className="text-2xl font-bold mb-4">Para empresas</h3>
              <p className="text-slate-200 leading-relaxed mb-6">
                Si necesitas visibilidad sobre qué iniciativas existen, cómo avanzan y cuáles vale la pena apoyar, Starteria te ayuda a decidir con más claridad.
              </p>
              <ul className="space-y-3">
                {[
                  'Trazabilidad de iniciativas internas',
                  'Evidencia clara para decidir',
                  'Alineación con objetivos del negocio'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 p-12 md:p-16 shadow-2xl">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white/90 mb-6">
              ✨ Únete al primer grupo de testeo
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Sé parte del primer piloto de Starteria
            </h2>

            <p className="text-xl text-purple-100 mb-10 leading-relaxed max-w-2xl mx-auto">
              Únete a los primeros usuarios que están transformando problemas internos en iniciativas con impacto real.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={goToPilot}
                className="inline-flex items-center gap-2 px-10 py-5 bg-white text-purple-700 rounded-xl hover:bg-purple-50 transition-all hover:shadow-2xl hover:scale-[1.02] text-lg font-semibold"
              >
                Quiero sumarme al piloto
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-2xl font-semibold text-slate-900">Starteria</div>
            <div className="text-slate-600 text-sm">
              © 2026 Starteria. Convierte problemas en iniciativas.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
