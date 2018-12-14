/*
recording is disabled because it is resulting for browser-crash
if you enable below line, please also uncomment above "RecordRTC.js"
*/
const enableRecordings = false;
const connection = new window.RTCMultiConnection();

export const setConnection = async () => {
    connection.enableScalableBroadcast = true; // its mandatory in v3
    // each relaying-user should serve only 1 users
    connection.maxRelayLimitPerUser = 1;
    // we don't need to keep room-opened
    // scalable-broadcast.js will handle stuff itself.
    connection.autoCloseEntireSession = true;
    connection.socketURL = process.env.REACT_APP_WS_HOST; // socket.io server
    connection.socketMessageEvent = 'scalable-media-broadcast-demo';
    // document.getElementById('broadcast-id').value = connection.userid;


    /* SET BROADCASTER */
    connection.connectSocket((socket) => {
        // log status
        socket.on('logs', (log) => {
            console.log('io logs: ', log);
            // document.getElementById('status').innerText = log;
        });
        // when a broadcast is absent
        socket.on('start-broadcasting', (typeOfStreams) => {
            console.log('start-broadcasting', typeOfStreams);
            // host i.e. sender should always use this!
            connection.sdpConstraints.mandatory = {
                OfferToReceiveVideo: false,
                OfferToReceiveAudio: false,
            };
            connection.session = typeOfStreams;
            // "open" method here will capture media-stream
            // we can skip this function always; it is totally optional here.
            // we can use "connection.getUserMediaHandler" instead
            connection.open(connection.userid);
        });
        // when broadcast is already created
        socket.on('join-broadcaster', (hintsToJoinBroadcast) => {
            console.log('join-broadcaster', hintsToJoinBroadcast);
            connection.session = hintsToJoinBroadcast.typeOfStreams;
            connection.sdpConstraints.mandatory = {
                OfferToReceiveVideo: !!connection.session.video,
                OfferToReceiveAudio: !!connection.session.audio,
            };
            connection.broadcastId = hintsToJoinBroadcast.broadcastId;
            connection.join(hintsToJoinBroadcast.userid);
        });
        // socket.on('rejoin-broadcast', (broadcastId) => {
        //     console.log('rejoin-broadcast', broadcastId);
        //     connection.attachStreams = [];
        //     socket.emit('check-broadcast-presence', broadcastId, (isBroadcastExists) => {
        //         if (!isBroadcastExists) {
        //             // the first person (i.e. real-broadcaster) MUST set his user-id
        //             connection.userid = broadcastId;
        //         }
        //         socket.emit('join-broadcast', {
        //             broadcastId,
        //             userid: connection.userid,
        //             typeOfStreams: connection.session,
        //         });
        //     });
        // });
        socket.on('broadcast-stopped', (broadcastId) => {
            // location.reload();
            console.error('broadcast-stopped', broadcastId);
            alert('This broadcast has been stopped.');
        });
    });


    /* UI EVENTS */
    const allRecordedBlobs = [];
    // const startButton = document.getElementById('open-or-join');
    const videoPreview = document.getElementById('video-preview');
    // const txtBroadcastId = document.getElementById('broadcast-id');
    // window.onbeforeunload = () => startButton.disabled = false; // Firefox fix
    // startButton.onclick = () => {
    //     const broadcastId = document.getElementById('broadcast-id').value;
    //     if (broadcastId.replace(/^\s+|\s+$/g, '').length <= 0) {
    //         alert('Please enter broadcast-id');
    //         txtBroadcastId.focus();
    //         return;
    //     }
    //     startButton.disabled = true;
    //     connection.extra.broadcastId = broadcastId;
    //     connection.session = {
    //         audio: true,
    //         video: true,
    //         oneway: true
    //     };
    //     connection.getSocket((socket) => {
    //         socket.emit('check-broadcast-presence', broadcastId, (isBroadcastExists) => {
    //             if (!isBroadcastExists) {
    //                 // the first person (i.e. real-broadcaster) MUST set his user-id
    //                 connection.userid = broadcastId;
    //             }
    //             console.log('check-broadcast-presence', broadcastId, isBroadcastExists);
    //             socket.emit('join-broadcast', {
    //                 broadcastId: broadcastId,
    //                 userid: connection.userid,
    //                 typeOfStreams: connection.session
    //             });
    //         });
    //     });
    // };
    function repeatedlyRecordStream(stream) {
        if (!enableRecordings) {
            return;
        }
        connection.currentRecorder = window.RecordRTC(stream, {
            type: 'video',
        });
        connection.currentRecorder.startRecording();
        setTimeout(() => {
            if (connection.isUpperUserLeft || !connection.currentRecorder) {
                return;
            }
            connection.currentRecorder.stopRecording(() => {
                allRecordedBlobs.push(connection.currentRecorder.getBlob());
                if (connection.isUpperUserLeft) {
                    return;
                }
                connection.currentRecorder = null;
                repeatedlyRecordStream(stream);
            });
        }, 30 * 1000); // 30-seconds
    }
    // function disableInputButtons() {
    //     document.getElementById('open-or-join').disabled = true;
    //     document.getElementById('broadcast-id').disabled = true;
    // }
    connection.onstream = (event) => {
        if (connection.isInitiator && event.type !== 'local') {
            return;
        }
        connection.isUpperUserLeft = false;
        videoPreview.srcObject = event.stream;
        videoPreview.play();
        videoPreview.userid = event.userid;
        if (event.type === 'local') {
            videoPreview.muted = true;
        }
        if (connection.isInitiator === false && event.type === 'remote') {
            // he is merely relaying the media
            connection.dontCaptureUserMedia = true;
            connection.attachStreams = [event.stream];
            connection.sdpConstraints.mandatory = {
                OfferToReceiveAudio: false,
                OfferToReceiveVideo: false,
            };
            connection.getSocket((socket) => {
                socket.emit('can-relay-broadcast');
                if (connection.DetectRTC.browser.name === 'Chrome') {
                    connection.getAllParticipants().forEach((p) => {
                        if (p + '' != event.userid + '') {
                            const peer = connection.peers[p].peer;
                            peer.getLocalStreams().forEach((localStream) => {
                                peer.removeStream(localStream);
                            });
                            event.stream.getTracks().forEach((track) => {
                                peer.addTrack(track, event.stream);
                            });
                            connection.dontAttachStream = true;
                            connection.renegotiate(p);
                            connection.dontAttachStream = false;
                        }
                    });
                }
                if (connection.DetectRTC.browser.name === 'Firefox') {
                    // Firefox is NOT supporting removeStream method
                    // that's why using alternative hack.
                    // NOTE: Firefox seems unable to replace-tracks of the remote-media-stream
                    // need to ask all deeper nodes to rejoin
                    connection.getAllParticipants().forEach((p) => {
                        if (p + '' != event.userid + '') {
                            connection.replaceTrack(event.stream, p);
                        }
                    });
                }
                // Firefox seems UN_ABLE to record remote MediaStream
                // WebAudio solution merely records audio
                // so recording is skipped for Firefox.
                if (connection.DetectRTC.browser.name === 'Chrome') {
                    repeatedlyRecordStream(event.stream);
                }
            });
        }
        // to keep room-id in cache
        localStorage.setItem(connection.socketMessageEvent, connection.sessionid);
    };
    // ask node.js server to look for a broadcast
    // if broadcast is available, simply join it. i.e. "join-broadcaster" event should be emitted.
    // if broadcast is absent, simply create it. i.e. "start-broadcasting" event should be fired.

    connection.onstreamended = () => {};
    connection.onleave = (event) => {
        if (event.userid !== videoPreview.userid) return;
        connection.getSocket((socket) => {
            socket.emit('can-not-relay-broadcast');
            connection.isUpperUserLeft = true;
            if (allRecordedBlobs.length) {
                // playing lats recorded blob
                const lastBlob = allRecordedBlobs[allRecordedBlobs.length - 1];
                videoPreview.src = URL.createObjectURL(lastBlob);
                videoPreview.play();
                allRecordedBlobs.length = 0;
            } else if (connection.currentRecorder) {
                const recorder = connection.currentRecorder;
                connection.currentRecorder = null;
                recorder.stopRecording(() => {
                    if (!connection.isUpperUserLeft) return;
                    videoPreview.src = URL.createObjectURL(recorder.getBlob());
                    videoPreview.play();
                });
            }
            if (connection.currentRecorder) {
                connection.currentRecorder.stopRecording();
                connection.currentRecorder = null;
            }
        });
    };


    // connection.onNumberOfBroadcastViewersUpdated = (event) => {
    //     if (!connection.isInitiator) return;
    //     console.log(event);
    //     document.getElementById('broadcast-viewers-counter')
    //         .innerText = `Viewers: ${event.numberOfBroadcastViewers}`;
    // };

    /* Handling broadcast-id */
    // let broadcastId = localStorage.getItem(connection.socketMessageEvent);
    // if (!broadcastId) broadcastId = connection.token();
    // txtBroadcastId.value = broadcastId;
    // txtBroadcastId.onkeyup = txtBroadcastId.oninput = txtBroadcastId.onpaste = () => {
    //     localStorage.setItem(connection.socketMessageEvent, this.value);
    // };
};

export default connection;
