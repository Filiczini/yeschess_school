import './App.css'

function App() {
  return (
    <div className="bg-gradient-to-br from-brand to-brand-dark text-slate-50 antialiased selection:bg-white selection:text-brand min-h-screen flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none z-0" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-light rounded-full blur-3xl opacity-50 pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-[#D4CFEC] rounded-full blur-3xl opacity-20 pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand">
            <iconify-icon icon="solar:crown-linear" width="28" height="28"></iconify-icon>
          </div>
          <span className="text-white font-bold tracking-tight text-2xl uppercase font-heading">YesChess</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6 leading-[1.1] font-heading">
          Скоро{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">відкриття.</span>
        </h1>

        <p className="text-base md:text-lg text-blue-100 mb-10 font-medium leading-relaxed max-w-lg mx-auto">
          Шахова школа YesChess готує щось особливе. Ми працюємо над сайтом — залишайтесь на зв'язку!
        </p>

        <a
          href="tel:+380980837742"
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand rounded-2xl font-semibold text-sm hover:bg-blue-50 hover:shadow-lg hover:shadow-white/10 transition-all duration-300"
        >
          <iconify-icon icon="solar:phone-linear" width="18" height="18"></iconify-icon>
          +38 (098) 083-77-42
        </a>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-blue-200/40 text-xs font-medium z-10">
        &copy; 2026 YesChess School. Київ, Україна.
      </p>
    </div>
  )
}

export default App
