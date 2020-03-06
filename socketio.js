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
            let sqlStr1 = 'select * from users where isonline = ? and username =?'
            let result1 = await sqlQuery(sqlStr1,['true',data.username])
            if(result1.length > 0){
                socket.to(result1[0].socketid).emit('logout',{content:'有人登录进来了，你被强制踢出去了！'})
            }

        //    修改数据库的登录信息(socketid,isonline)
            let sqlStr = "update users set socketid=?,isonline=? where username =?" 
            let result = await sqlQuery(sqlStr,[socket.id,'true',data.username])
            socket.emit('login',{
                data:data,
                state:'ok',
                content:"登陆成功"
            })

            // let sqlStr2 = "select * from users"
            // //等待获取mysql查询结果
            // let result2 =await sqlQuery(sqlStr2)
            // io.sockets.emit('users',Array.from(result2))

            // 最新未接收的个人信息
            // 下一版将改进为时间戳刷新消息
            let sqlStr3 = 'select * from chat where isread = ? and toid = ? '  
            let result3 =await sqlQuery(sqlStr3,['false',data.id])
            socket.emit('unreadMsg',Array.from(result3))

            // 加入群(房间)
            let sqlStr4 = 'SELECT * FROM groupchat g WHERE id IN(SELECT groupid FROM users u,user_group ug WHERE u.id = ug.userid AND u.id = ?)'
            let result4 = await sqlQuery(sqlStr4,data.id)
            console.log(result4.id)
            console.log(Array.from(result4))
            socket.emit('room',Array.from(result4))
            Array.from(result4).forEach((item,index)=>{
                socket.join(item.groupchat)  //加入房间
            })

       })

    //    监听断开事件
       socket.on('disconnect',async function(){
            // 修改数据库的登录信息(socketid,isonline)
            let sqlStr = "update users set socketid=?,isonline=? where socketid =?" 
            let result = await sqlQuery(sqlStr,[null,null,socket.id])
       })

       socket.on('users',async function(data){
            let sqlStr = "select * from users where id in (select friendid from friends where userid = ?)"
            //等待获取mysql查询结果
            let result =await sqlQuery(sqlStr,[data.id])
            socket.emit('users',Array.from(result))

       })

       socket.on('sendMsg',async function(msg){
            // 判断收消息的人是否在线
            let strSql = 'select * from users where username = ? and isonline = ?'
            let result = await sqlQuery(strSql,[msg.toid.username,'true'])
            if(result.length > 0){
                // 如果此人在线，那么直接发送消息
                let toid = result[0].socketid
                
                socket.to(toid).emit('accept',msg)
                // // 将聊天内容存放到数据库
                let strSql1 = 'insert into chat (sendid,toid,content,chattime,isread) values (?,?,?,?,?)'
                let arr1 =[msg.sendid.id,msg.toid.id,msg.content,msg.chattime,'true']
                sqlQuery(strSql1,arr1)
            }else{
                let strSql1 = 'insert into chat (sendid,toid,content,chattime,isread) values (?,?,?,?,?)'
                let arr1 =[msg.sendid.id,msg.toid.id,msg.content,msg.chattime,'false']
                sqlQuery(strSql1,arr1)
            }
       }) 
       
    //    如果收到已读消息，将isread改为true
       socket.on('readMsg',(data)=>{
           let sqlStr = 'update chat set isread =? where sendid = ? and toid = ?'
           sqlQuery(sqlStr,['true',data.userid,data.selfid])
       })
    });
}
socketio.getSocket = getSocket;

module.exports = socketio