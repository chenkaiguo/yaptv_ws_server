var mysql = require('mysql');
var util = require('util');



var MPic = function (c, p, m) {
    var o = {};
    o.channel = c;
    o.path = p;
    o.ms = m;
    return o;
}
var client = null;

function selectPic(st, et, channel, callback) {
    if (client == null) {
        console.log("create mysql conn");
        client = mysql.createConnection({
            host: '582eaaa3d94c3.sh.cdb.myqcloud.com',
            user: 'cdb_outerroot',
            password: 'tvmining!@#',
            port: '5773',
            database: 'logo_detect',
        });

        client.connect();
        client.query("use logo_detect");
    }

    var url = util.format("select channel,path,ms from image where `ms`>%d and `ms`<=%d and channel='%s'",
        1479458519, 1479458539, channel);
    client.query(url,
        function selectPic(err, results, fields) {
            if (err) {
                throw err;
            }
            var arr = [];
            if (results) {
                for (var i = 0; i < results.length; i++) {
                    var pic = new MPic(results[i].channel, results[i].path, results[i].ms);
                    if (pic == undefined) continue;
                    arr.push(pic);
                }
            }
            callback(JSON.stringify(arr));
        }
    );
}

function close() {
    client.end();
    client=null;
    console.log("close db")
}

exports.selectPic = selectPic;
exports.close = close;
// selectPic(1479458519, 1479458539, 'ZheJiangFilm',function(data){
//     console.log(data);
// });