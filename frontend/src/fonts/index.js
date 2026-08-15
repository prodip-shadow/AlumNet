import {
  EB_Garamond,
  Federant,
  Geist,
  Geist_Mono,
  IBM_Plex_Sans,
  Plaster,
  Press_Start_2P,
} from 'next/font/google';

export const ebGaramondHeading = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-heading',
});

export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});


export const pressStart = Federant({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start',
});
