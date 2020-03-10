function formatFloat(num, pos)
{
  var size = Math.pow(10, pos);
  return Math.round(num * size) / size;
}

class JsonViewer{
  constructor(id, data){
    this.id = id;
    this.data = data;
    this.idSel = $(`#${this.id}`);
    this.initial()
    
  }

  initial(){
    // Get score data
    // Support URL
    if(this.isString(this.data)){
      this.dataUrl = this.data;
      this.data = this.getDataFromUrl(this.dataUrl);
    }
    this.scoreData = this.getScoreData(this.data);
    console.log("initial~");
    console.log(this.scoreData);
    this.show_table();
}


 
show_table(){
    
// var xmlhttp = new XMLHttpRequest();
// xmlhttp.onreadystatechange = function() {

    // if(this.readyState == 4 && this.status == 200) {
        
        //读取JSON文件，把字符串转换为js对象
        console.log("show table!")
        // var message = JSON.parse(this.scoreData);
        var scoreInfo = this.scoreData
        console.log(scoreInfo)

        var table = document.createElement("table");
        var thead = document.createElement("tr");
        var tbody_row = document.createElement("tr");
        var header_list = ["word", "phone", "competing phone", "likelihood", "diagnosis"]
        for (var i = 0; i < header_list.length; i++) {
            var header_text = document.createElement("th");
            var node = document.createTextNode(header_list[i]);
            header_text.appendChild(node)
            thead.appendChild(header_text);
        }
        table.appendChild(thead)

        for (var i = 0; i < scoreInfo.length; i++) { // word
            console.log("word = " + scoreInfo[i].text);
            if (scoreInfo[i].name === "SIL" || scoreInfo[i].name === "sil" || scoreInfo[i].name === "SPN_S" ){
                continue;
            }
            
            for (var j = 0; j < scoreInfo[i].phone.length; j++) { // phone
                var tbody_row = document.createElement("tr");

                if (j == 0) {
                    var tbody_row_word = document.createElement("td");
                    var phone_number = scoreInfo[i].phone.length;
                    tbody_row_word.rowSpan = phone_number;
                    
                    var timber_score = formatFloat(scoreInfo[i].timberScore, 2)
                    var node = document.createTextNode(scoreInfo[i].text + " (" + timber_score + ")");
                    tbody_row_word.appendChild(node);
                    tbody_row.appendChild(tbody_row_word);
                }
                
                console.log("phone = " + scoreInfo[i].phone[j].name);
                var tbody_phone_text = document.createElement("td");
                var timber_score = formatFloat(scoreInfo[i].phone[j].timberScore, 2)
                var node = document.createTextNode(scoreInfo[i].phone[j].name + " (" + timber_score + ")");
                tbody_phone_text.appendChild(node);
                tbody_row.appendChild(tbody_phone_text);
                
                var tbody_competing_phone = document.createElement("td"); 
                var tbody_competing_phone_list = document.createElement("ol"); 
                for (var k = 0; k < 5; k++) { // competing rank    
                    console.log("rank = " + scoreInfo[i].phone[j].competingModelName[k]);
                    var tbody_competing_phone_text = document.createElement("li");
                    var node = document.createTextNode(scoreInfo[i].phone[j].competingModelName[k]);
                    tbody_competing_phone_text.appendChild(node);
                    tbody_competing_phone_list.appendChild(tbody_competing_phone_text);
                }
                tbody_competing_phone.appendChild(tbody_competing_phone_list)
                tbody_row.appendChild(tbody_competing_phone)
                
                var tbody_competing_loglike = document.createElement("td");
                var tbody_competing_loglike_list = document.createElement("ol");
                for (var k = 0; k < 5; k++) { // competing log-likelihood
                    console.log("log-like = " + scoreInfo[i].phone[j].competingModelLogLike[k]);
                    var tbody_competing_loglike_text = document.createElement("li");
                    var node = document.createTextNode(scoreInfo[i].phone[j].competingModelLogLike[k]);
                    tbody_competing_loglike_text.appendChild(node);
                    tbody_competing_loglike_list.appendChild(tbody_competing_loglike_text);
                }
                tbody_competing_loglike.appendChild(tbody_competing_loglike_list)
                tbody_row.appendChild(tbody_competing_loglike)

                console.log("diagnosis = " + scoreInfo[i].phone[j].diagnosis);
                var tbody_diagnosis = document.createElement("td");
                var node = document.createTextNode(scoreInfo[i].phone[j].diagnosis);
                tbody_diagnosis.appendChild(node);
                tbody_row.appendChild(tbody_diagnosis);

                table.appendChild(tbody_row)
            }
        }
        


        //创建表元素
       
        // var table = document.createElement("ul");
        // var thead = document.createElement("li");
        // var tbody = document.createElement("li");
        // thead.className = "thead";
        // tbody.className = "tbody";

        // var header_list = ["word", "phone", "rank", "likelihood"]
        // // var json_th = document.createElement("th");
        // var header = document.createElement("ol");
        // header.className = "tr"
        // for (var i = 0; i < header_list.length; i++) {
        //     var header_text = document.createElement("li");
        //     var node = document.createTextNode(header_list[i]);
        //     header_text.appendChild(node)
        //     header.appendChild(header_text);
        //     thead.appendChild(header);
        // }

        // table.appendChild(thead);

        // for (var i = 0; i < scoreInfo.length; i++) { 
        //     console.log("word = " + scoreInfo[i].text);
        //     var tbody_row_text = document.createElement("li");
        //     if (scoreInfo[i].name === "SIL" || scoreInfo[i].name === "sil" || scoreInfo[i].name === "SPN_S" ){
        //         continue;
        //     }
        //     var node = document.createTextNode(scoreInfo[i].text);
        //     tbody_row_text.appendChild(node)
        //     tbody_row.appendChild(tbody_row_text);

        //     var tbody_phone = document.createElement("ol");
        //     // tbody_phone.className = "tr";
        //     for (var j = 0; j < scoreInfo[i].phone.length; j++) { // phone
        //         console.log("phone = " + scoreInfo[i].phone[j].name);
        //         var tbody_phone_text = document.createElement("li");
        //         var node = document.createTextNode(scoreInfo[i].phone[j].name);
        //         tbody_phone_text.appendChild(node);
        //         tbody_phone.appendChild(tbody_phone_text);

        //         var tbody_competing_phone = document.createElement("ol"); 
        //         // tbody_competing_phone.className = "tr";
        //         for (var k = 0; k < 5; k++) { // competing rank    
        //             console.log("rank = " + scoreInfo[i].phone[j].competingModelName[k]);
        //             var tbody_competing_phone_text = document.createElement("li");
        //             var node = document.createTextNode(scoreInfo[i].phone[j].competingModelName[k]);
        //             tbody_competing_phone_text.appendChild(node);
        //             tbody_competing_phone.appendChild(tbody_competing_phone_text);
        //         }
        //         tbody_phone.appendChild(tbody_competing_phone)
                
        //         var tbody_competing_loglike = document.createElement("ol");
        //         // tbody_competing_loglike.className = "tr";
        //         for (var k = 0; k < 5; k++) { // competing log-likelihood
        //             console.log("log-like = " + scoreInfo[i].phone[j].competingModelLogLike[k]);
        //             var tbody_competing_loglike_text = document.createElement("li");
        //             var node = document.createTextNode(scoreInfo[i].phone[j].competingModelLogLike[k]);
        //             tbody_competing_loglike_text.appendChild(node);
        //             tbody_competing_loglike.appendChild(tbody_competing_loglike_text);
        //         }
        //         tbody_phone.appendChild(tbody_competing_loglike)
        //     //     tbody_row.appendChild(tbody_col);
        //     }
        //     tbody_row.appendChild(tbody_phone);
        //     tbody.appendChild(tbody_row);
        //     table.appendChild(tbody);
            
        // }

        // json_table.appendChild(json_th);
        //读取JSON文件中键的数量已经各键值的数量来创建表
        
        // for(var key in message) {
        // for(var i = 0; i < message.length; i++) {
        //     console.log("KEY")
        //     console.log(message[i])
        //     var word = message[i]
            
        //     //获取键名
        //     var th_txt = document.createTextNode(word);
            
        //     json_th.appendChild(th_txt);
        //     json_tr.appendChild(json_th);
        //     json_table.appendChild(json_tr);
            
        //     //修改表格样式
        //     json_th.style.border = "1px solid black";
        //     // console.log("key.phone: ")
        //     // console.log(key.phone)
        //     for(var num in message.key.phone) {
        //     console.log("Number: " + num)
        //     // console.log(num)            
        //     var json_tr = document.createElement("tr");
        //     console.log("json_tr: " + json_tr)            
        //     }
            
        // }

        // for(var num in message.phone) {
        //     console.log("Number: " + num)
        //     // console.log(num)            
        //     var json_tr = document.createElement("tr");
        //     console.log("json_tr: " + json_tr)            

        //     for(var key in message) {
        //         var json_td = document.createElement("td");
        //         var td_txt = document.createTextNode(message[key][num]);
        //         console.log("json_td: " + json_td)            
        //         console.log("td_txt: " + td_txt)            
                
                
        //         json_td.appendChild(td_txt);
        //         json_tr.appendChild(json_td);
        //         json_table.appendChild(json_tr);

                
        //         json_td.style.border = "1px solid black";
              
        //     }
        // }

        //添加表格
        var container = document.getElementById(this.id);
        container.appendChild(table);
        
        //改变表格样式
        // table.style.border = "1px solid black";
        // table.style.width = "800px";
        
}
// };

// xmlhttp.open("GET", "json_table.txt", true);
// xmlhttp.send();

 

isString(value){
return typeof value === "string" || value instanceof String;
}

getDataFromUrl(url){
let result = null;
$.ajax({
    url: url,
    method: "GET",
    dataType: "json",
    async: false
}).done(data => {
    result = data;
});

return result;
}

getScoreData(data){
let result = [];
data.cm.word.forEach(elem => {
    elem.syl.forEach(syl => {
    result.push(syl);
    })
});

return result;
}

setData(data){
this.data = data;
this.initial();
}

}