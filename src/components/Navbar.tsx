import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

interface NavigationItem {
  name: string;
  href: string;
  public: boolean;
}

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigation: NavigationItem[] = [
    { name: 'Home', href: '/', public: true },
    { name: 'Track E-Waste', href: '/track', public: false },
    { name: 'Recycling Vendors', href: '/vendors', public: true },
    { name: 'Reports', href: '/reports', public: false },
    { name: 'Profile', href: '/profile', public: false },
  ];

  const authLinks = currentUser ? (
    <button
      onClick={handleLogout}
      className="text-green-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
    >
      Sign Out
    </button>
  ) : (
    <div className="flex space-x-4">
      <Link
        to="/login"
        className="text-green-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
      >
        Login
      </Link>
      <Link
        to="/signup"
        className="bg-white text-green-600 hover:bg-green-50 px-3 py-2 rounded-md text-sm font-medium"
      >
        Sign Up
      </Link>
    </div>
  );

  return (
    <Disclosure as="nav" className="bg-green-600">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <Link to="/" className="text-white text-xl font-bold">
                    EcoTrack
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation
                    .filter(item => item.public || currentUser)
                    .map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="text-green-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                      >
                        {item.name}
                      </Link>
                    ))}
                  {currentUser?.email === 'admin@ecotrack.com' && (
                    <Link
                      to="/admin"
                      className="text-green-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {authLinks}
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
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
                    className="text-green-100 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                  >
                    {item.name}
                  </Link>
                ))}
              {currentUser?.email === 'admin@ecotrack.com' && (
                <Link
                  to="/admin"
                  className="text-green-100 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                >
                  Admin Dashboard
                </Link>
              )}
              <div className="mt-4 border-t border-green-700 pt-4">
                {authLinks}
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}