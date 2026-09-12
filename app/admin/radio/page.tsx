import { RadioMonitorContainer } from '@/components/admin/RadioMonitorContainer';
import { AdminPageShell } from '../_components/AdminPageShell';

export const dynamic = 'force-dynamic';

export default function AdminRadioPage() {
  return (
    <AdminPageShell
      title="Radio Monitor"
      description="Discover public dark-scene streams, enable passive metadata probes, and review airplay detections. Radios never install anything or send us data."
    >
      <RadioMonitorContainer />
    </AdminPageShell>
  );
}
