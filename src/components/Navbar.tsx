import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Disclosure, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
// import { Feedback  from './../pages/Feedback';
interface NavigationItem {
  name: string;
  href: string;
  public: boolean;
  adminOnly?: boolean;
}

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isAdmin = currentUser?.email === 'admin@ecotrack.com';

  const navigation: NavigationItem[] = [
    { name: 'Home', href: '/', public: true },
<<<<<<< HEAD
    { name: 'Track E-Waste', href: '/track', public: false },
=======
    { name: 'Track E-Waste', href: '/track', public: false }, 
>>>>>>> 6ae428a4cac0d1b55b97ab3a8c45e8b31f2c5d53
    { name: 'Track Submission', href: '/track-submission', public: true },
    { name: 'Vendors', href: '/vendors', public: true },
    { name: 'Reports', href: '/reports', public: false },
    { name: 'Profile', href: '/profile', public: false },
    { name: 'Admin Dashboard', href: '/admin', public: false, adminOnly: true },
    { name: 'Feedback', href: '/feedback', public: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  const filteredNavigation = navigation.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    return item.public || currentUser;
  });

  const authLinks = currentUser ? (
    <button
      onClick={handleLogout}
      className="text-green-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium
                transition-colors duration-200 hover:bg-green-700"
    >
      Logout
    </button>
  ) : (
    <div className="flex items-center space-x-4">
      <Link
        to="/login"
        className="text-green-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium
                   transition-colors duration-200 hover:bg-green-700"
      >
        Login
      </Link>
      <Link
        to="/signup"
        className="bg-white text-green-600 hover:bg-green-50 px-3 py-2 rounded-md text-sm font-medium
                   transition-colors duration-200"
      >
        Sign Up
      </Link>
    </div>
  );

  return (
    <Disclosure as="nav" className="bg-green-600 shadow-lg">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Link to="/" className="text-white text-xl font-bold hover:text-green-100 transition-colors duration-200">
                    EcoTrack
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
                  {filteredNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive(item.href)
                          ? 'bg-green-700 text-white'
                          : 'text-green-100 hover:text-white hover:bg-green-700'
                      } px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="hidden sm:flex sm:items-center sm:space-x-6">
                {authLinks}
              </div>
              <div className="flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-green-100 
                                            hover:bg-green-700 hover:text-white focus:outline-none focus:ring-2 
                                            focus:ring-inset focus:ring-white transition-colors duration-200">
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

          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Disclosure.Panel className="sm:hidden">
              <div className="space-y-1 px-2 pb-3 pt-2">
                {filteredNavigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as={Link}
                    to={item.href}
                    className={`${
                      isActive(item.href)
                        ? 'bg-green-700 text-white'
                        : 'text-green-100 hover:text-white hover:bg-green-700'
                    } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
                <div className="mt-4 border-t border-green-700 pt-4">
                  {authLinks}
                </div>
              </div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
}