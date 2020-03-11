var blob, blob_confirm, gumStream, au_show_flag = false;
var record_count = 0;
var canvas, recorder, recorder_confirm, recorderGUI, audioContext;
var stop_rec_timer, draw_timer;
var drawer = null;
var command_type = "";
var decoded_command;

window.onload = function init() {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
  window.URL = window.URL || window.webkitURL;
  if (!navigator.getUserMedia) {
    alert('navigator.getUserMedia not present!')
  }

  // draw score figure
  let waveColors = ["#0A1747", "#46ECC8", "#FDF289"];
  let scoreColors = ["#90cbf0", "#b2b2ff", "#F27E63", "#f272a1", "#D4DBF5", "#F2E205"];

  const urlParams = new URLSearchParams(window.location.search);

  if (!urlParams.get('uttid') || !urlParams.get('decode_id')) {
    let data = "/static/demo.json";
    let audioData = "/static/demo.wav";
    if (drawer === null) {
      drawer = new AudioScoreDrawer("resultDiv", audioData, data, waveColors, scoreColors);
    } else {
      drawer.setData(audioData, data);
    }
  } else {
    $.ajax({
      url: '/ctm/fetch',
      method: "GET",
      data: {
        uttid: urlParams.get('uttid'),
        decode_id: urlParams.get('decode_id')
      },
      async: false,
    }).done(data => {
      mir_result = data;
      if (mir_result != null) {
        if (drawer === null) {
          drawer = new AudioScoreDrawer("resultDiv", mir_result['wav'], mir_result['ctm'], waveColors, scoreColors);
        } else {
          drawer.setData(mir_result['wav'], mir_result['ctm']);
        }
      }
    });
  }
};
