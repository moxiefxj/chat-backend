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
            let sqlStr1 = 'select * from table1 where isonline = ? and username =?'
            let result1 = await sqlQuery(sqlStr1,['true',data.username])
            if(result1.length > 0){
                socket.to(result1[0].socketid).emit('logout',{content:'有人登录进来了，你被强制踢出去了！'})
            }

        //    修改数据库的登录信息(socketid,isonline)
            let sqlStr = "update table1 set socketid=?,isonline=? where username =?" 
            let result = await sqlQuery(sqlStr,[socket.id,'true',data.username])
            socket.emit('login',{
                state:'ok',
                content:"登陆成功"
            })
            
            let sqlStr2 = "select * from table1"
            //等待获取mysql查询结果
            let result2 =await sqlQuery(sqlStr2)
            io.sockets.emit('users',Array.from(result2))

            // 最新未接收的信息
            let sqlStr3 = 'select * from chat where isread = ? and toname = ?' 
            let result3 =await sqlQuery(sqlStr3,['false',data.username])

            socket.emit('unreadMsg',Array.from(result3))
       })

    //    监听断开事件
       socket.on('disconnect',async function(){
            // 修改数据库的登录信息(socketid,isonline)
            let sqlStr = "update table1 set socketid=?,isonline=? where socketid =?" 
            let result = await sqlQuery(sqlStr,[null,null,socket.id])
       })

       socket.on('users',async function(){
            let sqlStr = "select * from table1"

            //等待获取mysql查询结果
            let result =await sqlQuery(sqlStr)
            socket.emit('users',Array.from(result))
       })

       socket.on('sendMsg',async function(msg){
           console.log(msg)
            // 判断收消息的人是否在线
            let strSql = 'select * from table1 where username = ? and isonline = ?'
            let result = await sqlQuery(strSql,[msg.toname.username,'true'])
            if(result.length > 0){
                // 如果此人在线，那么直接发送消息
                let toid = result[0].socketid
                socket.toname(toid).emit(msg)
                // 将聊天内容存放到数据库
                let strSql1 = 'insert into chat (sendname,toname,content,chattime,isread) values (?,?,?,?,?)'
                let arr1 =[msg.sendname.username,msg.toname.username,msg.content,msg.chattime,'true']
                sqlQuery(strSql1,arr1)
            }else{
                let strSql1 = 'insert into chat (sendname,toname,content,chattime,isread) values (?,?,?,?,?)'
                let arr1 =[msg.sendname.username,msg.toname.username,msg.content,msg.chattime,'false']
                sqlQuery(strSql1,arr1)
            }
       })   
    });
}
socketio.getSocket = getSocket;

module.exports = socketio