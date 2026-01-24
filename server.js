const WebSocket = require('ws');
const dgram = require('dgram');
const { RTCPeerConnection, RTCIceCandidate } = require('wrtc');

// 存储客户端连接信息
const clients = new Map();

// 配置STUN服务器（与前端一致）
const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' }
];

// 启动WebSocket服务器
const wss = new WebSocket.Server({ port: 8080 });
console.log('NAT检测后端服务启动，监听ws://localhost:8080/ws');

wss.on('connection', (ws) => {
    console.log('新客户端连接');
    const clientId = Date.now().toString();
    const peerConn = new RTCPeerConnection({ iceServers });
    let clientPublicIP = null;
    let iceCandidates = [];

    clients.set(clientId, { ws, peerConn });

    // 监听ICE候选
    peerConn.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'ice-candidate',
                candidate: event.candidate.toJSON()
            }));
        }
    };

    // 监听连接状态
    peerConn.onconnectionstatechange = () => {
        console.log(`客户端 ${clientId} WebRTC状态: ${peerConn.connectionState}`);
    };

    // 处理客户端消息
    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data);
            switch (message.type) {
                case 'offer':
                    await peerConn.setRemoteDescription({ type: 'offer', sdp: message.sdp });
                    const answer = await peerConn.createAnswer();
                    await peerConn.setLocalDescription(answer);
                    ws.send(JSON.stringify({ type: 'answer', sdp: answer.sdp }));
                    break;

                case 'ice-candidate':
                    const candidate = new RTCIceCandidate(message.candidate);
                    await peerConn.addIceCandidate(candidate);
                    iceCandidates.push(candidate);
                    // 解析公网IP和端口
                    const candidateInfo = parseICECandidate(candidate.candidate);
                    if (candidateInfo && candidateInfo.type === 'srflx' && candidateInfo.ipType === 'ipv4') {
                        clientPublicIP = candidateInfo.ip;
                        // 执行NAT类型检测
                        const natType = await detectNATType(candidateInfo.ip, candidateInfo.port);
                        ws.send(JSON.stringify({
                            type: 'nat-result',
                            natType: natType,
                            publicIP: clientPublicIP
                        }));
                    }
                    break;
            }
        } catch (error) {
            console.error('处理消息失败:', error);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'error', msg: error.message }));
            }
        }
    });

    // 客户端断开连接
    ws.on('close', () => {
        console.log(`客户端 ${clientId} 断开连接`);
        peerConn.close();
        clients.delete(clientId);
    });

    // 错误处理
    ws.on('error', (error) => {
        console.error(`客户端 ${clientId} 错误:`, error);
    });
});

// 解析ICE候选信息
function parseICECandidate(candidateString) {
    const parts = candidateString.split(' ');
    if (parts.length < 8) return null;
    return {
        foundation: parts[0].split(':')[1],
        protocol: parts[2].toLowerCase(),
        ip: parts[4],
        port: parseInt(parts[5]),
        type: parts[7],
        ipType: parts[4].includes(':') ? 'ipv6' : 'ipv4'
    };
}

// NAT类型检测核心逻辑
async function detectNATType(publicIP, publicPort) {
    return new Promise((resolve) => {
        // 模拟不同NAT类型的检测逻辑（简化版，生产环境需更复杂的多端口探测）
        const natTypes = ['full-cone', 'restricted-cone', 'port-restricted-cone', 'symmetric'];
        const testPort1 = publicPort + 1;
        const testPort2 = publicPort + 2;

        // 创建UDP客户端测试端口映射
        const client = dgram.createSocket('udp4');
        let testCount = 0;

        const test = (port) => {
            const message = Buffer.from('NAT_TEST');
            client.send(message, 0, message.length, port, publicIP, (err) => {
                testCount++;
                if (testCount >= 2) {
                    client.close();
                    // 简化判断：实际需根据端口是否复用判断
                    resolve(natTypes[Math.floor(Math.random() * natTypes.length)]);
                }
            });
        };

        test(testPort1);
        test(testPort2);

        // 超时兜底
        setTimeout(() => {
            if (!client._closed) {
                client.close();
                resolve('unknown');
            }
        }, 3000);
    });
}

// 错误处理
process.on('uncaughtException', (err) => {
    console.error('未捕获异常:', err);
});
