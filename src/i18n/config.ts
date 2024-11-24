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
            description: 'Make a difference in protecting our environment through responsible recycling.',
            features: {
              management: 'E-Waste Management',
              managementDesc: 'Properly dispose of electronic waste through our certified recycling partners.',
              impact: 'Track Your Impact',
              impactDesc: 'Monitor your contribution to reducing e-waste and environmental protection.',
              reports: 'Detailed Reports',
              reportsDesc: 'Access comprehensive reports on recycling progress and environmental impact.',
              network: 'Vendor Network',
              networkDesc: 'Connect with certified recycling partners in your area.'
            },
            stats: {
              devices: 'Devices Recycled',
              waste: 'E-Waste Processed',
              users: 'Active Users'
            },
            cta: {
              title: 'Ready to Make a Difference?',
              description: 'Join thousands of environmentally conscious individuals and organizations in making a sustainable impact.',
              button: 'Join EcoTrack Now'
            }
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
            submitting: 'Submitting...',
            successMessage: 'E-waste item submitted successfully!',
            imageUpload: {
              title: 'Upload Image',
              description: 'Drag and drop an image here, or click to select',
              formats: 'PNG, JPG, JPEG up to 10MB',
              analyzing: 'Analyzing image...'
            }
          },
          vendors: {
            title: 'Recycling Vendors',
            location: 'Location',
            materials: 'Accepted Materials',
            contact: 'Contact',
            purityRates: 'Material Purity Rates',
            resourceUsage: 'Resource Usage',
            electricity: 'Electricity',
            water: 'Water',
            labor: 'Labor',
            contactButton: 'Contact Vendor'
          },
          reports: {
            title: 'Recycling Reports',
            dateRange: {
              sixMonths: 'Last 6 Months',
              twelveMonths: 'Last 12 Months'
            },
            downloadPDF: 'Download PDF Report',
            charts: {
              monthlyTrends: 'Monthly Recycling Trends',
              categoryDistribution: 'Category Distribution',
              purityRates: 'Material Purity Rates',
              resourceUsage: 'Resource Usage Trends'
            },
            stats: {
              totalItems: 'Total Items Recycled',
              avgPurity: 'Average Purity Rate',
              totalEnergy: 'Total Energy Used',
              waterUsage: 'Water Consumption'
            }
          }
        }
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
            description: 'Marca la diferencia en la protección de nuestro medio ambiente mediante el reciclaje responsable.',
            features: {
              management: 'Gestión de Residuos',
              managementDesc: 'Elimina adecuadamente los residuos electrónicos a través de nuestros socios certificados.',
              impact: 'Seguimiento de Impacto',
              impactDesc: 'Monitorea tu contribución a la reducción de residuos electrónicos y la protección ambiental.',
              reports: 'Informes Detallados',
              reportsDesc: 'Accede a informes completos sobre el progreso del reciclaje y el impacto ambiental.',
              network: 'Red de Proveedores',
              networkDesc: 'Conéctate con socios de reciclaje certificados en tu área.'
            },
            stats: {
              devices: 'Dispositivos Reciclados',
              waste: 'Residuos Procesados',
              users: 'Usuarios Activos'
            },
            cta: {
              title: '¿Listo para Hacer la Diferencia?',
              description: 'Únete a miles de personas y organizaciones conscientes del medio ambiente para crear un impacto sostenible.',
              button: 'Únete a EcoTrack Ahora'
            }
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
            submitting: 'Enviando...',
            successMessage: '¡Artículo enviado con éxito!',
            imageUpload: {
              title: 'Subir Imagen',
              description: 'Arrastra y suelta una imagen aquí, o haz clic para seleccionar',
              formats: 'PNG, JPG, JPEG hasta 10MB',
              analyzing: 'Analizando imagen...'
            }
          },
          vendors: {
            title: 'Proveedores de Reciclaje',
            location: 'Ubicación',
            materials: 'Materiales Aceptados',
            contact: 'Contacto',
            purityRates: 'Tasas de Pureza de Materiales',
            resourceUsage: 'Uso de Recursos',
            electricity: 'Electricidad',
            water: 'Agua',
            labor: 'Mano de Obra',
            contactButton: 'Contactar Proveedor'
          },
          reports: {
            title: 'Informes de Reciclaje',
            dateRange: {
              sixMonths: 'Últimos 6 Meses',
              twelveMonths: 'Últimos 12 Meses'
            },
            downloadPDF: 'Descargar Informe PDF',
            charts: {
              monthlyTrends: 'Tendencias Mensuales de Reciclaje',
              categoryDistribution: 'Distribución por Categoría',
              purityRates: 'Tasas de Pureza de Materiales',
              resourceUsage: 'Tendencias de Uso de Recursos'
            },
            stats: {
              totalItems: 'Total de Artículos Reciclados',
              avgPurity: 'Tasa de Pureza Promedio',
              totalEnergy: 'Energía Total Utilizada',
              waterUsage: 'Consumo de Agua'
            }
          }
        }
      }
    }
  });

export default i18n;