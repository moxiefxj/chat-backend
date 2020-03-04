let socketio = {}

function getSocket(server){
    socketio.io = require('socket.io')(server)
    let io = socketio.io;
  
    io.on('connection', function (socket) {
        //此处的socket是当前浏览器与服务器的连接对象
        //当新的用户连接进来时，向所有人广播此人的id
        io.sockets.emit('addUser',{
            id:socket.id,
            content:"新用户"
        })
        socket.emit('news', { hello: 'world' });
        socket.on('my other event', function (data) {

            console.log(socket.id)
            console.log(data);

            socket.emit('hello',{content:"学习"})
        });

        //向某个用户发送消息
        socket.on('sendUser',function(data){
            // data = {
            //     from:"发送者的id",
            //     to:"收到者id",
            //     content:"xxxxx"
            // }
            socket.to(data.to).emit('sendClient',data)
        })

        //加入群聊
        socket.on('addRoom',function(data){
            console.log(data)
            let roomObj = socket.join(data.room)
            console.log(roomObj)
        })

        //监听群聊事件，并且广播
        socket.on('sendMsgRoom',function(data){
            socket.to(data.room).emit('qunliao',data)
        })
    });

    let qq = io.of('/qq')
    qq.on('connection', function () {
        qq.emit('news',{content:"qq命名空间"})
    })
}
socketio.getSocket = getSocket;

module.exports = socketio