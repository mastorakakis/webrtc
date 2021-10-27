//connecting to our signaling server
// var conn = new WebSocket('ws://elearning.ocn.edu.gr:8444/webrtc/socket');
var conn = new WebSocket('ws://192.168.1.49:8080/webrtc/socket');

conn.onopen = function () {
    console.log("Connected to the signaling server");
    initialize();
};

conn.onerror = function (ev) {
    console.log(ev);
}

conn.onclose = function (ev) {
    console.log("onclose event:");
    console.log(ev);
    console.log("close reason: " + ev.reason);
}

conn.onmessage = function (msg) {
    console.log("Got message", msg.data);
    var content = JSON.parse(msg.data);
    var data = content.data;
    switch (content.event) {
        // when somebody wants to call us
        case "offer":
            handleOffer(data);
            break;
        case "answer":
            handleAnswer(data);
            break;
        // when a remote peer sends an ice candidate to us
        case "candidate":
            handleCandidate(data);
            break;
        default:
            break;
    }
};

function send(message) {
    conn.send(JSON.stringify(message));
}

var peerConnection;
var dataChannel;
var input = document.getElementById("messageInput");

function initialize() {

    var configuration = {
        'iceServers': [
            {
                'urls': 'stun:stun.12connect.com:3478'
            },
            {
                'urls': 'stun:stun.ucert.gr:3478'
            },
            {
                'urls': 'turn:numb.viagenie.ca',
                'credential': 'muazkh',
                'username': 'webrtc@live.com'
            },
            {
                'urls': 'turn:turn.ucert.gr:5349',
                'credential': 'test',
                'username': '12345'
            }
        ]
    };

    peerConnection = new RTCPeerConnection(configuration);
    console.log("New RTCPeerConnection");

    // Setup ice handling
    peerConnection.onicecandidate = function (event) {
        console.log("On IceCandidate");
        if (event.candidate) {
            console.log("WebSocket sending candidate");
            send({
                event: "candidate",
                data: event.candidate
            });
        }
    };

    // creating data channel
    dataChannel = peerConnection.createDataChannel("dataChannel", {
        reliable: true
    });
    console.log("New DataChannel");

    dataChannel.onerror = function (error) {
        console.log("Error occured on datachannel:", error);
    };

    // when we receive a message from the other peer, printing it on the console
    dataChannel.onmessage = function (event) {
        console.log("message:", event.data);
    };

    dataChannel.onclose = function () {
        console.log("data channel is closed");
    };

    peerConnection.ondatachannel = function (event) {
        dataChannel = event.channel;
        console.log("On DataChannel");
    };

    const constraints = {
        video: true, audio: true
    };
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        document.getElementById("local-video").srcObject = stream;
        peerConnection.addStream(stream);
    }).catch(function (err) { /* handle the error */
    });
}

function createOffer() {
    console.log("Create Offer");
    peerConnection.createOffer(function (offer) {
        console.log("WebSocket sending offer");
        send({
            event: "offer",
            data: offer
        });
        peerConnection.setLocalDescription(offer);
        console.log("Set LocalDescription");
    }, function (error) {
        alert("Error creating an offer");
    });
}

function handleOffer(offer) {
    console.log("Handle Offer");
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    console.log("Set RemoteDescription");

    // create and send an answer to an offer
    peerConnection.createAnswer(function (answer) {
        console.log("Create Answer");
        peerConnection.setLocalDescription(answer);
        console.log("Set LocalDescription");
        console.log("WebSocket sending answer");
        send({
            event: "answer",
            data: answer
        });
    }, function (error) {
        alert("Error creating an answer");
    });
    peerConnection.onaddstream = (e) => {
        document.getElementById("remote-video")
            .srcObject = e.stream
    }
};

function handleCandidate(candidate) {
    console.log("Handle Candidate");
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    console.log("Add Candidate");
};

function handleAnswer(answer) {
    console.log("Handle Answer");
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    console.log("Set RemoteDescription");
    console.log("connection established successfully!!");
    peerConnection.onaddstream = (e) => {
        document.getElementById("remote-video")
            .srcObject = e.stream
    }
};

function sendMessage() {
    dataChannel.send(input.value);
    input.value = "";
}
