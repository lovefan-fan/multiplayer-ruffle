const { PeerServer } = require('peer');  
const peerServer = PeerServer({  
    port: 9000, // 指定服务器监听的端口  
    path: '/myapp', // 可选，指定WebSocket路径  
    // 如果需要SSL/TLS，可以添加ssl配置  
    // ssl: {  
    //     key: fs.readFileSync('path/to/your/private.key'),  
    //     cert: fs.readFileSync('path/to/your/certificate.crt')  
    // }  
});  

peerServer.on('connection', (id) => {  
    console.log(`Peer ${id} connected`);  
});  

peerServer.on('disconnect', (id) => {  
    console.log(`Peer ${id} disconnected`);  
});  

console.log('PeerJS server is running on port 9000');