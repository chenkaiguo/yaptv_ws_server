function createUser(ws,id,t){
    var obj=new Object()
    obj.id=id;
    obj.ws=ws;
    obj.type=t;
    obj.interal=undefined;
    return obj;
}

exports.createUser=createUser;