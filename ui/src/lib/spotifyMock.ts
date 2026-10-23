/** Browser development fixtures for Exo's Spotify room (no Spotify behind them). */
import type { PlayerCard, PlayerTrack, PlayerViewData } from './player'

const card = (kind: string, n: number, extra: Partial<PlayerCard> = {}): PlayerCard =>
  ({ uri: `spotify:${kind}:mock${kind}${n}`, kind, title: `${kind[0].toUpperCase()}${kind.slice(1)} ${n}`, subtitle: 'Mock', image: '', ...extra })
const track = (n: number, extra: Partial<PlayerTrack> = {}): PlayerTrack => ({
  uri: `spotify:track:mocktrack${n}`, uid: `uid${n}`, title: `Song ${n}`, artists: [{ uri: 'spotify:artist:mockartist1', name: 'Artist 1' }],
  album: { uri: 'spotify:album:mockalbum1', name: 'Album 1' }, image: '', durationMs: 180_000 + n * 1000, explicit: n % 5 === 0, playable: true, liked: n % 2 === 0, ...extra,
})
const episode = (n: number): PlayerTrack => track(n, {
  uri: `spotify:episode:mockepisode${n}`, title: `Episode ${n}`, album: null, artists: [{ uri: '', name: 'Mock Podcasts' }],
  date: `2026-10-${String(10 + n).padStart(2, '0')}`, played: n === 1, progressMs: n === 2 ? 600_000 : undefined, durationMs: 2_400_000,
})
const many = <T,>(count: number, make: (n: number) => T) => Array.from({ length: count }, (_, i) => make(i + 1))

const VIEWS: Record<string, (params: Record<string, unknown>) => PlayerViewData> = {
  home: () => ({ greeting: 'Good evening', sections: [{ title: 'Made for you', items: many(8, n => card('playlist', n, { subtitle: 'Daily Mix' })) }] }),
  recent: () => ({ items: many(6, n => card('album', n)) }),
  library: () => ({
    items: [card('collection', 0, { uri: 'spotify:user:me:collection', title: 'Liked Songs', subtitle: '' }), card('folder', 1, { uri: 'spotify:user:me:folder:f1', subtitle: '3 playlists' }),
      ...many(6, n => card('playlist', n, { owned: n < 4, pinned: n === 1 })), card('artist', 1), card('album', 1), card('show', 1, { subtitle: 'Mock Podcasts' })],
    filters: [{ id: 'playlists', name: 'Playlists' }, { id: 'artists', name: 'Artists' }, { id: 'albums', name: 'Albums' }, { id: 'podcasts', name: 'Podcasts' }],
    filter: '', sorts: [{ id: 'recents', name: 'Recents' }, { id: 'alpha', name: 'Alphabetical' }], sort: 'recents', folder: null,
  }),
  playlist: params => ({
    header: { uri: String(params.uri), title: 'Playlist 1', subtitle: 'You', image: '', description: 'A mock playlist', editable: true, owned: true, public: true, collaborative: false, downloaded: false },
    contextUri: String(params.uri), tracks: many(12, n => track(n)), offset: 0, total: 12,
  }),
  album: params => ({
    header: { uri: String(params.uri), title: 'Album 1', subtitle: 'Artist 1 · 2024', image: '', artists: [{ uri: 'spotify:artist:mockartist1', name: 'Artist 1' }], saved: true,
      date: '2024-03-08', label: 'Mock Records', copyright: ['© 2024 Mock Records', '℗ 2024 Mock Records'], durationMs: 2_400_000, downloaded: true },
    contextUri: String(params.uri), tracks: many(10, n => track(n)), offset: 0, total: 10, albums: many(5, n => card('album', n + 1)),
  }),
  artist: params => ({
    header: { uri: String(params.uri), title: 'Artist 1', subtitle: '12,345,678 monthly listeners', image: '', saved: false },
    contextUri: String(params.uri), tracks: many(5, n => track(n)), albums: many(6, n => card('album', n)), singles: many(4, n => card('album', n + 10)),
    compilations: [], appearsOn: many(3, n => card('album', n + 20)), featuring: many(4, n => card('playlist', n + 10)), discoveredOn: many(3, n => card('playlist', n + 20)),
    playlists: [], related: many(6, n => card('artist', n + 1)),
    about: { bio: 'A mock artist whose biography runs long enough to need More. '.repeat(8), followers: 1_234_567, listeners: 12_345_678, rank: 321, image: '',
      cities: [{ city: 'Stockholm', country: 'SE', listeners: 120_000 }, { city: 'London', country: 'GB', listeners: 98_000 }], links: [{ name: 'Instagram', url: 'https://instagram.com/' }] },
    concerts: [{ title: 'Mock Tour', date: '2026-11-21T20:00:00', place: 'Berlin', venue: 'Mock Arena', uri: '' }, { title: 'Mock Tour', date: '2026-11-23T20:00:00', place: 'Paris', venue: 'Mock Hall', uri: '' }],
  }),
  discography: () => ({ items: many(20, n => card('album', n, { subtitle: `${2026 - n} · Album` })), offset: 0, total: 20 }),
  show: params => ({
    header: { uri: String(params.uri), title: 'Show 1', subtitle: 'Mock Podcasts', image: '', description: 'A mock podcast', saved: true, downloaded: null },
    contextUri: String(params.uri), tracks: many(6, episode), offset: 0, total: 6,
  }),
  songs: params => ({ contextUri: 'spotify:user:me:collection', tracks: many(40, n => track(n, { liked: true })), offset: Number(params.offset) || 0, total: 40, liked: true,
    sorts: [{ id: 'added', name: 'Date added' }, { id: 'title', name: 'Title' }], sort: 'added', tags: [{ id: 'tag0', name: 'Pop' }, { id: 'tag1', name: 'Chill' }, { id: 'tag2', name: 'Rock' }] }),
  search: () => ({ top: [card('artist', 1)], tracks: many(6, n => track(n)), artists: many(4, n => card('artist', n)), albums: many(4, n => card('album', n)),
    playlists: [], shows: [], audiobooks: many(3, n => card('show', n + 5, { subtitle: 'Author' })), episodes: many(2, episode) }) as unknown as PlayerViewData,
  credits: () => ({ title: 'Song 1', groups: [{ role: 'Performed by', people: [{ name: 'Artist 1', uri: 'spotify:artist:mockartist1' }] }, { role: 'Written by', people: [{ name: 'Writer', uri: '' }] }], sources: 'Mock Records' }),
  radio: () => ({ uri: 'spotify:playlist:mockradio' }),
  player: () => ({ trackUri: 'spotify:track:mocktrack1', contextUri: '', shuffle: false, repeat: 0, liked: true, canShuffle: true, canRepeat: true, speed: 1, title: 'Song 1', artists: [{ uri: 'spotify:artist:mockartist1', name: 'Artist 1' }] }) as unknown as PlayerViewData,
  queue: () => ({ current: track(1), queued: many(3, n => track(n + 1)), next: many(3, n => track(n + 5)) }),
  devices: () => ({ devices: [{ id: 'd1', name: 'This PC', type: 'COMPUTER', active: true, local: true }, { id: 'd2', name: 'Kitchen', type: 'SPEAKER', active: false, local: false }] }),
  jam: () => ({ experience: 'PREMIUM', session: { owner: true, link: 'https://spotify.link/mockjam', canRemove: true, guestsPlay: true, guestVolume: false,
    members: [{ id: 'm1', name: 'You', image: '', me: true, host: true }, { id: 'm2', name: 'Friend', image: '', me: false, host: false }] } }),
  friends: () => ({ friends: [] }),
  lyrics: () => ({ lines: [], synced: false }),
  playlists: () => ({ items: many(4, n => card('playlist', n)) }),
  audio: () => ({ quality: 5, lossless: true, crossfade: false, crossfadeMs: 5000, gapless: true, autoMix: false, normalize: true, mono: false, exclusive: false, smartShuffle: null,
    equalizer: { supported: false, enabled: null, filters: null } }) as unknown as PlayerViewData,
}

export const spotifyMock = {
  'spotify.start': () => ({ ok: true, state: 'running' }),
  'spotify.leave': () => ({ ok: true }),
  'spotify.signIn': () => ({ ok: true }),
  'spotify.view': (params?: Record<string, unknown>) => {
    const view = VIEWS[String(params?.view)]
    return view ? { ok: true, data: view(params ?? {}) } : { ok: false, message: 'Not in the mock.' }
  },
  'spotify.link': (params?: Record<string, unknown>) => {
    const url = String(params?.url ?? '')
    const jam = /socialsession[/:]([\w-]{4,80})/.exec(url)?.[1] ?? (/spotify(-alternate)?\.(app\.)?link\//.test(url) ? 'mockjam' : null)
    const page = /(track|album|playlist|artist|show|episode)[/:]([A-Za-z0-9]{22})/.exec(url)
    return jam ? { ok: true, uri: `spotify:socialsession:${jam}` } : page ? { ok: true, uri: `spotify:${page[1]}:${page[2]}` } : { ok: false, message: 'That is not a Spotify link.' }
  },
  'spotify.act': (params?: Record<string, unknown>) =>
    ({ ok: true, uri: params?.action === 'createPlaylist' ? 'spotify:playlist:mocknew' : null }),
}
