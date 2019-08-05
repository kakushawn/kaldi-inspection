var RecorderGUI = function(canvas, width, height, stepTime, sampleRate) {
  this.canvas = canvas;
  this.context = canvas.getContext('2d');
  this.sampleRate = sampleRate, this.stepTime = stepTime;
  this.maximumWidth = width, this.maximumHeight = height;
  this.step = (stepTime || 0.01) * sampleRate, this.amplitude = height / 2;
  this.context.fillStyle = 'gray';
  this.cacheArray = new Array(this.maximumWidth).fill(0);

  this.reset = function() {
    this.context.fillStyle = 'gray';
    this.context.clearRect(0, 0, width, height);
    this.context.beginPath();
    this.context.moveTo(0,0);
    this.canvas.style.display = '';
    this.cacheArray = new Array(this.maximumWidth).fill(0);
  }

  this.realTimeDrawBuffer = function(buffer) {
    const currentWidth = Math.floor(buffer.length / this.step);
    const startIndex = Math.max(0, currentWidth - this.maximumWidth);
    // const startIndex = 0;
    // console.log(currentWidth, startIndex, this.maximumWidth)
    if (startIndex !== 0) {
      this.context.clearRect(0, 0, width, height);
    }
    for (var i = startIndex; i < currentWidth; i++) {
      if (startIndex === 0 && this.cacheArray[i]) {
        continue;
      }
      var min = 1.0, max = -1.0;
      for (var j = 0; j < this.step; j++) {
        const datum = buffer[(i * this.step) + j];
        if (datum < min) {
          min = datum;
        } else if (datum > max) {
          max = datum;
        }
      }
      this.context.fillRect(
        i - startIndex,
        (1 + min) * this.amplitude,
        1,
        Math.max(1, (max - min) * this.amplitude)
      );
      if (startIndex === 0) {
        this.cacheArray[i] = true;
      }
    }
  }
};
