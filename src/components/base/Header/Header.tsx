import { useState } from 'react';
import { Menu, X } from 'lucide-react'; // icon lib: lucide-react
import { useTranslation } from 'react-i18next';
import './style.scss';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'bg' ? 'en' : 'bg';
    i18n.changeLanguage(newLang);
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-white px-6 py-4 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {t('welcome')}
        </h1>

        {/* Language toggle button */}
        <button onClick={toggleLanguage} className="language-toggle-btn">
          🌐 <span className="language-text">{i18n.language === 'bg' ? 'English' : 'Български'}</span>
        </button>

        {/* Desktop menu */}
        <ul className="hidden md:flex gap-8 text-gray-700 font-medium">
          <li className="hover:text-blue-600 cursor-pointer transition">
            {t('book')}
          </li>
          <li className="hover:text-blue-600 cursor-pointer transition">
            {t('signUp')}
          </li>
          <li className="hover:text-blue-600 cursor-pointer transition">
            {t('contacts')}
          </li>
        </ul>

        {/* Mobile menu button */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-gray-700 focus:outline-none"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <ul className="md:hidden flex flex-col gap-4 mt-4 text-gray-700 font-medium px-2">
          <li className="hover:text-blue-600 cursor-pointer transition">
            {t('book')}
          </li>
          <li className="hover:text-blue-600 cursor-pointer transition">
            {t('signUp')}
          </li>
          <li className="hover:text-blue-600 cursor-pointer transition">
            {t('contacts')}
          </li>
        </ul>
      )}
    </nav>
  );
}
