const helpers = require('./helpers');
const debug = require('debug')('signaller');
helpers();

const DEFAULT_RELAY_LIMIT = 2;

const users = {}; // array-like store

/*
    WebRTC Scalable Broadcast:
    single broadcast can be relayed over unlimited users
    without any bandwidth/CPU usage issues.
    Everything happens by peer-to-peer protocol
    to broadcast a video over 20+ users.
*/

// const b = {
//     1: {
//         userid: 1,
//         broadcastId: 'hjhjk89',
//         isBroadcastInitiator: false,
//         maxRelayLimitPerUser: 2,
//         relayReceivers: [],
//         receivingFrom: null,  // set retranslator
//         canRelay: false,
//         typeOfStreams: {
//             audio: true,
//             video: true
//         },
//         socket: socket 
//     },
//    ...
// };


module.exports = (socket, maxRelayLimitPerUser = DEFAULT_RELAY_LIMIT) => {
    try {
        maxRelayLimitPerUser = parseInt(maxRelayLimitPerUser);
    } catch (e) {
        maxRelayLimitPerUser = DEFAULT_RELAY_LIMIT;
    }

    //1 check
    socket.on('check-broadcast-presence', (userid, cb) => {
        // we can pass number of viewers as well
        try {
            cb(!!users[userid] && users[userid].isBroadcastInitiator === true);
        } catch (e) {
            debug('check-broadcast-presence', e.message);
        }
    });
    //2 join
    socket.on('join-broadcast', (user) => {
        try {
            if (!users[user.userid]) {
                socket.userid = user.userid;
                socket.isScalableBroadcastSocket = true;

                users[user.userid] = {
                    userid: user.userid,
                    broadcastId: user.broadcastId,
                    isBroadcastInitiator: false,
                    maxRelayLimitPerUser,
                    relayReceivers: [],
                    receivingFrom: null,
                    canRelay: false,
                    typeOfStreams: user.typeOfStreams || {
                        audio: true,
                        video: true
                    },
                    socket: socket
                };

                notifyBroadcasterAboutNumberOfViewers(user.broadcastId, false, user.userid);
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
            debug('join-broadcast', e.message);
        }
    });
    //3 upgrade relay capability
    socket.on('can-relay-broadcast', () => {
        if (users[socket.userid]) {
            users[socket.userid].canRelay = true;
        }
    });
    //4 upgrade relay capability if exit
    socket.on('can-not-relay-broadcast', () => {
        if (users[socket.userid]) {
            users[socket.userid].canRelay = false;
        }
    });


    socket.on('scalable-broadcast-message', (message) => {
        socket.broadcast.emit('scalable-broadcast-message', message);
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






    // this event is called from "signaling-server.js"
    socket.ondisconnect = () => {
        try {
            if (!socket.isScalableBroadcastSocket) return;

            const user = users[socket.userid];

            if (!user) return;

            // if disconnected user is a broadcaster initiator
            // need to stop entire broadcast
            if (user.isBroadcastInitiator === true) {

                for (let n in users) {
                    const _user = users[n];

                    if (_user.broadcastId === user.broadcastId) {
                        _user.socket.emit('broadcast-stopped', user.broadcastId);
                    }
                }

                delete users[socket.userid];
                return;
            }

            // if disconnected user is a receiver
            // in other case notify broadcaster initiator
            if (user.isBroadcastInitiator === false) {
                notifyBroadcasterAboutNumberOfViewers(user.broadcastId, true, socket.userid);
            }

            // if disconnected user used relaying or broadcast initiator
            // reduce count of receivers for new receivers
            if (user.receivingFrom || user.isBroadcastInitiator === true) {
                const parentUser = users[user.receivingFrom];

                if (parentUser) {
                    const reducedReceivers = parentUser.relayReceivers.filter((n) => {
                        return n.userid !== user.userid;
                    });
                    users[user.receivingFrom].relayReceivers = reducedReceivers;
                }
            }

            // if the disconnected user is a repeater
            // try reconnecting all possible recipients for the broadcast(nested)
            if (user.relayReceivers.length > 0 && user.isBroadcastInitiator === false) {
                askNestedUsersToRejoin(user.relayReceivers);
            }

            delete users[socket.userid];
        } catch (e) {
            debug('scalable-broadcast-disconnect', e.message);
        }
    };

    return {
        getUsers
    };
};


/* Helpers */

function getUsers() {
    try {
        const list = [];
        for (const uid in users) {

            const user = users[uid];
            if (!user) return;

            try {
                const relayReceivers = user.relayReceivers.map(s => s.userid);

                list.push({
                    userid: user.userid,
                    broadcastId: user.broadcastId,
                    isBroadcastInitiator: user.isBroadcastInitiator,
                    maxRelayLimitPerUser: user.maxRelayLimitPerUser,
                    receivingFrom: user.receivingFrom,
                    canRelay: user.canRelay,
                    typeOfStreams: user.typeOfStreams,
                    relayReceivers,
                });
            } catch (e) {
                debug('getUsers', e.message);
            }
        }
        return list;
    } catch (e) {
        debug('getUsers', e.message);
    }
}

function askNestedUsersToRejoin(relayReceivers) {
    try {
        // const usersToAskRejoin = [];

        relayReceivers.forEach((receiver) => {
            if (users[receiver.userid] /* !! */ ) {
                users[receiver.userid].canRelay = false;
                users[receiver.userid].receivingFrom = null;
                receiver.socket.emit('rejoin-broadcast', receiver.broadcastId);
            }
        });
    } catch (e) {
        debug('askNestedUsersToRejoin', e.message);
    }
}





function notifyBroadcasterAboutNumberOfViewers(broadcastId, userLeft, targetUser) {
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
            broadcastId,
            targetUser,
        });
    } catch (e) {
        //
    }
}

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
                !user.relayReceivers.length &&
                user.canRelay === true;
        });

        if (freeUser) return freeUser;

        // in case of there are not free users at all
        // we need to increase "maxRelayLimitPerUser"
        // so that each relaying user can distribute the bandwidth
        // and return initiator
        return broadcastInitiator;
    } catch (e) {
        debug('getFirstAvailableBroadcaster', e.message);
    }
}