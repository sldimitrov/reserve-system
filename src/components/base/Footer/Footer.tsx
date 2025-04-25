import { Facebook, Instagram, Twitter } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-100 text-gray-700 px-6 py-10 mt-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10">
        {/* Brand */}
        <div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">
            {t('justReserve')}
          </h2>
          <p className="text-sm">{t('nextDestination')}.</p>
        </div>

        {/* Links */}
        <div className="flex gap-12 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold mb-2">{t('explore')}</h3>
            <ul className="space-y-1">
              <li className="hover:text-blue-600 cursor-pointer">
                {t('book')}
              </li>
              <li className="hover:text-blue-600 cursor-pointer">
                {t('offers')}
              </li>
              <li className="hover:text-blue-600 cursor-pointer">
                {t('signUp')}
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">{t('company')}</h3>
            <ul className="space-y-1">
              <li className="hover:text-blue-600 cursor-pointer">
                {t('aboutUs')}
              </li>
              <li className="hover:text-blue-600 cursor-pointer">
                {t('careers')}
              </li>
              <li className="hover:text-blue-600 cursor-pointer">
                {t('contact')}
              </li>
            </ul>
          </div>
        </div>

        {/* Social */}
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold">{t('followUs')}</h3>
          <div className="flex gap-4">
            <a href="#">
              <Facebook className="hover:text-blue-600" />
            </a>
            <a href="https://www.instagram.com/just_sync_it/">
              <Instagram className="hover:text-pink-500" />
            </a>
            <a href="#">
              <Twitter className="hover:text-blue-400" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="text-sm text-center mt-10 text-gray-500">
        {t('copyright', { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
