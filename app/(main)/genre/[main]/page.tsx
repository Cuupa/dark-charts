import { redirect, notFound } from 'next/navigation';
import { chartListPath, slugToMainGenre, type ChartListPillar } from '@/lib/routes';

interface MainGenrePageProps {
  params: Promise<{ main: string }>;
  searchParams: Promise<{ pillar?: string }>;
}

export default async function MainGenrePage({ params, searchParams }: MainGenrePageProps) {
  const { main } = await params;
  const { pillar: pillarQuery } = await searchParams;
  const mainGenre = slugToMainGenre(main);

  if (!mainGenre) {
    notFound();
  }

  const pillar: ChartListPillar =
    pillarQuery === 'fan' || pillarQuery === 'club' || pillarQuery === 'streaming'
      ? pillarQuery
      : 'overview';

  redirect(chartListPath(pillar, mainGenre));
}
