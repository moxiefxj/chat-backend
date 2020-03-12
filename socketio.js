let socketio = {}

let sqlQuery = require('./module/lcMysql')

function getSocket(server){
    socketio.io = require('socket.io')(server)
    let io = socketio.io;
  
    io.on('connect', function (socket) {
       console.log(socket.id+"建立连接")

       //接收登陆事件
       socket.on('login',async function(data){
            // 先判断是否已经有人在登录，如果有人在登录扽话，将其断开连接
            let sqlStr1 = 'select * from user where isonline = ? and username =?'
            let result1 = await sqlQuery(sqlStr1,[1,data.username])
            if(result1.length > 0){
                socket.to(result1[0].socketid).emit('logout',{content:'有人登录进来了，你被强制踢出去了！'})
            }

        //    修改数据库的登录信息(socketid,isonline)
            let sqlStr = "update user set socketid=?,isonline=? where username =?" 
            let result = await sqlQuery(sqlStr,[socket.id,1,data.username])
            socket.emit('login',{
                data:data,
                state:'ok',
                content:"登陆成功"
            })

            // 最新未接收的个人信息
            let sqlStr3 = 'select * from userchat where readtime = ? and toid = ? '  
            let result3 =await sqlQuery(sqlStr3,[0,data.id])
            socket.emit('unreadMsg',Array.from(result3))

            // 最新未接收的群消息
            let sqlStr4 = 'select * from roomchat where chattime > all(select readtime from user_room where userid = ?)'
            let result4 = await sqlQuery(sqlStr4,[data.id])
            console.log(result4)
            socket.emit('unreadroomMsg',Array.from(result4))

       })

    //    监听断开事件
       socket.on('disconnect',async function(){
            // 修改数据库的登录信息(socketid,isonline)
            let sqlStr = "update user set socketid=?,isonline=? where socketid =?" 
            let result = await sqlQuery(sqlStr,[null,0,socket.id])
       })
    //    获取好友列表
       socket.on('users',async function(data){
            let sqlStr = "select * from user where id in (select friendid from friends where userid = ?)"
            //等待获取mysql查询结果
            let result =await sqlQuery(sqlStr,[data.id])
            socket.emit('users',Array.from(result))
       })
    //    获取群列表
       socket.on('room',async function(data){
            let sqlStr = 'select * from room where id in (select roomid from user_room where userid = ?)'
            let result = await sqlQuery(sqlStr,[data.id])
            socket.emit('room',Array.from(result))

            Array.from(result).forEach((item,index)=>{
                socket.join(item.roomchat)  //加入房间
            })
       })
    //    发送个人消息
       socket.on('sendMsg',async function(msg){
            // 判断收消息的人是否在线
            let strSql = 'select * from user where id = ? and isonline = ?'
            let result = await sqlQuery(strSql,[msg.toid,1])
            console.log(result)
            if(result.length > 0){
                // 如果此人在线，那么直接发送消息
                let toid = result[0].socketid
                socket.to(toid).emit('accept',msg)
                // // // 将聊天内容存放到数据库
            }
            let strSql1 = 'insert into userchat (sendid,sendimg,toid,toimg,content,chattime,readtime) values (?,?,?,?,?,?,?)'
            let arr1 =[msg.sendid,msg.sendimg,msg.toid,msg.toimg,msg.content,msg.chattime,0]
            sqlQuery(strSql1,arr1)
       }) 
    //    发送群消息
       socket.on('sendRoomMsg',async function(msg){
            // 判断组内成员是否在线
            let strSql = 'select * from user where isonline = 1 and id in (select userid from user_room where roomid = ? and userid != ?)'
            let result = await sqlQuery(strSql,[msg.toid,msg.sendid])
            console.log(result)
            if(result.length > 0){
                // 给在线的直接发送消息
                for(let i = 0; i < result.length; i++ ){
                    let toid = result[i].socketid
                    socket.to(toid).emit('acceptroom',msg)
                }
            }
            let strSql1 = 'insert into roomchat (sendid,sendimg,toroomid,toroomimg,content,chattime) values (?,?,?,?,?,?)'
            let arr1 =[msg.sendid,msg.sendimg,msg.toid,msg.toimg,msg.content,msg.chattime]
            sqlQuery(strSql1,arr1)

       })
       
    //    如果收到个人未读读消息，将userchat表的 readtime更新
       socket.on('readMsg',(data)=>{ 
           let sqlStr = 'update userchat set readtime = ? where sendid = ? and toid = ?'
           sqlQuery(sqlStr,[1,data.sendid,data.toid])
       })
    //    如果收到群未读读消息，将user_room表的 readtime更新
       socket.on('readroomMsg',(data)=>{ 
        let sqlStr = 'update user_room set readtime = ? where roomid = ? and userid = ?'
        console.log(data)
        sqlQuery(sqlStr,[new Date().getTime(),data.toid,data.selfid])
    })
    });
}
socketio.getSocket = getSocket;

module.exports = socketio