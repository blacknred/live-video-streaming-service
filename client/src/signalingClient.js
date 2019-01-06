/* eslint-disable no-param-reassign */

const Connection = new window.RTCMultiConnection();
Connection.enableScalableBroadcast = true; // its mandatory in v3
// each relaying-user should serve only 1 users
// Connection.maxRelayLimitPerUser = 1;
// we don't need to keep room-opened
// scalable-broadcast.js will handle stuff itself.
Connection.autoCloseEntireSession = true;
Connection.socketURL = process.env.REACT_APP_SIGNALING_HOST; // socket.io server
Connection.socketMessageEvent = 'scalable-media-broadcast-demo';
// document.getElementById('broadcast-id').value = Connection.userid;
/*
recording is disabled because it is resulting for browser-crash
if you enable below line, please also uncomment above "RecordRTC.js"
*/
const enableRecordings = false;
const allRecordedBlobs = [];

function repeatedlyRecordStream(stream) {
    if (!enableRecordings) {
        return;
    }
    Connection.currentRecorder = window.RecordRTC(stream, {
        type: 'video',
    });
    Connection.currentRecorder.startRecording();
    setTimeout(() => {
        if (Connection.isUpperUserLeft || !Connection.currentRecorder) {
            return;
        }
        Connection.currentRecorder.stopRecording(() => {
            allRecordedBlobs.push(Connection.currentRecorder.getBlob());
            if (Connection.isUpperUserLeft) return;
            Connection.currentRecorder = null;
            repeatedlyRecordStream(stream);
        });
    }, 30 * 1000); // 30-seconds
}

const setConnection = async () => {
    Connection.connectSocket((socket) => {
        // log status
        socket.on('logs', (log) => {
            console.log('io logs: ', log);
        });
        // when a broadcast is absent
        socket.on('start-broadcasting', (typeOfStreams) => {
            console.log('start-broadcasting', typeOfStreams);
            // host i.e. sender should always use this!
            Connection.sdpConstraints.mandatory = {
                OfferToReceiveVideo: false,
                OfferToReceiveAudio: false,
            };
            Connection.session = typeOfStreams;
            // "open" method here will capture media-stream
            // we can skip this function always; it is totally optional here.
            // we can use "Connection.getUserMediaHandler" instead
            Connection.open(Connection.userid);
        });
        // when broadcast is already created
        socket.on('join-broadcaster', (hintsToJoinBroadcast) => {
            console.log('join-broadcaster', hintsToJoinBroadcast);
            Connection.session = hintsToJoinBroadcast.typeOfStreams;
            Connection.sdpConstraints.mandatory = {
                OfferToReceiveVideo: !!Connection.session.video,
                OfferToReceiveAudio: !!Connection.session.audio,
            };
            Connection.broadcastId = hintsToJoinBroadcast.broadcastId;
            Connection.join(hintsToJoinBroadcast.userid);
        });
        socket.on('rejoin-broadcast', (broadcastId) => {
            console.log('rejoin-broadcast', broadcastId);
            Connection.attachStreams = [];
            socket.emit('check-broadcast-presence', broadcastId, (isBroadcastExists) => {
                if (!isBroadcastExists) {
                    // the first person (i.e. real-broadcaster) MUST set his user-id
                    Connection.userid = broadcastId;
                }
                socket.emit('join-broadcast', {
                    broadcastId,
                    userid: Connection.userid,
                    typeOfStreams: Connection.session,
                });
            });
        });
        socket.on('broadcast-stopped', (broadcastId) => {
            // location.reload();
            console.error('broadcast-stopped', broadcastId);
            alert('This broadcast has been stopped.');
        });
    });
};

const getOrSetBroadcast = (broadcastId, cb) => {
    if (!broadcastId || broadcastId.replace(/^\s+|\s+$/g, '').length <= 0) {
        broadcastId = Connection.token();
    }
    Connection.extra.broadcastId = broadcastId;
    Connection.session = {
        audio: true,
        video: true,
        oneway: true,
    };
    Connection.getSocket((socket) => {
        socket.emit('check-broadcast-presence', broadcastId, (isBroadcastExists) => {
            console.log('check-broadcast-presence', broadcastId, isBroadcastExists);
            if (!isBroadcastExists) {
                // start broadcast by set broadcaster' userid
                // "start-broadcasting" event should be fired.
                Connection.userid = broadcastId;
            }
            // join broadcast
            socket.emit('join-broadcast', {
                broadcastId,
                userid: Connection.userid,
                typeOfStreams: Connection.session,
            });
            cb(isBroadcastExists);
        });
    });
};

const viewersUpdated = (cb) => {
    Connection.onNumberOfBroadcastViewersUpdated = (event) => {
        // if (!Connection.isInitiator) return;
        console.log(event);
        cb(event);
    };
};

const handleStream = (videoPreview) => {
    Connection.onstream = (event) => {
        if (Connection.isInitiator && event.type !== 'local') return;
        Connection.isUpperUserLeft = false;
        videoPreview.srcObject = event.stream;
        videoPreview.play();
        videoPreview.userid = event.userid;
        if (event.type === 'local') {
            videoPreview.muted = true;
        }
        if (Connection.isInitiator === false && event.type === 'remote') {
            // he is merely relaying the media
            Connection.dontCaptureUserMedia = true;
            Connection.attachStreams = [event.stream];
            Connection.sdpConstraints.mandatory = {
                OfferToReceiveAudio: false,
                OfferToReceiveVideo: false,
            };
            Connection.getSocket((socket) => {
                socket.emit('can-relay-broadcast');
                if (Connection.DetectRTC.browser.name === 'Chrome') {
                    Connection.getAllParticipants().forEach((p) => {
                        if (`${p}` !== `${event.userid}`) {
                            const { peer } = Connection.peers[p];
                            peer.getLocalStreams().forEach((localStream) => {
                                peer.removeStream(localStream);
                            });
                            event.stream.getTracks().forEach((track) => {
                                peer.addTrack(track, event.stream);
                            });
                            Connection.dontAttachStream = true;
                            Connection.renegotiate(p);
                            Connection.dontAttachStream = false;
                        }
                    });
                }
                if (Connection.DetectRTC.browser.name === 'Firefox') {
                    // Firefox is NOT supporting removeStream method
                    // that's why using alternative hack.
                    // NOTE: Firefox seems unable to replace-tracks of the remote-media-stream
                    // need to ask all deeper nodes to rejoin
                    Connection.getAllParticipants().forEach((p) => {
                        if (`${p}` !== `${event.userid}`) {
                            Connection.replaceTrack(event.stream, p);
                        }
                    });
                }
                // Firefox seems UN_ABLE to record remote MediaStream
                // WebAudio solution merely records audio
                // so recording is skipped for Firefox.
                if (Connection.DetectRTC.browser.name === 'Chrome') {
                    repeatedlyRecordStream(event.stream);
                }
            });
        }
        // to keep room-id in cache
        // localStorage.setItem(Connection.socketMessageEvent, Connection.sessionid);
    };

    Connection.onstreamended = () => {};

    Connection.onleave = (event) => {
        if (event.userid !== videoPreview.userid) return;
        Connection.getSocket((socket) => {
            socket.emit('can-not-relay-broadcast');
            Connection.isUpperUserLeft = true;
            if (allRecordedBlobs.length) {
                // playing lats recorded blob
                const lastBlob = allRecordedBlobs[allRecordedBlobs.length - 1];
                videoPreview.src = URL.createObjectURL(lastBlob);
                videoPreview.play();
                allRecordedBlobs.length = 0;
            } else if (Connection.currentRecorder) {
                const recorder = Connection.currentRecorder;
                Connection.currentRecorder = null;
                recorder.stopRecording(() => {
                    if (!Connection.isUpperUserLeft) return;
                    videoPreview.src = URL.createObjectURL(recorder.getBlob());
                    videoPreview.play();
                });
            }
            if (Connection.currentRecorder) {
                Connection.currentRecorder.stopRecording();
                Connection.currentRecorder = null;
            }
        });
    };
};

export {
    setConnection,
    getOrSetBroadcast,
    viewersUpdated,
    handleStream,
};

export default Connection;
