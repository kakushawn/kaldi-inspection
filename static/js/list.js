Number.prototype.round = function (places) {
  return +(Math.round(this + "e+" + places) + "e-" + places);
}

// update by adler 20.10.2020
// sort data by wer order by desc.
function getSortedObjectKeys(o) {
  let arr = [];
  for (let key in o) {
    arr.push({ 'utt': key, 'wer': o[key].wer.round(4) });
  }
  // If two elements have different number, then the one who has larger number wins
  return arr.sort(function (a, b) { return b.wer - a.wer; }).map(function (o) { return o.utt; });
}

$('#list-fetch-form').on('submit', function (event) {
  event.preventDefault();
  $("#listInfo").html("");
  $("#listWrapper").html("Loading...");
  let data = $('#list-fetch-form :input').serializeArray();
  let decode_options = data.find(function (element) {
    return element["name"] == 'decode-options'
  });
  let criterion = data.find(function (element) { return element["name"] == 'criterion' }).value;

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
        $("#listInfo").html("<h3> result of " + decode_id + " (overall WER: " + data.content.wer + ")</h4>");
        $("#listWrapper").html("");
        listResult( data );
      }
      else {
        $("#listWrapper").html("<div> <p> 發生錯誤 </p> </div>");
      }
    });
    return false;
  }
});

// update by adler 20.10.2020
// check csid and give difference class , return the HTML code of ops/ref/hyp
function csidClasses( uttData ){
  let opsHTML = "" , refHTML = "" , hypHTML = "" ;
  let csidClass = "" ;
  for( let i = 0 ; i < uttData.op.length ; i ++ ){
    let ops = uttData.op[i] ;
    let ref = uttData.ref[i] ;
    let hyp = uttData.hyp[i] ;
    switch( ops.toLowerCase() ){
      case 'c' :
        csidClass = "correct" ;
        break ;
      case 's' :
        csidClass = "substitution" ;
        break ;
      case 'i' :
        csidClass = "insert" ;
        break;
      case 'd' :
        csidClass = "delete" ;
        break ;
      default :
        csidClass = "" ;
        break ;
    }
    opsHTML += "<span class=\"" + csidClass + "\">" + ops + "</span> " ;
    refHTML += "<span class=\"" + csidClass + "\">" + ref + "</span> " ;
    hypHTML += "<span class=\"" + csidClass + "\">" + hyp + "</span> " ;
  }
  return [opsHTML, refHTML, hypHTML] ;
}


// update by adler 20.10.2020
// list all uttrence ctm result in div#listWrapper
function listResult( data ) {
  let utts = data.content.utts ;
  utts = getSortedObjectKeys(utts);

  let listWrapperHTML = "" ;
  utts.forEach(key => {
    // set all display row
    let orhHTMLList = csidClasses( data.content.utts[key] ) ;  // get ops/ref/hyp HTML with csid classes
    let opsHTML = orhHTMLList[0] , refHTML = orhHTMLList[1] , hypHTML = orhHTMLList[2] ;

    keyHTML = "<h5><a href=\"" + data.content.utts[key].ctm_link + "\" target=\"_blank\"> " + key + " </a></h5>" ;
    keyHTML += "<h5>csid: </h5> <p>" + data.content.utts[key].csid + "</p>" ;
    keyHTML += "<h5>ops: </h5> <p id=\"ops\">" + opsHTML + "</p>" ;
    keyHTML += "<h5>wer: </h5> <p>" + data.content.utts[key].wer.round(4) + "</p>" ;
    keyHTML += "<h5>ref: </h5> <p id=\"ref\">" + refHTML + "</p>" ;
    keyHTML += "<h5>hyp: </h5> <p id=\"hyp\">" + hypHTML + "</p>" ;

    listWrapperHTML += "<div class=list-item id=\"" + key + "\">" + keyHTML + "</div>" ;
  });
  $("#listWrapper").html( listWrapperHTML ) ;
}