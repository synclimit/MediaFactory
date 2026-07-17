const titles = [
  'New West - Those Eyes (Mix Lyrics) Seafret, d4vd',
  'HONNE - Location Unknown ◐ (feat. BEKA) (Brooklyn Session)',
  'Artist - Song (Official Video)',
  'Artist - Song (Audio)',
  'Something feat. John Doe',
  'Song [Official Video] HD',
  'Another Song (Lyric Video) ft. Someone'
];

function normalizeYouTubeTitle(rawTitle) {
  if (!rawTitle) return '';
  let title = rawTitle;

  const suffixes = [
    'official video',
    'official music video',
    'mix lyrics',
    'lyrics',
    'lyric video',
    'audio',
    'visualizer',
    'live',
    'brooklyn session'
  ];
  
  const suffixPattern = new RegExp(`[\\(\\[]\\s*(?:${suffixes.join('|')})\\s*[\\)\\]].*$`, 'gi');
  title = title.replace(suffixPattern, '');

  title = title.replace(/(?:\(|\[)?\s*\b(?:feat\.|ft\.|featuring)\s+.*$/i, '');

  return title.replace(/\s*[-|/]*\s*$/, '').trim().replace(/\s{2,}/g, ' ');
}

titles.forEach(t => console.log(t, '->', normalizeYouTubeTitle(t)));
