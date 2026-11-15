import { describe, it, expect } from 'vitest';
import { isValidYouTubeUrl, extractVideoId, getThumbnailUrl } from '@/utils/youtube';

describe('youtube', () => {
  it('validates standard YouTube URLs', () => {
    expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    expect(isValidYouTubeUrl('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe(true);
  });
  it('rejects invalid URLs', () => {
    expect(isValidYouTubeUrl('https://example.com')).toBe(false);
    expect(isValidYouTubeUrl('not a url')).toBe(false);
  });
  it('extracts video ID', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('generates thumbnail URL', () => {
    expect(getThumbnailUrl('dQw4w9WgXcQ')).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg');
  });
});