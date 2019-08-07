var blob, gumStream, au_show_flag = false;
var record_count = 0;
var canvas, recorder, recorderGUI, audioContext;
var stop_rec_timer, draw_timer;
var drawer = null;

function drwaing() {
  recorder.getBuffer(function (buffer) {
    recorderGUI.realTimeDrawBuffer(buffer[0]);
  });
  draw_timer = setTimeout(drwaing, 1);
}

function startRecording() {

  console.log("recordButton clicked");
  /*
    Simple constraints object, for more advanced audio features see
    https://addpipe.com/blog/audio-constraints-getusermedia/
  */

  var constraints = { audio: true, video: false }

  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    console.log("getUserMedia() success, stream created, initializing Recorder.js ...");
    /*
      create an audio context after getUserMedia is called
      sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
      the sampleRate defaults to the one set in your OS for your playback device
    */
    audioContext = new AudioContext();

    /*  assign to gumStream for later use  */
    gumStream = stream;

    /* use the stream */
    input = audioContext.createMediaStreamSource(stream);

    /* 
      Create the Recorder object and configure to record mono sound (1 channel)
      Recording 2 channels  will double the file size
    */
    au_show_flag = false;
    recorder = new Recorder(input, { numChannels: 1 });

    //start the recording process
    recorder.clear();
    canvas.style.display = 'none';
    $('#audio_show').empty()
    $('#recordButton').prop('disabled', true);
    recorderGUI.reset();
    drwaing();
    recorder.record();
    console.log("Recording started");
    record_count = 1;
    stop_rec_timer = setTimeout(stopRecording, 1000 * 20);
    console.log("setTimeout");
  }).catch(function (err) {
    console.log(err);
  });
}



function stopRecording() {
  if (recorder) {
    console.log("stopRecording");

    clearTimeout(stop_rec_timer);
    clearTimeout(draw_timer);
    //disable the stop button, enable the record too allow for new recordings
    $('#stopButton').prop('disabled', false);

    //tell the recorder to stop the recording
    recorder.stop();

    //stop microphone access
    gumStream.getAudioTracks()[0].stop();

    recorder.exportWAV(function (blob_) {
      if (au_show_flag === false) {
        au_show_flag = true;
        var url = window.URL.createObjectURL(blob_);
        var au = document.createElement('audio');
        au.controls = true;
        au.src = url;
        $('#audio_show').append(au);
        blob = blob_;
        const date_time = new Date;
        const timestamp = date_time.getFullYear().toString() + 
                          (date_time.getMonth() + 1).toString() + 
                          date_time.getDate().toString() +  
                          date_time.getHours().toString() + 
                          date_time.getMinutes().toString() + 
                          date_time.getSeconds().toString();

        $('#audio_show').append(`<br/><a href="${url}" download="demo_${timestamp}" > download WAV </a><br/>`);
      }
    });

    if (record_count === 1) {
      $('#recordButton').prop('disabled', false);
      $('#uploadButton').prop('disabled', false);
    }

  }
}

const wav_file_uploader = document.querySelector('#choose_wav_file');
var choose_wav_file_ready = false;
wav_file_uploader.addEventListener('change', (e) => {
  $('#audio_show').empty()
  au_show_flag = false;
  var choose_wav_file = e.target.files[0];
  console.log(e.target.files); // get file object
  console.log(choose_wav_file);
  $('#uploadButton').prop('disabled', false);
  
  if (au_show_flag === false) {
    au_show_flag = true;
    var url = window.URL.createObjectURL(choose_wav_file);
    var fileNameDiv = document.createElement('div');
    fileNameDiv.innerHTML = choose_wav_file.name ;
    $('#audio_show').append(fileNameDiv);
    var au = document.createElement('audio');
    au.controls = true;
    au.src = url;
    $('#audio_show').append(au);
    blob = choose_wav_file;
    // $('#audio_show').append(`<br/><a href="${url}" download="demo" > download WAV </a><br/>`);
  }
  choose_wav_file_ready = true;
});


function uploadClick() {
  if (recorder || choose_wav_file_ready) {
    $('#result').show();
    $('#result').text('處理中，請稍後...');
    console.log(blob);
    const fd = new FormData();

    fd.append('data', blob);
    $('#uploadButton').prop('disabled', true);
	$('#resultDiv').hide();
    $.ajax({
      type: 'POST',
      url: '/ajax_record',
      data: fd,
      processData: false,
      contentType: false
    }).done(function (result) {
      $('#result').text('完成蘿！');
      $('#downloadButton').prop('disabled', false);
      $('#result').text(result.message);
      console.log(result);
      if (recorder){
        recorder.clear();
      }

	  $('#resultDiv').show();

      $('#uploadButton').prop('disabled', false);
    });
  }
}

window.onload = function init() {
  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
    window.URL = window.URL || window.webkitURL;
    if (!navigator.getUserMedia) {
      alert('navigator.getUserMedia not present!')
    }
    audioContext = new AudioContext;
    canvas = document.getElementById('canvas');
    console.log(canvas.width, canvas.height);
    recorderGUI = new RecorderGUI(canvas, canvas.width, canvas.height, 0.02, 44100); // 882 = 44.1KHz * 0.020s
    console.log(recorderGUI)
  } catch (e) {
    alert('No web audio support in this browser!');
  }

};
