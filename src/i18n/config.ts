import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: {
          nav: {
            home: 'Home',
            track: 'Track E-Waste',
            vendors: 'Recycling Vendors',
            reports: 'Reports',
            profile: 'Profile',
            login: 'Login',
            signup: 'Sign Up',
            logout: 'Sign Out',
          },
          home: {
            title: 'Welcome to EcoTrack',
            subtitle: 'Join the movement towards sustainable e-waste management',
            getStarted: 'Get Started',
            signIn: 'Sign In',
          },
          track: {
            title: 'Track E-Waste',
            itemType: 'Item Type',
            brand: 'Brand',
            model: 'Model',
            weight: 'Weight (kg)',
            condition: 'Condition',
            location: 'Drop-off Location',
            description: 'Additional Description',
            submit: 'Submit E-Waste',
          },
        },
      },
      es: {
        translation: {
          nav: {
            home: 'Inicio',
            track: 'Seguimiento',
            vendors: 'Proveedores',
            reports: 'Informes',
            profile: 'Perfil',
            login: 'Iniciar Sesión',
            signup: 'Registrarse',
            logout: 'Cerrar Sesión',
          },
          home: {
            title: 'Bienvenido a EcoTrack',
            subtitle: 'Únete al movimiento hacia la gestión sostenible de residuos electrónicos',
            getStarted: 'Comenzar',
            signIn: 'Iniciar Sesión',
          },
          track: {
            title: 'Seguimiento de Residuos',
            itemType: 'Tipo de Artículo',
            brand: 'Marca',
            model: 'Modelo',
            weight: 'Peso (kg)',
            condition: 'Condición',
            location: 'Ubicación',
            description: 'Descripción Adicional',
            submit: 'Enviar',
          },
        },
      },
    },
  });

export default i18n;