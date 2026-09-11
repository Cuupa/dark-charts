'use client';

import { notFound } from 'next/navigation';
import { use } from 'react';
import { slugToMainGenre } from '@/lib/routes';
import { GenrePageClient } from '../../_components/GenrePageClient';

interface MainGenrePageProps {
  params: Promise<{ main: string }>;
}

export default function MainGenrePage({ params }: MainGenrePageProps) {
  const { main } = use(params);
  const mainGenre = slugToMainGenre(main);

  if (!mainGenre) {
    notFound();
  }

  return <GenrePageClient mainGenre={mainGenre} />;
}
