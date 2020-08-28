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
  var decode_options = data.find(function (element) {
    return element["name"] == 'decode-options'
  });
  var criterion = data.find(function (element) { return element["name"] == 'criterion' }).value;

  if (decode_options) {
    let decode_id = decode_options.value;
    $.ajax({
      url: '/list/fetch',
      method: "GET",
      data: {
        decode_id: decode_id,
        criterion: criterion
      },
    }).done(data => {
      if (data.success) {
        $("#listInfo").html("");
        $("#listInfo").prepend("<h3> result of " + decode_id + " (overall WER: " + data.content.wer + ")</h4>");
        $("#listWrapper").html("");
        listResult( data )
      }
      else {
        $("#listWrapper").html("<div> <p> 發生錯誤 </p> </div>");
      }
    });
    return false;
  }
});

// added by adler 28.08.2020
// check csid and give difference class
function csidClass( csid ){
  let colorClassList = [] ;
  csid.forEach( item => {
    switch( item.toLowerCase() ){
      case 'c' :
        colorClassList.push("correct") ;
        break ;
      case 's' :
        colorClassList.push("substitution") ;
        break ;
      case 'i' :
        colorClassList.push("insert") ;
        break;
      case 'd' :
        colorClassList.push("delete") ;
        break ;
      default :
        colorClassList.push("") ;
        break ;
    }
  }) ;
  return colorClassList ;
}


// added by adler 28.08.2020
// list all uttrence ctm result
function listResult( data ) {
  utts = data.content.utts
  utts = getSortedObjectKeys(utts);
  utts.forEach(key => {
    // set all display row
    $("#listWrapper").prepend("<div class=list-item id=\"" + key + "\"></div>");
    $("#" + key).append("<h5><a href=\"" + data.content.utts[key].ctm_link + "\" target=\"_blank\"> " + key + " </a></h5>");
    $("#" + key).append("<h5>csid: </h5> <p>" + data.content.utts[key].csid + "</p>")
    $("#" + key).append("<h5>ops: </h5> <p id=\"ops\"></p>")
    $("#" + key).append("<h5>wer: </h5> <p>" + data.content.utts[key].wer.round(4) + "</p>")
    $("#" + key).append("<h5>ref: <h5/> <p id=\"ref\"></p>");
    $("#" + key).append("<h5>hyp: <h5/> <p id=\"hyp\"></p>");

    // list result with difference color
    let csidClassList = csidClass( data.content.utts[key].op ) ;
    for( let i = 0 ; i < csidClassList.length ; i ++ ){
      $("#ops").append("<span class=\"" + csidClassList[i] + "\">" + data.content.utts[key].op[i] + "</span> ")
      $("#ref").append("<span class=\"" + csidClassList[i] + "\">" + data.content.utts[key].ref[i] + "</span> ")
      $("#hyp").append("<span class=\"" + csidClassList[i] + "\">" + data.content.utts[key].hyp[i] + "</span> ")
    }
  });
}