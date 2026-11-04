import { StreamingChartCalculationService } from './StreamingChartCalculationService';
import { SparkKVArtistRepository } from '../repositories/SparkKVArtistRepository';

export async function calculateAndDisplayStreamingCharts() {
  const artistRepository = new SparkKVArtistRepository();
  
  const streamingService = new StreamingChartCalculationService(artistRepository);
  
  console.log('Berechne Streaming Charts...');
  const startTime = Date.now();
  
  const results = await streamingService.calculateStreamingCharts();
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log('\n=== STREAMING CHARTS ===\n');
  console.log(`Berechnet in ${duration}ms\n`);
  
  results.slice(0, 10).forEach((entry, index) => {
    const position = index + 1;
    const trend = entry.weeklyGrowth > 0 ? '↑' : entry.weeklyGrowth < 0 ? '↓' : '→';
    
    console.log(`${position.toString().padStart(2)}. ${entry.artistName}`);
    console.log(`    Score: ${entry.score.toFixed(2)}`);
    console.log(`    Popularity index: ${entry.totalStreams.toLocaleString('de-DE')}`);
    console.log(`    Wachstum: ${trend} ${entry.weeklyGrowth.toFixed(1)}%`);
    console.log(`    Engagement: ${entry.engagementRatio.toFixed(2)}`);
    console.log(`    Follower: ${entry.followerCount.toLocaleString('de-DE')}`);
    console.log('');
  });
  
  return results;
}

export async function getTopStreamingArtists(limit: number = 10) {
  const artistRepository = new SparkKVArtistRepository();
  const streamingService = new StreamingChartCalculationService(artistRepository);
  
  const results = await streamingService.calculateStreamingCharts();
  return results.slice(0, limit);
}

export async function getStreamingChartForArtist(artistId: string) {
  const artistRepository = new SparkKVArtistRepository();
  const streamingService = new StreamingChartCalculationService(artistRepository);
  
  const results = await streamingService.calculateStreamingCharts();
  
  const position = results.findIndex(r => r.artistId === artistId);
  
  if (position === -1) {
    return null;
  }
  
  return {
    ...results[position],
    position: position + 1,
    totalArtistsInChart: results.length
  };
}
