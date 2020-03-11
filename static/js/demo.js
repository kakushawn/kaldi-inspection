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
  audioContext = new AudioContext;
  canvas = document.getElementById('canvas');

  // draw score figure
  let waveColors = ["#0A1747", "#46ECC8", "#FDF289"];
  let scoreColors = ["#90cbf0", "#b2b2ff", "#F27E63", "#f272a1", "#D4DBF5", "#F2E205"];

  let data = "/static/cctv.json";
  let audioData = "/static/cctv.wav";
  if (drawer === null) {
    drawer = new AudioScoreDrawer("resultDiv", audioData, data, waveColors, scoreColors);
  } else {
    drawer.setData(audioData, data);
  }
};
