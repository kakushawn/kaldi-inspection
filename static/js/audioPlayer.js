// reference : https://codepen.io/EmNudge/pen/rRbLJQ
// Possible improvements:
// - Change timeline and volume slider into input sliders, reskinned
// - Change into Vue or React component
// audiobuffer to url : https://stackoverflow.com/questions/51407041/using-audiobuffer-as-a-source-for-a-htmlaudioelement

class AudioPlayer { 
  constructor( audioUrl ) {
    this.audioPlayer = document.querySelector(".audio-player");
    this.audioUrl = audioUrl ;
    this.audio = new Audio(this.audioUrl);
    // console.dir(this.audio);
    
    this.timeline = this.audioPlayer.querySelector(".timeline");
    this.timeText = this.audioPlayer.querySelector(".time .current");
    this.progressBar = this.audioPlayer.querySelector(".progress");
    this.volumeSlider = this.audioPlayer.querySelector(".controls .volume-slider");
    this.playBtn = this.audioPlayer.querySelector(".controls .toggle-play");
    this.volumeBtn = this.audioPlayer.querySelector(".volume-button");
    this.volumeCtn = this.audioPlayer.querySelector(".volume-container .volume");
    this.volumeBar = this.audioPlayer.querySelector(".controls .volume-percentage");
    this.downloadBtn = this.audioPlayer.querySelector(".download-button");
    this.NameText = this.audioPlayer.querySelector(".name");
    
    this.setEventListener();
  }
  
  
  // initial setting : audio duration & volume & download link
  initialInfo() {
    this.duration = this.audio.duration ;
    this.audioPlayer.querySelector(".time .length").textContent = this.getTimeCodeFromNum(
      this.duration
    );
    this.audio.volume = 0.5;
    this.downloadBtn.setAttribute("href" , this.audioUrl);
  }
  
  // add Event Listener
  setEventListener() {
    // initial setting : audio duration & volume
    this.audio.addEventListener(
      "loadedmetadata",
      () => {
        this.initialInfo() ;
      },
      false
    );
    
    //click or drag on timeline to skip around
    this.timeline.addEventListener(
      "click",
      (e) => {
        this.changeTime(e.offsetX) ;
      },
      false
    );
    this.timeline.addEventListener(
      "mousedown",
      () => {
        this.timeClicked = true ;
      },
      false
    );
    this.timeline.addEventListener(
      "mousemove",
      (e) => {
        if( this.timeClicked ){
          this.changeTime(e.offsetX) ;
        }
      },
      false
    );
    this.timeline.addEventListener(
      "mouseup",
      () => {
        this.timeClicked = false ;
      },
      false
    );
    
    //click or drag volume slider to change volume
    this.volumeSlider.addEventListener(
      "click",
      (e) => {
        this.changeVolume(e.offsetX) ;
      },
      false
    );
    this.volumeSlider.addEventListener(
      "mousedown",
      () => {
        this.volumeClicked = true ;
      },
      false
    );
    this.volumeSlider.addEventListener(
      "mousemove",
      (e) => {
        if( this.volumeClicked ){
          this.changeVolume(e.offsetX) ;
        }
      },
      false
    );
    this.volumeSlider.addEventListener(
      "mouseup",
      () => {
        this.volumeClicked = false ;
      },
      false
    );
    
    //check audio percentage and update time accordingly
    this.audio.addEventListener(
      "timeupdate",
      () => {
        this.progressBar.style.width = (this.audio.currentTime / this.duration) * 100 + "%";
        this.timeText.textContent = this.getTimeCodeFromNum(
          this.audio.currentTime
        );
      },
      false
    );

    //change button class between playing and pausing
    this.audio.addEventListener(
      "play",
      () => {
        this.playBtn.classList.remove("play");
        this.playBtn.classList.add("pause");
      },
      false
    );    
    this.audio.addEventListener(
      "pause",
      () => {
        this.playBtn.classList.remove("pause");
        this.playBtn.classList.add("play");
      },
      false
    );

    //toggle between playing and pausing on button click
    this.playBtn.addEventListener(
      "click",
      () => {
        if (this.audio.paused) {
          this.audio.play();
        } else {
          this.audio.pause();
        }
      },
      false
    );
    
    //toggle between mute and unmute on volume click
    this.volumeBtn.addEventListener(
      "click", 
      () => {
        this.audio.muted = !this.audio.muted;
        if (this.audio.muted) {
          this.volumeCtn.classList.remove("icono-volumeMedium");
          this.volumeCtn.classList.add("icono-volumeMute");
        } else {
          this.volumeCtn.classList.add("icono-volumeMedium");
          this.volumeCtn.classList.remove("icono-volumeMute");
        }
      },
      false
    );
    // End setEventListener
  }
  
  // change audio currentTime using time line bar
  changeTime(offsetX) {
    const timelineWidth = window.getComputedStyle(this.timeline).width;
    const timeToSeek = (offsetX / parseInt(timelineWidth)) * this.duration;
    this.audio.currentTime = timeToSeek;
  }
  
  // change audio volume & volume bar width
  changeVolume(offsetX) {
    const sliderWidth = window.getComputedStyle(this.volumeSlider).width;
    const newVolume = offsetX / parseInt(sliderWidth);
    this.audio.volume = newVolume;
    this.volumeBar.style.width = newVolume * 100 + "%";
  }
  
  //turn seconds into timestamp HH:mm:ss
  getTimeCodeFromNum(num) {
    let seconds = parseInt(num);
    let minutes = parseInt(seconds / 60);
    seconds -= minutes * 60;
    const hours = parseInt(minutes / 60);
    minutes -= hours * 60;

    if (hours === 0) return `${minutes}:${String(seconds % 60).padStart(2, 0)}`;
    return `${String(hours).padStart(2, 0)}:${minutes}:${String(
      seconds % 60
    ).padStart(2, 0)}`;
  }
}

// gen. audio player format HTML
function makeAudioPlayerHtml( uttid ) {
    /*  <!-- credit for icon to https://saeedalipoor.github.io/icono/ --> */
    let playerHtml = "";
    playerHtml += "<div class=\"audio-box\">" ;
    
    playerHtml += "<div class=\"audio-player\">" ;
    
    playerHtml += "<div class=\"timeline\">" ;
    playerHtml += "<div class=\"progress\"></div>" ;
    playerHtml += "</div>" ;
    playerHtml += "<div class=\"controls\">" ;

    playerHtml += "<div class=\"play-container\">" ;
    playerHtml += "<div class=\"toggle-play play\"></div>" ;
    playerHtml += "</div>" ;
    playerHtml += "<div class=\"time\">" ;
    playerHtml += "<div class=\"current\">0:00</div>" ;
    playerHtml += "<div class=\"divider\">/</div>" ;
    playerHtml += "<div class=\"length\"></div>" ;
    playerHtml += "</div>" ;
    playerHtml += "<div class=\"name\">" + uttid + "</div>" ;
    playerHtml += "<div class=\"volume-container\">" ;
    playerHtml += "<div class=\"volume-button\">" ;
    playerHtml += "<div class=\"volume icono-volumeMedium\"></div>" ;
    playerHtml += "</div>" ;
    playerHtml += "<div class=\"volume-slider\">" ;
    playerHtml += "<div class=\"volume-percentage\"></div>" ;
    playerHtml += "</div>" ;
    playerHtml += "</div>" ;
    playerHtml += "<div class=\"download\">" ;
    playerHtml += "<div class=\"download-container\">" ;
    playerHtml += "<a class=\"download-button\" download=\"" + uttid + "\">" ; 
    playerHtml += "<div class=\"download-icon icono-downArrow\"></div>" ;
    playerHtml += "</a>" ;
    playerHtml += "</div>" ;
    playerHtml += "</div>" ;
    
    playerHtml += "</div>" ;
    
    playerHtml += "</div>" ;
    
    playerHtml += "</div>" ;

    return playerHtml ;
}
