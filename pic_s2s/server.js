/// <reference path="typings/ws/ws.d.ts" />
/// <reference path="typings/hashmap/hashmap.d.ts" />
/// <reference path="typings/node-uuid/node-uuid.d.ts" />
var dbHelper = require("./mysqlHelper");
var model = require("./model");
var config = require("./config");

var hashmap = require("hashmap").HashMap;
var LINQ = require("node-linq").LINQ;
var WebSocketServer = require('ws').Server;
var Thenjs = require('thenjs');

wss = new WebSocketServer({
    port: 8181
});

var userMap = new hashmap.HashMap();

var channelMap = new Map();
dbHelper.getchannels(function (data) {
    channelMap = data;
});

wss.on('connection', function (ws) {
    var sendStockUpdates = function (user) {
        var ws = user.ws;
        if (ws.readyState == 1 && user.type != 1) {
            var chl = channelMap.get(user.id);
            if (chl == undefined) return;
            Thenjs.each(chl, function (cont, c) {
                if (c.state == 1 && c.timer < config.maxTimer) {
                    dbHelper.selectPic(c.stime - config.timeInterval, c.stime, c.channel, function (data) {
                        c.stime += 5;
                        c.timer += 5;
                        if (data.length == 0) {
                            cont(null, undefined);
                        } else {
                            cont(null, {
                                channels: data,
                                channel: c.channel
                            })
                        }
                    });
                } else {
                    c.state = 0;
                    cont(null, undefined);
                }
            }).then(function (cont, result) {
                var rs = [];
                if (result != undefined) {
                    result.forEach(function (s) {
                        if (s != undefined) {
                            rs.push(s);
                        }
                    });
                }

                var data = {
                    data: rs
                };
                var json = JSON.stringify(data);
                ws.send(json);
            })
        }
    }



    ws.on('message', function (json) {

        if (json === "null" || json === "") {
            return;
        }

        if (json == "channelmapupdate") {
            syncChannelMap();
            return;
        }

        try {
            var obj = JSON.parse(json);

            if (obj.hasOwnProperty("cancelChannel")) {
                channelMap.forEach(function (v, k) {
                    var value = new LINQ(v).SingleOrDefault(undefined, function (c) {
                        return c.channel == obj.cancelChannel;
                    });
                    if (value != undefined) {
                        value.state = 0;
                    }
                });

                return;
            }

            var user = undefined;
            if (obj.type == 1) {

                if (isUserExists(obj.id)) {
                    user = userMap.get(obj.id);
                } else {
                    user = new model.createUser(ws, obj.id, obj.type);
                    userMap.set(user.id, user);
                }

                user.channel = obj.channel.trim();
                user.stime = obj.stime;
                touch(user);
                console.log("sign:"+json);
                return;
            } else {
                if (isUserExists(obj.id)) {
                    console.log("user is exists");
                    //todo:user is exists
                    ws.send("用户已经登录！");
                    return;
                }
                var user = new model.createUser(ws, obj.id, obj.type);
                userMap.set(user.id, user);
            }

            if (user != undefined && user.interal == undefined) {
                console.log("user:" + user.id + " logined");
                user.interal = setInterval(function () {
                    sendStockUpdates(user);
                }, config.timeInterval * 1000);
                sendStockUpdates(user);
            }
        } catch (error) {
            console.log(error);
            return;
        }
    });

    ws.on('close', function () {
        console.log("start closing");

        userMap.forEach(function (v, k) {
            if (v.ws.readyState == v.ws.CLOSED) {
                if (typeof v.interal !== 'undefined') {
                    clearInterval(v.interal);
                }
                console.log("user:" + v.id + " is removed");
                userMap.remove(k);
            }
        });
        if (userMap.count() == 0) {
            console.log("closing:users is empty");
            dbHelper.close();
            console.log("Server CLOSED");
        }

    });
});

function touch(user) {
    var cm = getChannelFromChannelMap(user);
    if (cm != undefined) {
        cm.state = 1;
        cm.stime = user.stime;
        cm.timer = 0;
    }

    sendVideo(user);
}

function sendVideo(user) {
    var id = getUserIdByChannel(user);
    if (id != undefined) {
        var u = userMap.get(id);
        if (u != undefined) {
            u.ws.send("playvideo");
        }
    }
}

function syncChannelMap() {
    dbHelper.getchannels(function (data) {
        data.forEach(function (v, k) {
            var oldchannels = channelMap.get(k);
            oldchannels.forEach(function (c) {
                ch = new LINQ(v).SingleOrDefault(undefined, function (s) {
                    return s.channel == c.channel;
                })
                if (ch != undefined) {
                    ch.state = c.state;
                    ch.timer = c.timer;
                    ch.stime = c.timer;
                }

            });
        })
        channelMap = data;
    });

}


function getChannelFromChannelMap(o) {
    var result = undefined;
    channelMap.forEach(function (v, k) {
        var value = new LINQ(v).SingleOrDefault(undefined, function (c) {
            return c.channel == o.channel;
        });
        if (value != undefined) {
            result = value;
        }
    });
    return result;
}

function getUserIdByChannel(o) {
    var result = undefined;
    channelMap.forEach(function (v, k) {
        var value = new LINQ(v).SingleOrDefault(undefined, function (c) {
            return c.channel == o.channel;
        });
        if (value != undefined) {
            result = k;
        }
    });
    return result;
}

function isUserExists(id) {
    var result = false;
    userMap.forEach(function (v, k) {
        if (v.id == id) {
            result = true;
        }
    });
    return result;
}

function delChannelFromArr(user, channel) {
    var index = user.channels.indexOf(channel);
    if (index > -1) {
        user.channels.splice(index, 1);
    }
}


function testHaspMap() {
    if (map.count() == 0) {
        console.log("map is empty");
    }
    map.forEach(function (v, k) {
        console.log("testHaspMap" + k);
    });
}