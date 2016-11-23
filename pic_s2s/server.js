/// <reference path="typings/ws/ws.d.ts" />
/// <reference path="typings/hashmap/hashmap.d.ts" />
/// <reference path="typings/node-uuid/node-uuid.d.ts" />
var dbHelper = require("./mysqlHelper");

var HashMap = require('hashmap');
var WebSocketServer = require('ws').Server,

    wss = new WebSocketServer({
        port: 8181
    });

var map = new HashMap();


wss.on('connection', function (ws) {

    var sendStockUpdates = function (ws, id) {
        if (ws.readyState == 1) {
            dbHelper.selectPic(1479458519, 1479458539, 'ZheJiangFilm', function (data) {
               ws.send(data);
            });
        }
    }

    var clientStockUpdater = 'undefined';

    ws.on('message', function (id) {
        if (id == "null") {
            console.log("null is not be allowed!");
            return;
        }
        if (!map.has(id)) {
            map.set(id, ws);
        } else {
            ws.send("user is logined");
            return;
        }
        clientStockUpdater = setInterval(function () {
            sendStockUpdates(ws, id);
        }, 1000);

        sendStockUpdates(ws, id);

    });

    ws.on('close', function () {
        console.log("start closing");
        map.forEach(function (ws, k) {
            if (ws.readyState == ws.CLOSED) {
                map.remove(k);
            }
        });

        if (map.count() == 0) {
            console.log("closing:map is empty");
            if (typeof clientStockUpdater !== 'undefined') {
                clearInterval(clientStockUpdater);
                dbHelper.close();
                console.log("Server CLOSED");
            }
        }

    });
});


function testHaspMap() {
    if (map.count() == 0) {
        console.log("map is empty");
    }
    map.forEach(function (v, k) {
        console.log("testHaspMap" + k);
    });
}

function testgit(){}