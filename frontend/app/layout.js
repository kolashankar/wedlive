import { Inter, Great_Vibes, Playfair_Display, Cinzel, Montserrat, Lato, Caveat, Bebas_Neue, Rozha_One, Pinyon_Script } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from '@/components/ui/sonner';

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
      <body className={`${inter.className} ${inter.variable} ${greatVibes.variable} ${playfair.variable} ${cinzel.variable} ${montserrat.variable} ${lato.variable} ${caveat.variable} ${bebasNeue.variable} ${rozhaOne.variable} ${pinyonScript.variable}`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
