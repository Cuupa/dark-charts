export interface DiscoveredStation {
  name: string;
  streamUrl: string;
  homepageUrl: string | null;
  country: string | null;
  tags: string[];
  bitrate: number | null;
  codec: string | null;
  externalId: string;
  discoverySource: 'radio_browser' | 'shoutcast';
}

export interface DiscoveryOptions {
  fetchImpl?: typeof fetch;
  userAgent: string;
}
