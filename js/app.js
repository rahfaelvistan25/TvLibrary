class VideoPlayer {
  constructor(){
    this.player=document.getElementById('video-player');
    this.modal=document.getElementById('player-modal');
    this.currentShow=null; this.currentSeason=null; this.playlist=[]; this.currentIndex=0;
    this.bind();
  }
  bind(){
    let saveTimer=null;
    this.player.addEventListener('ended',()=>this.onEnded());
    this.player.addEventListener('timeupdate',()=>{
      if(!this.currentShow) return;
      if(saveTimer) return;
      saveTimer=setTimeout(()=>{
        saveTimer=null;
        const ep=this.playlist[this.currentIndex];
        setLastPlayed(this.currentShow,this.currentSeason.number,ep.episode,this.player.currentTime);
      },5000);
    });
    this.player.addEventListener('pause',()=>{
      if(!this.currentShow) return;
      const ep=this.playlist[this.currentIndex];
      setLastPlayed(this.currentShow,this.currentSeason.number,ep.episode,this.player.currentTime);
    });
    document.querySelector('.close-btn').addEventListener('click',()=>this.close());
    document.querySelector('.modal-backdrop').addEventListener('click',()=>this.close());
    document.getElementById('season-select').addEventListener('change',e=>this.loadSeason(parseInt(e.target.value,10)));
    document.addEventListener('keydown',e=>{
      if(this.modal.classList.contains('hidden')) return;
      if(e.key==='Escape') this.close();
      if(e.key==='ArrowRight'&&e.shiftKey) this.playNext();
      else if(e.key==='ArrowLeft'&&e.shiftKey) this.playPrev();
      else if(e.key==='ArrowRight') this.player.currentTime+=10;
      else if(e.key==='ArrowLeft') this.player.currentTime-=10;
      else if(e.key===' '){ e.preventDefault(); this.player.paused?this.player.play():this.player.pause(); }
    });
  }
  onEnded(){
    if(!this.currentShow) return;
    const nextExists=this.currentIndex<this.playlist.length-1 || this.currentShow.seasons.some(s=>s.number===this.currentSeason.number+1);
    if(nextExists){
      const nextSeasonNum=(this.currentIndex<this.playlist.length-1)?this.currentSeason.number:this.currentSeason.number+1;
      const nextEpisodeNum=(this.currentIndex<this.playlist.length-1)?this.playlist[this.currentIndex+1].episode:(this.currentShow.seasons.find(s=>s.number===nextSeasonNum)?.episodes?.[0]?.episode||1);
      setLastPlayed(this.currentShow,nextSeasonNum,nextEpisodeNum,0);
      this.playNext();
    }else{
      clearLastPlayed(this.currentShow.id);
    }
  }
  open(show,seasonNum=1,episodeNum=1){
    this.currentShow=show;
    const last=getLastPlayed(show.id);
    const startSeason=last?.season??seasonNum;
    const startEpisode=last?.episode??episodeNum;

    this.loadSeasonOptions();
    this.loadSeason(startSeason);
    const idx=this.playlist.findIndex(e=>String(e.episode)===String(startEpisode));
    this.play(idx>=0?idx:0);

    this.modal.classList.remove('hidden');
    document.getElementById('now-playing-title').textContent=show.title;

    if(last?.position>0){
      const seek=()=>{ this.player.currentTime=last.position; this.player.removeEventListener('loadedmetadata',seek); };
      this.player.addEventListener('loadedmetadata',seek);
    }
  }
  loadSeasonOptions(){
    const select=document.getElementById('season-select');
    select.innerHTML=this.currentShow.seasons.map(s=>`<option value="${s.number}">Season ${s.number}</option>`).join('');
  }
  loadSeason(seasonNum){
    this.currentSeason=this.currentShow.seasons.find(s=>s.number===seasonNum);
    this.playlist=this.currentSeason.episodes;
    this.renderPlaylist();
    document.getElementById('season-select').value=String(seasonNum);
  }
  renderPlaylist(){
    const c=document.getElementById('episode-list');
    c.innerHTML=this.playlist.map((ep,i)=>`
      <div class="episode-item ${i===this.currentIndex?'active':''}" data-index="${i}">
        <div class="episode-number">E${String(ep.episode).padStart(2,'0')}</div>
        <div class="episode-title">${ep.title||('Episode '+ep.episode)}</div>
        <div class="episode-meta">Season ${this.currentSeason.number}</div>
      </div>
    `).join('');
    c.querySelectorAll('.episode-item').forEach(item=>{ item.addEventListener('click',e=>this.play(parseInt(e.currentTarget.dataset.index,10))); });
  }
  play(index){
    if(index<0||index>=this.playlist.length) return;
    this.currentIndex=index;
    const ep=this.playlist[index];
    const src=getEpisodePath(this.currentShow,this.currentSeason.number,ep.episode);
    if(!src){ alert('Could not resolve video.'); return; }
    this.player.src=src;
    this.player.load();
    this.player.play().catch(err=>{
      console.error('Playback error',err);
      alert('Could not load video file.');
    });
    this.updateActive();
    document.title=`${this.currentShow.title} - S${this.currentSeason.number}E${ep.episode}`;
    setLastPlayed(this.currentShow,this.currentSeason.number,ep.episode,this.player.currentTime||0);
  }
  updateActive(){ document.querySelectorAll('.episode-item').forEach((el,i)=>el.classList.toggle('active',i===this.currentIndex)); const active=document.querySelector('.episode-item.active'); if(active) active.scrollIntoView({behavior:'smooth',block:'nearest'}); }
  playNext(){ if(this.currentIndex<this.playlist.length-1) return this.play(this.currentIndex+1); const nextSeason=this.currentShow.seasons.find(s=>s.number===this.currentSeason.number+1); if(nextSeason){ this.loadSeason(nextSeason.number); this.play(0); } }
  playPrev(){ if(this.currentIndex>0) return this.play(this.currentIndex-1); const prev=this.currentShow.seasons.find(s=>s.number===this.currentSeason.number-1); if(prev){ this.loadSeason(prev.number); this.play(prev.episodes.length-1); } }
  close(){ this.player.pause(); this.modal.classList.add('hidden'); document.title='My TV & Movie Library'; }
}

const player=new VideoPlayer();

function imgWithFallback(src, alt){
  // Use given poster; if it 404s, swap to placeholder
  return `<img src="${src || 'posters/placeholder.jpg'}"
               alt="${alt}"
               onerror="this.onerror=null; this.src='posters/placeholder.jpg';"/>`;
}

function renderShows(){
  const container=document.getElementById('shows-container');
  container.innerHTML='';
  mediaLibrary.shows.forEach(show=>{
    const card=document.createElement('div');
    card.className='show-card';
    card.innerHTML=`
      ${imgWithFallback(show.poster, show.title)}
      <div class="show-info">
        <h3>${show.title}</h3>
        <div class="show-meta">
          <span>${show.seasons.length} Season${show.seasons.length>1?'s':''}</span>
        </div>
      </div>
    `;
    const last=getLastPlayed(show.id);
    if(last){
      const chip=document.createElement('div');
      chip.className='continue-chip';
      chip.textContent=`Continue S${last.season}·E${last.episode}`;
      card.appendChild(chip);
    }
    card.addEventListener('click',()=>{ if(last) player.open(show,last.season,last.episode); else player.open(show,1,1); });
    container.appendChild(card);
  });

  const featured=mediaLibrary.shows[0];
  const playBtn=document.getElementById('featured-play');
  if(featured){
    document.getElementById('featured-title').textContent=featured.title;
    document.getElementById('featured-description').textContent=featured.description||'';
    const last=getLastPlayed(featured.id);
    if(last){
      playBtn.textContent='⏯ Resume';
      playBtn.disabled=false;
      playBtn.onclick=()=>player.open(featured,last.season,last.episode);
    }else{
      playBtn.textContent='▶ Play Now';
      playBtn.disabled=false;
      playBtn.onclick=()=>player.open(featured,1,1);
    }
    // Try featured poster; fallback to placeholder handled by CSS default and below safety
    const hero=document.querySelector('.hero-section');
    const img=new Image();
    img.onload=()=>{ hero.style.backgroundImage=`linear-gradient(to bottom, rgba(0,0,0,.25), rgba(0,0,0,.9)), url('${featured.poster}')`; };
    img.onerror=()=>{ hero.style.backgroundImage=`linear-gradient(to bottom, rgba(0,0,0,.25), rgba(0,0,0,.9)), url('posters/placeholder.jpg')`; };
    img.src=featured.poster || 'posters/placeholder.jpg';
  }
}

function renderMovies(){
  const container=document.getElementById('movies-container');
  container.innerHTML='';
  mediaLibrary.movies.forEach(movie=>{
    const card=document.createElement('div');
    card.className='show-card';
    card.innerHTML=`
      ${imgWithFallback(movie.poster, movie.title)}
      <div class="show-info">
        <h3>${movie.title}</h3>
        <div class="show-meta"><span>Movie</span></div>
      </div>
    `;
    card.addEventListener('click',()=>{
      // Simple movie playback: fake a show
      const tempShow={
        id: movie.id, title: movie.title, seasons:[
          { number:1, episodes: [{ episode:1, title: movie.title, file: movie.files?.[0]?.file }] }
        ]
      };
      player.open(tempShow,1,1);
    });
    container.appendChild(card);
  });
}

function renderAll(){
  renderShows();
  renderMovies();
}

// Help toggle
document.getElementById('help-btn').addEventListener('click',()=>{
  document.getElementById('help').classList.toggle('hidden');
});

// Search filter
document.getElementById('search').addEventListener('input',e=>{
  const q=e.target.value.toLowerCase();
  document.querySelectorAll('#shows-container .show-card, #movies-container .show-card').forEach(card=>{
    const title=card.querySelector('h3').textContent.toLowerCase();
    card.style.display=title.includes(q)?'block':'none';
  });
});

// Picker wired and library restored in media_library.js
window.addEventListener('DOMContentLoaded', renderAll);
