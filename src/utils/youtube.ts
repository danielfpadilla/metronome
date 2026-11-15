const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;

export function isValidYouTubeUrl(url: string): boolean {
  return YOUTUBE_REGEX.test(url.trim());
}

export function extractVideoId(url: string): string | null {
  const match = url.trim().match(YOUTUBE_REGEX);
  return match ? match[4] : null;
}

export function getThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}