var audioContext;
var drawer = null;


Number.prototype.round = function (places) {
  return +(Math.round(this + "e+" + places) + "e-" + places);
}

function getSortedObjectKeys(o) {
  arr = [];
  for (let key in o) {
    arr.push({ 'utt': key, 'wer': o[key].wer.round(4) });
  }

  return arr.sort(function (a, b) { return a.wer - b.wer; }).map(function (o) { return o.utt; });
}

window.onload = function init() {
};

$('#list-fetch-form').on('submit', function (event) {
  event.preventDefault();
  var data = $('#list-fetch-form :input').serializeArray();
  decode_id = data.find(function (element) { return element["name"] == 'decode-options' }).value;
  criterion = data.find(function (element) { return element["name"] == 'criterion' }).value;

  $.ajax({
    url: '/list/fetch',
    method: "GET",
    data: {
      decode_id: decode_id,
      criterion: criterion
    },
  }).done(data => {
    if (data.success) {
      utts = data.content.utts
      utts = getSortedObjectKeys(utts);
      $("#listInfo").html("");
      $("#listInfo").prepend("<h3> result of " + decode_id + " (overall WER: " + data.content.wer + ")</h4>");
      $("#listWrapper").html("");
      utts.forEach(key => {
        $("#listWrapper").prepend("<div class=list-item id=\"" + key + "\"></div>");
        $("#" + key).append("<h5><a href=\"" + data.content.utts[key].ctm_link + "\" target=\"_blank\"> " + key + " </a></h5>");
        $("#" + key).append("<h5>csid: </h5> <p>" + data.content.utts[key].csid + "</p>")
        $("#" + key).append("<h5>ops: </h5> <p>" + data.content.utts[key].op.join("　") + "</p>")
        $("#" + key).append("<h5>wer: </h5> <p>" + data.content.utts[key].wer.round(4) + "</p>")
        $("#" + key).append("<h5>ref: <h5/> <p>" + data.content.utts[key].ref.join("　") + "</p>");
        $("#" + key).append("<h5>hyp: <h5/> <p>" + data.content.utts[key].hyp.join("　") + "</p>");
      });
    }
    else {
      $("#listWrapper").prepend("<div> err:" + mir_result.message + " </div>");
    }
  });
  return false;
});
