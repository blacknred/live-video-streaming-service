const DEFAULT_RELAY_LIMIT = 2;
const users = {};

/*
    WebRTC Scalable Broadcast:
    single broadcast can be relayed over unlimited users
    without any bandwidth/CPU usage issues.
    Everything happens by peer-to-peer protocol
    to broadcast a video over 20+ users.
*/


module.exports = (socket, maxRelayLimitPerUser) => {
    try {
        maxRelayLimitPerUser = parseInt(maxRelayLimitPerUser);
    } catch (e) {
        maxRelayLimitPerUser = DEFAULT_RELAY_LIMIT;
    }

    socket.on('join-broadcast', (user) => {
        try {
            if (!users[user.userid]) {
                socket.userid = user.userid;
                socket.isScalableBroadcastSocket = true;

                users[user.userid] = {
                    userid: user.userid,
                    broadcastId: user.broadcastId,
                    isBroadcastInitiator: false,
                    maxRelayLimitPerUser: maxRelayLimitPerUser,
                    relayReceivers: [],
                    receivingFrom: null,
                    canRelay: false,
                    typeOfStreams: user.typeOfStreams || {
                        audio: true,
                        video: true
                    },
                    socket: socket
                };

                notifyBroadcasterAboutNumberOfViewers(user.broadcastId);
            }

            const relayUser = getFirstAvailableBroadcaster(user.broadcastId, maxRelayLimitPerUser);

            if (relayUser === 'ask-him-rejoin') {
                socket.emit('rejoin-broadcast', user.broadcastId);
                return;
            }

            // join new viewer to free peer
            if (relayUser && user.userid !== user.broadcastId) {
                const hintsToJoinBroadcast = {
                    typeOfStreams: relayUser.typeOfStreams,
                    userid: relayUser.userid,
                    broadcastId: relayUser.broadcastId
                };

                users[user.userid].receivingFrom = relayUser.userid;
                users[relayUser.userid].relayReceivers.push(
                    users[user.userid]
                );
                users[user.broadcastId].lastRelayuserid = relayUser.userid;

                socket.emit('join-broadcaster', hintsToJoinBroadcast);

                // logs for current socket
                socket.emit('logs', 'You (' + user.userid + ') are getting data/stream from (' + relayUser.userid + ')');

                // logs for target relaying user
                relayUser.socket.emit('logs', 'You (' + relayUser.userid + ')' + ' are now relaying/forwarding data/stream to (' + user.userid + ')');
            } else {
                users[user.userid].isBroadcastInitiator = true;
                socket.emit('start-broadcasting', users[user.userid].typeOfStreams);

                // logs to tell he is now broadcast initiator
                socket.emit('logs', 'You (' + user.userid + ') are online.');
            }
        } catch (e) {
            console.log('join-broadcast', e.message);
        }
    });

    socket.on('scalable-broadcast-message', (message) => {
        socket.broadcast.emit('scalable-broadcast-message', message);
    });

    socket.on('can-relay-broadcast', () => {
        if (users[socket.userid]) {
            users[socket.userid].canRelay = true;
        }
    });

    socket.on('can-not-relay-broadcast', () => {
        if (users[socket.userid]) {
            users[socket.userid].canRelay = false;
        }
    });

    socket.on('check-broadcast-presence', (userid, callback) => {
        // we can pass number of viewers as well
        try {
            callback(!!users[userid] && users[userid].isBroadcastInitiator === true);
        } catch (e) {
            console.log('check-broadcast-presence', e.message);
        }
    });

    socket.on('get-number-of-users-in-specific-broadcast', (broadcastId, callback) => {
        try {
            if (!broadcastId || !callback) return;

            if (!users[broadcastId]) {
                callback(0);
                return;
            }

            callback(getNumberOfBroadcastViewers(broadcastId));
        } catch (e) {
            //
        }
    });

    function getNumberOfBroadcastViewers(broadcastId) {
        try {
            let numberOfUsers = 0;
            Object.keys(users).forEach((uid) => {
                const user = users[uid];
                if (user.broadcastId === broadcastId) {
                    numberOfUsers++;
                }
            });
            return numberOfUsers - 1;
        } catch (e) {
            return 0;
        }
    }

    function notifyBroadcasterAboutNumberOfViewers(broadcastId, userLeft) {
        try {
            if (!broadcastId || !users[broadcastId] || !users[broadcastId].socket) {
                //return;
            }
            let numberOfBroadcastViewers = getNumberOfBroadcastViewers(broadcastId);

            if (userLeft === true) {
                numberOfBroadcastViewers--;
            }

            users[broadcastId].socket.emit('number-of-broadcast-viewers-updated', {
                numberOfBroadcastViewers,
                broadcastId
            });
        } catch (e) {
            //
        }
    }


    // this event is called from "signaling-server.js"
    socket.ondisconnect = () => {
        try {
            if (!socket.isScalableBroadcastSocket) return;

            const user = users[socket.userid];

            if (!user) return;

            if (user.isBroadcastInitiator === false) {
                notifyBroadcasterAboutNumberOfViewers(user.broadcastId, true);
            }

            if (user.isBroadcastInitiator === true) {
                // need to stop entire broadcast?
                for (let n in users) {
                    const _user = users[n];

                    if (_user.broadcastId === user.broadcastId) {
                        _user.socket.emit('broadcast-stopped', user.broadcastId);
                    }
                }

                delete users[socket.userid];
                return;
            }

            if (user.receivingFrom || user.isBroadcastInitiator === true) {
                const parentUser = users[user.receivingFrom];

                if (parentUser) {
                    const newArray = [];
                    parentUser.relayReceivers.forEach((n) => {
                        if (n.userid !== user.userid) {
                            newArray.push(n);
                        }
                    });
                    users[user.receivingFrom].relayReceivers = newArray;
                }
            }

            if (user.relayReceivers.length && user.isBroadcastInitiator === false) {
                askNestedUsersToRejoin(user.relayReceivers);
            }

            delete users[socket.userid];
        } catch (e) {
            console.log('scalable-broadcast-disconnect', e.message);
        }
    };

    return {
        getUsers: () => {
            try {
                const list = [];
                Object.keys(users).forEach((uid) => {
                    const user = users[uid];
                    if (!user) return;

                    try {
                        const relayReceivers = [];
                        user.relayReceivers.forEach((s) => {
                            relayReceivers.push(s.userid);
                        });

                        list.push({
                            userid: user.userid,
                            broadcastId: user.broadcastId,
                            isBroadcastInitiator: user.isBroadcastInitiator,
                            maxRelayLimitPerUser: user.maxRelayLimitPerUser,
                            relayReceivers: relayReceivers,
                            receivingFrom: user.receivingFrom,
                            canRelay: user.canRelay,
                            typeOfStreams: user.typeOfStreams
                        });
                    } catch (e) {
                        console.log('getUsers', e.message);
                    }
                });
                return list;
            } catch (e) {
                console.log('getUsers', e.message);
            }
        }
    };
};

function askNestedUsersToRejoin(relayReceivers) {
    try {
        // const usersToAskRejoin = [];

        relayReceivers.forEach((receiver) => {
            if (users[receiver.userid] /* !! */) {
                users[receiver.userid].canRelay = false;
                users[receiver.userid].receivingFrom = null;
                receiver.socket.emit('rejoin-broadcast', receiver.broadcastId);
            }
        });
    } catch (e) {
        console.log('askNestedUsersToRejoin', e.message);
    }
}

function getFirstAvailableBroadcaster(broadcastId, maxRelayLimitPerUser) {
    try {
        const broadcastInitiator = users[broadcastId];
        
        /* Priority: initiator, lastRelayUser, any free user */

        // if initiator is capable to receive users
        if (broadcastInitiator && broadcastInitiator.relayReceivers.length < maxRelayLimitPerUser) {
            return broadcastInitiator;
        }

        // if current relaying user known by initiator is capable to receive users
        if (broadcastInitiator && broadcastInitiator.lastRelayuserid) {
            const lastRelayUser = users[broadcastInitiator.lastRelayuserid];
            if (lastRelayUser && lastRelayUser.relayReceivers.length < maxRelayLimitPerUser) {
                return lastRelayUser;
            }
        }

        // otherwise, search for a user who not relayed anything yet
        const freeUser = users.find((user) => {
            return user.broadcastId === broadcastId &&
                !user.relayReceivers.length && user.canRelay === true;
        });

        if (freeUser) {
            return freeUser;
        }

        // in case of there are not free users at all
        // we need to increase "maxRelayLimitPerUser"
        // so that each relaying user can distribute the bandwidth

        return broadcastInitiator;
    } catch (e) {
        console.log('getFirstAvailableBroadcaster', e.message);
    }
}