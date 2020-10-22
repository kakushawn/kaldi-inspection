class AudioScoreDrawer {
  //constructor(targetId, audioData, data, waveColors, scoreColors, interactionId){
  constructor(id, audioData, data, audioSegments, waveColors, scoreColors) {
    this.id = id;
    //this.targetId= targetId;
    this.audioData = audioData;
    this.data = data;
    this.waveColors = waveColors;
    this.scoreColors = scoreColors;
    this.segments = audioSegments;
    //this.interactionId = interactionId;

    this.dataUrl = null;
    this.audioDataUrl = null;

    // Setting
    this.silenceColor = "#FFFFFF";
    // top, right, bottom, left
    this.paddings = [50, 20, 50, 20];
    this.scorePhoneBlockLineWidth = 1;
    this.clickedRegionLineWidth = 8;
    this.clickedRegionColor = "#46ECC8";
    // canvas overflow limit
    this.overflowPoint = 10 ;

    // Create canvas for drawing and intersection
    this.idSel = $(`#${this.id}`);
    this.idSel.addClass("audioScoreDrawer");
    let drawerHTML = "<div class=\"audioScoreDrawer_utt\"> <h4 id=\"uttid\">" + this.data.Utterance + "</h4> </div>" ;
    drawerHTML += "<div class=\"audioScoreDrawer_title\"> <p id=\"text\">ref: " + this.data.text + "</p> </div>" ;
    drawerHTML += makeAudioPlayerHtml(this.data.Utterance) ;
    drawerHTML += "<div class=\"canvas_area\"> <canvas class=\"audioScoreDrawer_result\"></canvas> <canvas class=\"audioScoreDrawer_clickedResult\"></canvas> </div>" ;
    this.idSel.append( drawerHTML ) ;

    this.canvas_area = this.idSel.find(".canvas_area");
    this.targetSel = this.idSel.find("canvas").eq(0)[0];
    this.ctx = this.targetSel.getContext("2d");
    this.interactionSel = this.idSel.find("canvas").eq(1)[0];
    this.ctxInteraction = this.interactionSel.getContext("2d");

    // canvas player
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();

    // Interaction
    this.clickedRegion = null;
    this.isInteractionEventSet = false;

    this.initial()
  }

  initial() {
    // Get score data
    // Support URL
    if (this.isString(this.data)) {
      this.dataUrl = this.data;
      this.data = this.getDataFromUrl(this.dataUrl);
    }
    this.scoreData = this.getScoreData(this.data);

    // Get audio data
    // Support URL
    if (this.isString(this.audioData)) {
      this.audioDataUrl = this.audioData;
      this.audioData = this.getAudioDataFromUrl(this.audioDataUrl, () => {
        this.initialInfo();
      });
    } else {
      this.initialInfo();
    }
  }

  initialInfo() {

    // Get and compute necessary information
    this.channelData = [];
    for (let i = 0; i < this.audioData.numberOfChannels; i++) {
      this.channelData.push(this.audioData.getChannelData(i));
    }
    this.sampleRate = this.audioData.sampleRate;
    this.sampleAmount = this.channelData[0].length;
    this.duration = this.audioData.duration;

    let waveMinMax = this.findMinMaxChannelData();
    this.waveMaxAbsValue = Math.max(Math.abs(waveMinMax[0]), Math.abs(waveMinMax[1]));

    // Interaction
    // Collect interval of phones
    // [[<start time>, <end time>]]
    this.phonesInternal = [];
    this.scoreData.forEach(word => {
      word.phone.forEach(phone => {
        this.phonesInternal.push(phone.interval);
      });
    });

    // audio player
    let waveBlob = bufferToWave( this.audioData ) ;
    let waveUrl = URL.createObjectURL( waveBlob ) ;
    this.audioPlayer = new AudioPlayer( waveUrl );

    // Add click event
    this.clickEvent();

    this.draw();
    $(window).resize(() => {
      // only resize with non-overflow canvas
      if( this.duration <= this.overflowPoint ){
        this.draw();
      }
    });
  }

  setInfo() {
    this.height = this.targetSel.scrollHeight;
    this.width = this.targetSel.scrollWidth;
    if( this.duration > this.overflowPoint ){
        // let canvas overflow if audio is too long
        this.width = 2000; // 2000px
        this.targetSel.setAttribute("style","width: 2000px");
        this.interactionSel.setAttribute("style","width: 2000px");
    }
    this.scoreBlkLength = this.height - this.paddings[0] - this.paddings[2];

    this.waveBaseX = this.paddings[3];
    this.waveMidY = this.paddings[0] + (this.scoreBlkLength) / 2;
    this.waveSecTextBaseY = this.height - this.paddings[2] * 2 / 3;

    this.scoreBaseX = this.paddings[3];
    this.scoreBaseY = this.paddings[0];
    this.scoreWordNameBaseY = this.paddings[0] * 2 / 3;
    this.scoreWordScoreBaseY = this.paddings[0] * 3 / 4;
    this.scorePhoneNameBaseY = this.scoreBaseY + this.scoreBlkLength - this.paddings[0] * 1 / 4;
    this.scorePhoneScoreBaseY = this.scoreBaseY + this.scoreBlkLength - this.paddings[0] * 3 / 4;

    this.frameBaseX = this.waveBaseX;
    this.frameBaseY = this.scoreBaseY - 1;
    this.frameWidth = this.width - this.paddings[1] - this.paddings[3] + 2;
    this.frameHeight = this.scoreBlkLength + 2;

    this.xUnitLength = this.frameWidth / this.sampleAmount;
    this.yUnitLength = this.scoreBlkLength / 2 / this.waveMaxAbsValue;

    // Need set width and height of canvas for unit of pixel
    this.targetSel.setAttribute("width", this.width);
    this.targetSel.setAttribute("height", this.height);
    this.interactionSel.setAttribute("width", this.width);
    this.interactionSel.setAttribute("height", this.height);

    // Regions for being clicked
    // [{'x1': <x>, 'y1': <y>, 'x2': <x>, 'y2': <y>}]
    this.clickRegions = [];
    this.phonesInternal.forEach((interval, idx) => {
      this.clickRegions.push({
        x1: this.scoreBaseX + interval[0] * this.sampleRate * this.xUnitLength,
        y1: this.scoreBaseY,
        x2: this.scoreBaseX + interval[1] * this.sampleRate * this.xUnitLength,
        y2: this.scoreBaseY + this.frameHeight
      });
    });
  }
  
  clickEvent() {
    this.clickRegions = null;
    let interaction = {
      start: {
        x: null,
        y: null
      },
      end: {
        x: null,
        y: null
      },
      isDrag: false
    };
    // for scrollbar
    let scrollX = 0 ;
    let clickedPosX = 0 ;
    
    if (!this.isInteractionEventSet) {

      this.interactionSel.addEventListener("mousedown", e => {
        // Need get position information every time
        this.canvasInteractionPos = this.interactionSel.getBoundingClientRect();
        interaction.isDrag = true;

        interaction.start.x = e.clientX - this.canvasInteractionPos.x;
        interaction.start.y = e.clientY - this.canvasInteractionPos.y;
        
      });
      this.interactionSel.addEventListener("mousemove", e => {
        this.canvasInteractionPos = this.interactionSel.getBoundingClientRect();
        
        interaction.end.x = e.clientX - this.canvasInteractionPos.x;
        interaction.end.y = e.clientY - this.canvasInteractionPos.y;

        if (interaction.isDrag) {
          // canvas click event
          let resionStart = null, regionEnd = null;
          let start = {
            pos: interaction.start,
            region: null,
          };
          let end = {
            pos: interaction.end,
            region: null,
          };

          this.clickRegions.every((region, idx) => {
            if (region.x1 <= start.pos.x && start.pos.x <= region.x2 && region.y1 <= start.pos.y &&
              start.pos.y <= region.y2) {
              start.region = region;
            }

            if (region.x1 <= end.pos.x && end.pos.x <= region.x2 && region.y1 <= end.pos.y &&
              end.pos.y <= region.y2) {
              end.region = region;
            }

            if (start.region !== null && end.region !== null) {
              return false;
            }

            return true;
          });

          if (start.region === null || end.region === null) {
            this.resetClickedRegion();

            return true;
          }

          this.clickedRegion = {
            'x1': Math.min(start.region.x1, end.region.x1),
            'y1': start.region.y1,
            'x2': Math.max(start.region.x2, end.region.x2),
            'y2': start.region.y2
          }
          this.drawClickedRegion();
          
          // scroll move event
          
          if( this.duration > this.overflowPoint ) {
            let divWidth = this.canvas_area.outerWidth(true) ;  // the mousemove available area
            // let scrollWidth = this.canvas_area[0].scrollWidth ;  // the scroll bar length
            // let wDiff = (scrollWidth / divWidth) - 1 ; // widths difference ratio
            let posX = e.pageX - this.canvas_area.offset().left ; // mouse relative position at the screen
            
            if( posX > divWidth * 4/5 ){
              let edgeX = this.idSel.width() * 4 / 5 ;
              let moveX = e.offsetX - edgeX ;
              this.canvas_area.scrollLeft( moveX ) ;
            } else if( posX < divWidth * 1/5 ) {
              let edgeX = this.idSel.width() * 1 / 5 ;
              let moveX = e.offsetX - edgeX ;
              this.canvas_area.scrollLeft( moveX ) ;
            } 
          }
        }
      });
      this.interactionSel.addEventListener("mouseup", e => {
        interaction.end.x = e.clientX - this.canvasInteractionPos.x;
        interaction.end.y = e.clientY - this.canvasInteractionPos.y;

        if (this.clickRegions == null) {
          return;
        }

        if (interaction.isDrag) {
          let resionStart = null, regionEnd = null;
          let start = {
            pos: interaction.start,
            region: null,
            interval: null
          };
          let end = {
            pos: interaction.end,
            region: null,
            interval: null
          };
          this.clickRegions.every((region, idx) => {
            if (region.x1 <= start.pos.x && start.pos.x <= region.x2 && region.y1 <= start.pos.y &&
              start.pos.y <= region.y2) {
              start.region = region;
              start.interval = [ ( parseFloat(this.beginTime) + parseFloat(this.phonesInternal[idx][0]) ).toFixed(3) ,
                                 ( parseFloat(this.beginTime) + parseFloat(this.phonesInternal[idx][1]) ).toFixed(3) ];
            }

            if (region.x1 <= end.pos.x && end.pos.x <= region.x2 && region.y1 <= end.pos.y &&
              end.pos.y <= region.y2) {
              end.region = region;
              end.interval = [ ( parseFloat(this.beginTime) + parseFloat(this.phonesInternal[idx][0]) ).toFixed(3) ,
                                 ( parseFloat(this.beginTime) + parseFloat(this.phonesInternal[idx][1]) ).toFixed(3) ];
            }

            if (start.region !== null && end.region !== null) {
              return false;
            }

            return true;
          });

          if (start.region === null || end.region === null) {
            this.resetClickedRegion();
            return;
          }

          this.clickedRegion = {
            'x1': Math.min(start.region.x1, end.region.x1),
            'y1': start.region.y1,
            'x2': Math.max(start.region.x2, end.region.x2),
            'y2': start.region.y2
          }
          this.drawClickedRegion();
          let interval = [
            Math.min(start.interval[0], end.interval[0]),
            Math.max(start.interval[1], end.interval[1])
          ];
          this.play(interval[0], interval[1]);

          interaction.isDrag = false;
          let x = 0;
          let y = 0;
        }
        else {
          let pos = interaction.start;
          this.clickRegions.every((region, idx) => {
            if (region.x1 <= pos.x && pos.x <= region.x2 && region.y1 <= pos.y && pos.y <= region.y2) {
              this.clickedRegion = region;
              this.drawClickedRegion();

              let interval = [ ( parseFloat(this.beginTime) + parseFloat(this.phonesInternal[idx][0]) ).toFixed(3) ,
                                 ( parseFloat(this.beginTime) + parseFloat(this.phonesInternal[idx][1]) ).toFixed(3) ];
              this.play(interval[0], interval[1]);
              return false;
            }
            return true;
          });
        }
      });
      this.isInteractionEventSet = true;
    }
  }

  draw() {
    this.setInfo();

    // Clear
    this.ctx.clearRect(0, 0, this.targetSel.width, this.targetSel.height);
    this.ctxInteraction.clearRect(0, 0, this.interactionSel.width, this.interactionSel.height);

    this.drawFrame();
    this.drawScore();
    this.drawAudioWave();
  }

  findMinMaxChannelData() {
    let min = null, max = null;
    for (let i = 0; i < this.channelData.length; i++) {
      let data = this.channelData[i];

      // Min
      let value = this.arrayMin(data);
      if (min === null) {
        min = value;
      } else if (min < value) {
        min = value;
      }

      // Max
      value = this.arrayMax(data);
      if (max === null) {
        max = value;
      } else if (max > value) {
        max = value;
      }
    }

    return [min, max];
  }

  arrayMin(data) {
    let result = null;
    data.forEach(element => {
      if (result === null) {
        result = element;
      } else if (element < result) {
        result = element;
      }
    });

    return result;
  }

  arrayMax(data) {
    let result = null;
    data.forEach(element => {
      if (result === null) {
        result = element;
      } else if (element > result) {
        result = element;
      }
    });

    return result;
  }

  drawFrame() {
    this.ctx.strokeRect(this.frameBaseX, this.frameBaseY, this.frameWidth, this.frameHeight);
  }

  drawAudioWave() {
    this.ctx.save();
    for (let i = 0; i < this.channelData.length; i++) {
      let data = this.channelData[i];

      this.ctx.strokeStyle = this.waveColors[i];
      this.ctx.beginPath();
      for (let j = 1; j < data.length; j++) {
        // Previous point
        let prev = data[j - 1];
        let prevX = this.waveBaseX + (j - 1) * this.xUnitLength;
        let prevY = this.waveMidY + (-1 * prev * this.yUnitLength)
        this.ctx.moveTo(prevX, prevY);

        // Current point
        let x = this.waveBaseX + j * this.xUnitLength;
        let y = this.waveMidY + (-1 * data[j] * this.yUnitLength);
        this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
    }
    this.ctx.restore();

    // Label time
    this.ctx.font = "14px sans-serif";
    for (let sec = 0; sec < this.duration; sec++) {
      let textWidth = this.ctx.measureText(sec).width;
      let x = this.waveBaseX + sec * this.sampleRate * this.xUnitLength - textWidth / 2;
      this.ctx.fillText(sec, x, this.waveSecTextBaseY);
    }
  }

  drawScore() {
    this.ctx.save();
    let textWidth = null, textX = null, text = null;
    for (let i = 0; i < this.scoreData.length; i++) {
      let word = this.scoreData[i];
      let phones = word.phone;
      let time = word.interval;
      //wavebg color
      let color = this.scoreColors[i % this.scoreColors.length];

      // Adjust time
      if (phones[0].name.length >= 4 && phones[0].name.substr(0, 4) == "sil+" && phones.length > 1) {
        time[0] = phone[1].interval[0];
      }

      // Adjust color(silence)
      if (word.name == "sil" || word.name == "sp" || word.name == "!SIL" || word.name == "SIL" || word.name == "SIL_S") {
        color = this.silenceColor;
      }

      // Draw block
      let blkX = this.scoreBaseX + time[0] * this.sampleRate * this.xUnitLength;
      let blkY = this.scoreBaseY;
      let blkWidth = (time[1] - time[0]) * this.sampleRate * this.xUnitLength;
      let blkHeight = this.scoreBlkLength;
      this.fillRect(blkX, blkY, blkWidth, blkHeight, color);

      // Name of word
      text = `${word.text}`
      // (${word.name})`;
      this.ctx.font = "14px sans-serif";
      textWidth = this.ctx.measureText(text).width;
      textX = blkX + blkWidth / 2 - textWidth / 2;
      this.ctx.fillText(text, textX, this.scoreWordNameBaseY);
      // // Score of word
      // text = parseInt(word.timberScore).toString();
      // textWidth = this.ctx.measureText(text).width;
      // textX = blkX + blkWidth / 2 - textWidth / 2;
      // this.ctx.fillText(text, textX, this.scoreWordScoreBaseY);

      // Phones of word
      phones.forEach(phone => {
        time = phone.interval;

        // block
        time.forEach(s => {
          let x = this.scoreBaseX + s * this.sampleRate * this.xUnitLength;
          this.stroke(x, blkY, x, blkY + blkHeight, this.scorePhoneBlockLineWidth);
        });

        // let phoneTextMidX = this.scoreBaseX + ((time[0] + time[1]) / 2) * this.sampleRate * this.xUnitLength;
        // // Name
        // text = phone.name;
        // textWidth = this.ctx.measureText(text).width;
        // textX = phoneTextMidX - textWidth / 2;
        // this.ctx.fillText(text, textX, this.scorePhoneNameBaseY);

        // // Score
        // text = parseInt(phone.timberScore).toString();
        // textWidth = this.ctx.measureText(text).width;
        // textX = phoneTextMidX - textWidth / 2;
        // this.ctx.fillText(text, textX, this.scorePhoneScoreBaseY);
      });
    }

    this.ctx.restore();
  }

  fillRect(x, y, w, h, color) {
    this.ctx.save();

    if (color !== undefined) {
      this.ctx.fillStyle = color;
    }
    this.ctx.fillRect(x, y, w, h);

    this.ctx.restore();
  }

  stroke(x1, y1, x2, y2, width) {
    this.ctx.save();

    if (width !== undefined) {
      this.ctx.lineWidth = width;
    }
    this.ctx.moveTo(x1, y1);
    this.ctx.strokeStyle = "#000000"
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();

    this.ctx.restore();
  }

  play(start, end) {
    console.log( "play between " + start + " and " + end + "." );
    let audioSource = this.audioCtx.createBufferSource();
    audioSource.buffer = this.audioData;
    audioSource.connect(this.audioCtx.destination);
    audioSource.start(0, start, end - start);
  }

  drawClickedRegion() {
    if (this.clickedRegion === null) {
      return;
    }

    let x = this.clickedRegion.x1;
    let y = this.clickedRegion.y1;
    let w = this.clickedRegion.x2 - this.clickedRegion.x1;
    let h = this.clickedRegion.y2 - this.clickedRegion.y1;

    this.ctxInteraction.save();

    // Clear before drawing
    this.ctxInteraction.clearRect(0, 0, this.interactionSel.width, this.interactionSel.height);

    this.ctxInteraction.lineWidth = this.clickedRegionLineWidth;
    this.ctxInteraction.strokeStyle = this.clickedRegionColor;
    this.ctxInteraction.strokeRect(x, y, w, h);

    this.ctxInteraction.restore();
  }

  resetClickedRegion() {
    this.ctxInteraction.clearRect(0, 0, this.interactionSel.width, this.interactionSel.height);
  }

  isString(value) {
    return typeof value === "string" || value instanceof String;
  }

  getDataFromUrl(url) {
    let result = null;
    $.ajax({
      url: url,
      method: "GET",
      dataType: "text json",
      async: false,
    }).done(data => {
      result = data;
    });

    return result;
  }

  getScoreData(data) {
    let result = [];
    data.cm.word.forEach(elem => {
      elem.syl.forEach(syl => {
        result.push(syl);
      })
    });

    return result;
  }

  getAudioDataFromUrl(url, callback) {
    let result = null;
    let req = new XMLHttpRequest();
    req.open("GET", url);
    req.responseType = "arraybuffer";
    req.onload = e => {
      this.readWave(req.response, callback);
    };
    req.send();
  }

  readWave(data, callback) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    let audioCtx = new AudioContext();
    audioCtx.decodeAudioData(data, audioData => {
      this.audioBufferSlice(audioData, callback);
      // this.audioData = audioData;
      // callback();
    }, error => {
      console.log(`Error with decoding audio data ${error.err}`);
    });
  }

  audioBufferSlice(buffer, callback) {
    /** ref.: https://miguelmota.com/bytes/slice-audiobuffer/ , https://stackoverflow.com/questions/50191365/how-to-slice-an-audio-blob-at-a-specific-time **/
    let error = null;

    let duration = buffer.duration;
    let channels = buffer.numberOfChannels;
    let sampleRate = buffer.sampleRate;

    // slice by segments
    if( this.segments != null ){
      let beginTime = parseFloat(this.segments[0]).toFixed(3);
      let endTime = parseFloat(this.segments[1]).toFixed(3);

      if (beginTime < 0) {
        error = new RangeError('begin time must be greater than 0');
      }
      if (endTime > duration) {
        error = new RangeError('end time must be less than or equal to ' + duration);
      }
      if (typeof callback !== 'function') {
        error = new TypeError('callback must be a function');
      }

      let startOffset = sampleRate * beginTime;
      let endOffset = sampleRate * endTime;
      let frameCount = endOffset - startOffset;
      let newArrayBuffer;

      try {
        let audioCtx = new AudioContext();
        newArrayBuffer = audioCtx.createBuffer(channels, endOffset - startOffset, sampleRate);
        let tmpBuffer = new Float32Array(frameCount);
        let offset = 0;

        for (let channel = 0; channel < channels; channel++) {
          buffer.copyFromChannel(tmpBuffer, channel, startOffset);
          newArrayBuffer.copyToChannel(tmpBuffer, channel, offset);
        }
      } catch(e) {
        error = e;
      }
      if (error) {
        console.error(error);
      } else {
        buffer = null;
        this.audioData = newArrayBuffer;
      }
    } else {
      this.audioData = buffer;
    }
    this.beginTime = 0;
    this.endTime = this.audioData.duration;
    callback();
  }

  setData(audioData, data, audioSegments) {
    this.audioData = audioData;
    this.data = data;
    this.segments = audioSegments;
    this.initial();
  }

}
