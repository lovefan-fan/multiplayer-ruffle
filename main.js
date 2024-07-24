"use strict";

let game_keyup = null;
let game_keydown = null;
const iceServers = [
          {
            urls: [
              'turn:fan.jiuchengyixi.top:3478',
              'turn:fan.jiuchengyixi.top:3478?transport=tcp',
              'turns:fan.jiuchengyixi.top:5349?transport=tcp',
              'turns:fan.jiuchengyixi.top:443?transport=tcp'
            ],
            username: 'your.turn.domain',
            credential: 'your_secret_key'
          }
        ]
window.RufflePlayer = window.RufflePlayer || {};

var callIntervalId = null;

var guest_video_id = null;
var guest_data_id = null;

function on_host_load() {
    const ruffle = window.RufflePlayer.newest();
    const player = ruffle.createPlayer();
    const container = document.getElementById("container");
    player.style.width = "100%";
    player.style.height = "800px";
    container.appendChild(player);
    player.load("boxhead2play.swf");
    const peer = new Peer({
        host: 'fan.jiuchengyixi.top',
        port: 9000,
        secure: false, // 如果您使用SSL/TLS，请设置为true
        config: {
           iceServers: iceServers
       }
    });
    console.log("对等端连接信息=", peer);
    peer.on('open', function(id) {
        console.log('我的对等端ID是: ' + id);
        console.log("guest_data_id:", guest_data_id)
        let conn = peer.connect(guest_data_id);
        console.log("键盘链接之前", conn)
        conn.on('open', function() {
            console.log("键盘连接已建立1");
            // 接收消息
            conn.on('data', function(data) {
                console.log("接收到数据", data);
                window.dispatchEvent(new KeyboardEvent(data["type"], {
                    code: data['code'],
                }));
            });
        });
    });
    // 监听所有错误
peer.on('error', function(err) {
    console.error("发生错误:", err);
});

    const videopeer = new Peer({
        host: 'fan.jiuchengyixi.top',
        port: 9000,
        secure: false, // 如果您使用SSL/TLS，请设置为true
        config: {
           iceServers: iceServers
       }
    });
    callIntervalId = setInterval(function(p) {
        const canvasElt = document.querySelector("ruffle-player")?.shadowRoot.querySelector("canvas");
        if (canvasElt != null) {
            console.log("画布存在，现在开始建立呼叫");
            const stream = canvasElt.captureStream(30); // FPS
            const video_track = stream.getVideoTracks()[0];
            video_track.contentHint = "motion";
            var call = p.call(guest_video_id, stream);
            console.log("视频流=", stream);
            // 禁用，我们将在补偿延迟时重新启用此功能
            // document.getElementById("receiving-video").srcObject = stream;
            // document.getElementById("receiving-video").play();
            clearInterval(callIntervalId);
        } else {
            console.log("画布仍然为空");
        }
    }, 1000, videopeer);
}

function transmitKeystroke(conn, type, event) {
    console.log("正在传输 ", type, event);
    conn.send({type: type, code: event.code});
}

var displayPeerIdIntervalId = null;

function on_guest_load() {
    const peer = new Peer({
        host: 'fan.jiuchengyixi.top',
        port: 9000,
        secure: false, // 如果您使用SSL/TLS，请设置为true
        config: {
           iceServers: iceServers
       }
    });

    console.log("对等端连接信息=", peer);
    peer.on('open', function(id) {
        console.log('已打开，数据对等端ID是: ' + id);
        guest_data_id = id;
    });
    peer.on('connection', function(conn) {
        document.getElementById("connectiondetails").innerHTML = "";
        conn.on('open', function() {
            console.log("键盘连接已建立2");
            document.addEventListener("keyup", function(ev) {transmitKeystroke(conn, "keyup", ev)});
            document.addEventListener("keydown", function(ev) {transmitKeystroke(conn, "keydown", ev)});
        });
        // 添加错误处理
        conn.on('error', function(err) {
            console.error("键盘连接失败:", err);
        });
    });

    const videopeer = new Peer({
        host: 'fan.jiuchengyixi.top',
        port: 9000,
        secure: false, // 如果您使用SSL/TLS，请设置为true
        config: {
           iceServers: iceServers
       }
    });
    videopeer.on('open', function(id) {
        console.log('已打开，视频对等端ID是: ' + id);
        guest_video_id = id;
    })
videopeer.on('call', function(call) {
    console.log("接收到呼叫");

    // 创建一个Promise，它将在2秒后解析
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // 在处理流之前等待2秒
    delay(2000).then(() => {
        call.on('stream', function(stream) {
            console.log("在流上，现在尝试播放视频流:", stream);

            const videoElement = document.getElementById("receiving-video");
            if (videoElement) {
                videoElement.srcObject = stream;
                videoElement.play().then(() => {
                    console.log('视频播放成功');
                }).catch(error => {
                    console.error('视频播放失败', error);
                });
            } else {
                console.error('视频元素不存在');
            }
        });

        // 在延迟结束后再回答呼叫
        call.answer();
    });
});



    displayPeerIdIntervalId = setInterval(function() {
        if (guest_data_id != null && guest_video_id != null) {
            let combinedID = `${guest_data_id}/${guest_video_id}`
            document.getElementById("connectiondetails").innerHTML =
                `<h1>连接信息</h1><p>请将您的连接ID
                <input id="connectionid" readonly size="${combinedID.length}" value="${combinedID}"> 传递给主机。
                游戏将在主机点击“开始游戏”按钮时自动开始。`
            clearInterval(displayPeerIdIntervalId);
        } else {
            console.log("仍然为空");
        }
    }, 200);
}

function submit_host_id() {
    let guest_combined_id = document.getElementById("guest_combined_id").value.trim();
    if (guest_combined_id.length == 73) {
        guest_data_id = guest_combined_id.split('/')[0];
        guest_video_id = guest_combined_id.split('/')[1];
        on_host_load();
        document.getElementById("connectiondetails").innerHTML = '';
    } else {
        document.getElementById("error-connectiondetails").innerText = "发生错误";
    }
}

function click_host() {
    document.getElementById("hostguestchoice").remove();
    document.getElementById("connectiondetails").innerHTML = `
        <h1>主机</h1>
        <p>请粘贴从客户端接收到的ID</p>
        <input id="guest_combined_id" size="73">
        <div class="button-row"><button onclick="submit_host_id()">开始游戏</button></div>
        <div id="error-connectiondetails"></div>
    `
}

function click_guest() {
    document.getElementById("hostguestchoice").remove();
    document.getElementById("connectiondetails").innerHTML =
        "<h1>连接信息</h1><p>正在连接…</p>";
    on_guest_load();
}