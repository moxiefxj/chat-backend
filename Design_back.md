#聊天软件后端设计文档
##表的设计
- 用户表(user)

| Name        | DataType          | 描述  |
| ------------- |:-------------:| -----:|
| id      | INT(11) | 主键 |
|email|chat(20)|Not null|
| username | char(20)     |  Not null |
| password |  char(20)   |   Not null |
|headerimg|varchar(255)|设置默认值|
|socketid|varchar(255)|允许为空|
|isonline|int(1)|0 or 1|
|chattime|BIGINT(255)|允许为空|

***


- 好友表(friends)

| Name        | DataType       |描述 |
| ------------- |:-------------:| -----:|
|userid|INT(11)||
|friendid|INT(11)||
|state|char(20)|删除 or 未通过 or 是好友|
|addtime|BIGINT(255)|成为好友时间|

***

- 房间表(room)

| Name        | DataType          | 描述  |
| ------------- |:-------------:| -----:|
|id|INT(11)|主键|
|roomname|char(20)|not null|
|roomimg|char(20)|设置默认|

***
- 用户与房间的关系表(user_room)

| Name        | DataType          | 描述  |
| ------------- |:-------------:| -----:|
|userid|INT(11)|外键  与user表中的id|
|roomid|INT(11)|外键   与room表中的id|
|readtime|BIGINT(255)|接收房间信息时间|
|state|char(20)|退群 or 待通过 or 加入群|
|addtime|BIGINT(255)|加群时间|

***
- 用户聊天表（userchat）

| Name        | DataType          | 描述  |
| ------------- |:-------------:| -----:|
|sendid|INT(11)||
|sendimg|varchar(255)||
|toid|INT(11)||
|toimg|varchar(255)||
|content|varchar(255)||
|chattime|BIGINT(255)||
|readtime|BIGINT(255)||

***
- 房间聊天表(roomchat)

| Name        | DataType          | 描述  |
| ------------- |:-------------:| -----:|
|sendid|INT(11)||
|sendimg|varchar(255)||
|toroomid|INT(11)||
|toroomimg|varchar(255)||
|content|varchar(255)||
|chattime|BIGINT(255)||

##功能
###1.登录 
```
socket.on('login',async function(data){
    //data: 两个字段（email,password）
}
```
- 根据email查找用户，验证密码  
    - 若返回0条数据
    ```
        socket.emit('login_error',{content:'密码或账户错误'})
    ```

    - 若返回的一条数据：
        - isonline == true  对当前登录状态的用户执行
        
        ```
        socket.to(result1[0].socketid).emit('logout',{
            content:'有人登录进来了，你被强制踢出去了！'
            })
        ```
        - 更新数据库信息
        ```
            isonline = true
            socketid = socket.id
            //返回登录成功
            socket.emit('login',{
                data:result1,
                state:'ok',
                content :'登陆成功'
            })
        ```

        - 获取最新未接收到的个人消息
        ```
            socket.emit('unreadMsg',查询的结果)
        ```
        - 获取最新未接收的群消息
        ```
        socket.emit('unreadroomMsg',查询的结果)
        ```

###2.注册
###3.获取用户列表
```
socket.on('user',function(data){
    //返回用户列表
    socket.emit('user',查询的结果)
})
```
###获取群列表
```
socket.on('room',function(data){
    //返回房间列表
    socket.emit('room',查询的结果)
})
```
###断开事件
```
socket.on('disconnect',function(){
    修改数据库socketid   isonline
})
```
###发送个人信息
```
socket.on('senduserMsg',function(data){
})
```
- 判断toid 是否在线
    - isonline -- true
        直接发送消息
    - 保存消息到userchat表中

###发送群消息
- 根据toroomid 查找userid
    - isonline -- true
        直接发送消息
    - 保存消息到roomchat表中  

###看个人消息后，修改消息状态
```
socket.on('readMsg',data()=>{

})
```
###看完群消息，修改readtime
```
socket.on('readRoomMsg',data(){

})
```