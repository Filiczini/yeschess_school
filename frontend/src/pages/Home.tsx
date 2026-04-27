import { useState } from 'react'
import HeroSection from '../components/home/HeroSection'
import ReviewsSection from '../components/home/ReviewsSection'
import FaqSection from '../components/home/FaqSection'
import LeadModal from '../components/home/LeadModal'

export default function Home() {
  const [showLead, setShowLead] = useState(false)

  return (
    <div className="bg-gradient-to-br from-brand to-brand-dark text-slate-50 antialiased selection:bg-white selection:text-brand min-h-screen font-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />
      <div className="fixed top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-light rounded-full blur-3xl opacity-50 pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-[#D4CFEC] rounded-full blur-3xl opacity-20 pointer-events-none z-0" />

      <HeroSection onOpenLead={() => setShowLead(true)} />
      <ReviewsSection />
      <FaqSection />

      {/* Footer */}
      <p className="relative z-10 text-center pb-8 text-blue-200/40 text-xs font-medium">
        &copy; 2026 YesChess School. Київ, Україна.
      </p>

      {/* Floating "Leave a request" button */}
      <button
        type="button"
        onClick={() => setShowLead(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 bg-white text-brand rounded-2xl font-semibold text-sm shadow-xl hover:shadow-2xl hover:bg-blue-50 transition-all duration-300 group"
      >
        <iconify-icon icon="solar:pen-new-square-linear" width="18" height="18"></iconify-icon>
        <span className="hidden sm:inline">Залишити заявку</span>
      </button>

      {showLead && <LeadModal onClose={() => setShowLead(false)} />}
    </div>
  )
}
