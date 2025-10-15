// Dynamic library using folder picker + localStorage persistence
// Posters fallback to posters/placeholder.jpg if not found

window.mediaLibrary = { shows: [], movies: [] };

// Persist library
const LIB_KEY = "tvlib.folderlibrary.v1";
function saveLibrary(data){ try{ localStorage.setItem(LIB_KEY, JSON.stringify(data)); }catch{} }
function loadLibrary(){ try{ return JSON.parse(localStorage.getItem(LIB_KEY)) || {shows:[], movies:[]}; }catch{ return {shows:[], movies:[]}; } }

// Continue Watching
const WATCH_KEY="tvlib.watchstate.v1";
function loadWatch(){ try{ return JSON.parse(localStorage.getItem(WATCH_KEY))||{} }catch{ return {} } }
function saveWatch(s){ try{ localStorage.setItem(WATCH_KEY, JSON.stringify(s)); }catch{} }
function showKey(id){ return `show:${id}` }
function setLastPlayed(show, season, episode, pos=0){ const st=loadWatch(); st[showKey(show.id)]={showId:show.id,season,episode,position:Math.max(0,Math.floor(pos)),updatedAt:Date.now()}; saveWatch(st); }
function getLastPlayed(id){ const st=loadWatch(); return st[showKey(id)]||null }
function clearLastPlayed(id){ const st=loadWatch(); delete st[showKey(id)]; saveWatch(st) }
window.setLastPlayed=setLastPlayed; window.getLastPlayed=getLastPlayed; window.clearLastPlayed=clearLastPlayed;

// Build library from FileList
function buildFromFileList(files) {
  const movies = {};
  const shows = {};
  const videoOk = name => /\.(mp4|mkv|webm|avi|mov)$/i.test(name);

  for (const f of files) {
    if (!videoOk(f.name)) continue;
    const rel = f.webkitRelativePath || f.name;
    const parts = rel.split('/');

    const top = (parts[0]||'').toLowerCase();
    if (top === 'movie' && parts.length >= 3) {
      const title = parts[1];
      movies[title] = movies[title] || [];
      movies[title].push({ file: f, filename: parts.slice(2).join('/') });
    } else if (top === 'tv series' && parts.length >= 4) {
      const show = parts[1];
      const seasonFolder = parts[2];
      const filename = parts.slice(3).join('/');

      const m = filename.match(/S(\d{2})E(\d{2})/i);
      const seasonNum = m ? parseInt(m[1],10) : parseInt(seasonFolder.replace(/\D/g,''),10) || 1;
      const epNum = m ? parseInt(m[2],10) : null;

      shows[show] = shows[show] || {};
      shows[show][seasonNum] = shows[show][seasonNum] || [];
      shows[show][seasonNum].push({
        episode: epNum || (shows[show][seasonNum].length + 1),
        file: f,
        filename
      });
    }
  }

  window.mediaLibrary.shows = Object.entries(shows).map(([name, seasonsObj]) => {
    const id = name.toLowerCase().replace(/\s+/g,'-');
    return {
      id,
      title: name,
      poster: `posters/${id}.jpg`,
      seasons: Object.entries(seasonsObj).map(([num, eps]) => ({
        number: parseInt(num,10),
        folder: `Season ${String(num).padStart(2,'0')}`,
        episodes: eps.sort((a,b)=>a.episode-b.episode).map(e => ({
          episode: e.episode, title: e.filename, file: e.file
        }))
      })).sort((a,b)=>a.number-b.number)
    };
  });

  window.mediaLibrary.movies = Object.entries(movies).map(([title, items]) => {
    const id = title.toLowerCase().replace(/\s+/g,'-');
    return {
      id,
      title,
      poster: `posters/${id}.jpg`,
      files: items
    };
  });

  saveLibrary({ shows: window.mediaLibrary.shows, movies: window.mediaLibrary.movies });
}

// Video URLs (blob)
function getEpisodePath(show, seasonNum, episodeNum) {
  const season = show.seasons.find(s => s.number === seasonNum);
  const ep = season?.episodes?.find(e => String(e.episode) === String(episodeNum));
  return ep?.file ? URL.createObjectURL(ep.file) : null;
}
window.getEpisodePath = getEpisodePath;

function getMoviePath(movie) {
  const f = movie.files?.[0];
  return f?.file ? URL.createObjectURL(f.file) : null;
}
window.getMoviePath = getMoviePath;

// Picker wiring + initial load
function wirePicker() {
  const picker = document.getElementById('picker');
  const btn = document.getElementById('pick-folders');
  btn.addEventListener('click', () => picker.click());
  picker.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    buildFromFileList(files);
    renderAll();
  });
}
window.addEventListener('DOMContentLoaded', () => {
  wirePicker();
  const lib = loadLibrary();
  if (lib.shows.length || lib.movies.length) {
    window.mediaLibrary.shows = lib.shows;
    window.mediaLibrary.movies = lib.movies;
  }
});
