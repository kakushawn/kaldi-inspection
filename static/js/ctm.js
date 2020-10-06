var AudioContext = window.AudioContext || window.webkitAudioContext
var drawer = null;

window.onload = function init() {
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
      if (data.success) {
        mir_result = data['content'];
        if (mir_result['error'] != null){
          $("#resultDiv").html( mir_result['error'] );
          return ;
        }
        ctm = mir_result['ctm'];
        wavFile = mir_result['audio']['wav'];
        segments = mir_result['audio']['segments'];
        if (drawer === null) {
          drawer = new AudioScoreDrawer("resultDiv", wavFile, ctm, segments, waveColors, scoreColors);
        } else {
          drawer.setData(wavFile, ctm, segments);
        }
        $(document).attr('title', "CTM (" + ctm.Utterance + ")");
      }
    });
  }
};
