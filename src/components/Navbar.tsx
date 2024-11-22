import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

interface NavigationItem {
  name: string;
  href: string;
  public: boolean;
}

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigation: NavigationItem[] = [
    { name: t('nav.home'), href: '/', public: true },
    { name: t('nav.track'), href: '/track', public: false },
    { name: t('nav.vendors'), href: '/vendors', public: true },
    { name: t('nav.reports'), href: '/reports', public: false },
    { name: t('nav.profile'), href: '/profile', public: false },
  ];

  const isActive = (path: string) => location.pathname === path;

  const authLinks = currentUser ? (
    <button
      onClick={handleLogout}
      className="text-green-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
    >
      {t('nav.logout')}
    </button>
  ) : (
    <div className="flex space-x-4">
      <Link
        to="/login"
        className="text-green-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
      >
        {t('nav.login')}
      </Link>
      <Link
        to="/signup"
        className="bg-white text-green-600 hover:bg-green-50 px-3 py-2 rounded-md text-sm font-medium"
      >
        {t('nav.signup')}
      </Link>
    </div>
  );

  return (
    <Disclosure as="nav" className="bg-green-600">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Link to="/" className="text-white text-xl font-bold">
                    EcoTrack
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
                  {navigation
                    .filter(item => item.public || currentUser)
                    .map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`${
                          isActive(item.href)
                            ? 'bg-green-700 text-white'
                            : 'text-green-100 hover:text-white hover:bg-green-700'
                        } px-3 py-2 rounded-md text-sm font-medium transition-colors`}
                      >
                        {item.name}
                      </Link>
                    ))}
                </div>
              </div>
              <div className="hidden sm:flex sm:items-center sm:space-x-4">
                <LanguageSelector />
                {authLinks}
              </div>
              <div className="flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-green-100 hover:bg-green-700 hover:text-white">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation
                .filter(item => item.public || currentUser)
                .map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive(item.href)
                        ? 'bg-green-700 text-white'
                        : 'text-green-100 hover:text-white hover:bg-green-700'
                    } block px-3 py-2 rounded-md text-base font-medium`}
                  >
                    {item.name}
                  </Link>
                ))}
              <div className="mt-4 border-t border-green-700 pt-4 px-3">
                <LanguageSelector />
                <div className="mt-3">
                  {authLinks}
                </div>
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}