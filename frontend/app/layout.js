import { Inter, Great_Vibes, Playfair_Display, Cinzel, Montserrat, Lato, Caveat, Bebas_Neue, Rozha_One, Pinyon_Script } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from '@/components/ui/sonner';
import { FontProvider } from '@/contexts/FontContext';
import { BorderProvider } from '@/contexts/BorderContext';
import SessionExpiry from '@/components/SessionExpiry';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const greatVibes = Great_Vibes({ weight: '400', subsets: ['latin'], variable: '--font-greatvibes' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });
const lato = Lato({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-lato' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' });
const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' });
const rozhaOne = Rozha_One({ weight: '400', subsets: ['latin'], variable: '--font-rozha' });
const pinyonScript = Pinyon_Script({ weight: '400', subsets: ['latin'], variable: '--font-pinyon' });

export const metadata = {
  title: 'WedLive - Live Wedding Streaming Platform',
  description: 'Professional live wedding streaming made simple',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* TASK 2 FIX: Suppress Google DoubleClick CORS errors */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress external CORS errors that don't affect app functionality
              window.addEventListener('error', function(e) {
                // Suppress Google DoubleClick and external ad/analytics errors
                if (e.message && (
                  e.message.includes('doubleclick.net') ||
                  e.message.includes('googleads') ||
                  e.message.includes('Cross-Origin Request Blocked')
                )) {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                  return false;
                }
              }, true);
              
              // Suppress unhandled promise rejections from external scripts
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && e.reason.message && (
                  e.reason.message.includes('doubleclick.net') ||
                  e.reason.message.includes('googleads')
                )) {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                  return false;
                }
              });
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${inter.variable} ${greatVibes.variable} ${playfair.variable} ${cinzel.variable} ${montserrat.variable} ${lato.variable} ${caveat.variable} ${bebasNeue.variable} ${rozhaOne.variable} ${pinyonScript.variable}`}>
        <AuthProvider>
          <FontProvider>
            <BorderProvider>
              {children}
              <SessionExpiry />
              <Toaster />
            </BorderProvider>
          </FontProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
