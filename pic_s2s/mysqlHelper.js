/// <reference path="typings//mysql/mysql.d.ts" />
/// <reference path="typings/hashmap/hashmap.d.ts" />
var mysql = require('mysql');
var util = require('util');
var hashmap = require("hashmap").HashMap;
var config = require("./config");

var MPic = function (c, p, m) {
    var o = {};
    o.channel = c;
    o.path = p;
    o.ms = m;
    return o;
}
var client = null;

function selectPic(st, et, channel, callback) {
    client = getClient();
    var url = util.format("select channel,path,ms from image where `ms`>%d and `ms`<=%d and channel ='%s'",
        st, et, channel);
        console.log(url);
    client.query(url,
        function (err, results, fields) {
            if (err) {
                throw err;
            }
            var arr = [];
            if (results) {
                for (var i = 0; i < results.length; i++) {
                    arr.push({
                        channel: results[i].channel,
                        path: config.imgUrlPrefix+ results[i].path,
                        ms: results[i].ms
                    });
                }
            }
            callback(arr);
        }
    );
}

function getUserByChannel(channel, callback) {
    client = getClient();
    var url = util.format("select user_id,channel from user_channel_map where channel='%s'", channel);
    client.query(url, function (err, results, fields) {
        if (err) {
            throw err;
        }
        var r=undefined;
        if(results){
            for(var i=0;i<results.length;i++){
                r= results[i].user_id;
            }
        }
        callback(r);

    });
}

function getchannels(callback) {
    client = getClient();
    var url = "select user_id,channel from user_channel_map";
    client.query(url, function (err, results, f) {
        if (err) {
            throw err;
        }
        var map = new Map();

        if (results) {
            for (var i = 0; i < results.length; i++) {
                var r = results[i];
                if (!map.has(r.user_id)) {
                    map.set(r.user_id, []);
                }
                var chl = map.get(r.user_id);
                chl.push({
                    channel: r.channel,
                    stime: 0,
                    state: 0,
                    timer: 0
                });
            }
        }
        callback(map);
    });
}



function getClient() {
    if (client == null) {
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
    return client;
}

function close() {
    if (client != null) {
        client.end();
        client = null;
        console.log("close db")
    }
}

exports.selectPic = selectPic;
exports.close = close;
exports.getchannels = getchannels;
exports.getUserByChannel=getUserByChannel;
// selectPic(1479458519, 1479458539, 'ZheJiangFilm',function(data){
//     console.log(data);
// });