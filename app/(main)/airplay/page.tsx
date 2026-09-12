import type { Metadata } from 'next';
import { AirplayDashboardClient } from './AirplayDashboardClient';

export const metadata: Metadata = {
  title: 'Airplay detections | Dark Charts',
  description:
    'Where Dark Charts detected your catalog on publicly reachable dark-scene internet radios.',
};

export default function AirplayDashboardPage() {
  return <AirplayDashboardClient />;
}
