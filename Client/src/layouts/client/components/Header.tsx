import { Link } from 'react-router-dom';

function Header() {
  return (
    <header 
      className="fixed top-0 left-0 w-full z-[100] bg-black shadow-lg px-6 py-5 md:px-16 flex justify-between items-center"
    >
      {/* Logo */}
      <Link to="/" className="text-3xl font-serif italic tracking-tighter text-white">
        DressUp.
      </Link>

      {/* Điều hướng */}
      <nav className="hidden md:flex gap-12 text-[10px] uppercase tracking-[0.3em] font-medium text-white">
        <a href="/" className="hover:opacity-50 transition-all">Home</a>
        <a href="#catalog" className="hover:opacity-50 transition-all">Catalog</a>
        <a href="#history" className="hover:opacity-50 transition-all">History</a>
        <a href="#contact" className="hover:opacity-50 transition-all">Contact</a>
      </nav>

      {/* Icons bên phải */}
      <div className="flex items-center gap-8 text-white">
        {/* NÚT SEARCH MÀU TRẮNG RÕ NÉT */}
        <button className="text-[10px] text-white uppercase tracking-widest hidden md:block border-b border-white pb-1 hover:text-gray-300 hover:border-gray-300 transition-all">
          Search
        </button>

        <div className="relative cursor-pointer hover:scale-110 transition-transform">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            0
          </span>
        </div>
      </div>
    </header>
  );
}

export default Header;