const debug = require('debug')('signaller');

const config = require('./config') || {};

function sendToAdmin(all) {
    if (config.enableAdmin !== true) {
        return;
    }

    try {
        if (adminSocket) {
            const users = [];
            // temporarily disabled
            config.enableAdmin === true && Object.keys(listOfUsers).forEach((userid) => {
                try {
                    const item = listOfUsers[userid];
                    if (!item) return; // maybe user just left?

                    if (!item.connectedWith) {
                        item.connectedWith = {};
                    }

                    if (!item.socket) {
                        item.socket = {};
                    }

                    users.push({
                        userid: userid,
                        admininfo: item.socket.admininfo || '',
                        connectedWith: Object.keys(item.connectedWith)
                    });
                } catch (e) {
                    debug('admin.user-looper', e);
                }
            });

            let scalableBroadcastUsers = 0;
            if (ScalableBroadcast && ScalableBroadcast._) {
                scalableBroadcastUsers = ScalableBroadcast._.getUsers();
            }

            adminSocket.emit('admin', {
                newUpdates: !all,
                listOfRooms: all /* !! */ ? listOfRooms : [],
                listOfUsers: Object.keys(listOfUsers).length, // users
                scalableBroadcastUsers: scalableBroadcastUsers.length
            });
        }
    } catch (e) {
        debug('admin', e);
    }
}



function handleAdminSocket(socket, params) {
    if (config.enableAdmin !== true || !params.adminUserName || !params.adminPassword) {
        socket.emit('admin', {
            error: 'Please pass "adminUserName" and "adminPassword" via socket.io parameters.'
        });

        debug('invalid-admin', {
            message: CONST_STRINGS.INVALID_ADMIN_CREDENTIAL,
            stack: 'name: ' + params.adminUserName + '\n' + 'password: ' + params.adminPassword
        });

        socket.disconnect(); //disabled admin
        return;
    }

    if (!config || !isAdminAuthorized(params, config)) {
        socket.emit('admin', {
            error: 'Invalid admin username or password.'
        });

        debug('invalid-admin', {
            message: CONST_STRINGS.INVALID_ADMIN_CREDENTIAL,
            stack: 'name: ' + params.adminUserName + '\n' + 'password: ' + params.adminPassword
        });

        socket.disconnect();
        return;
    }

    socket.emit('admin', {
        connected: true
    });

    adminSocket = socket;
    socket.on('admin', (message, callback) => {
        if (!config || !isAdminAuthorized(params, config)) {
            socket.emit('admin', {
                error: 'Invalid admin username or password.'
            });

            debug('invalid-admin', {
                message: CONST_STRINGS.INVALID_ADMIN_CREDENTIAL,
                stack: 'name: ' + params.adminUserName + '\n' + 'password: ' + params.adminPassword
            });

            socket.disconnect();
            return;
        }

        callback = callback || function () {};

        if (message.all === true) {
            sendToAdmin(true);
        }

        if (message.userinfo === true && message.userid) {
            try {
                const user = listOfUsers[message.userid];
                if (user) {
                    callback(user.socket.admininfo || {});
                } else {
                    callback({
                        error: CONST_STRINGS.USERID_NOT_AVAILABLE
                    });
                }
            } catch (e) {
                debug('userinfo', e);
            }
        }

        if (message.clearLogs === true) {
            // last callback parameter will force to clear logs
            debug('', '', callback);
        }

        if (message.deleteUser === true) {
            try {
                const user = listOfUsers[message.userid];

                if (user) {
                    if (user.socket.owner) {
                        // delete listOfRooms[user.socket.owner];
                    }

                    user.socket.disconnect();
                }

                // delete listOfUsers[message.userid];
                callback(true);
            } catch (e) {
                debug('deleteUser', e);
                callback(false);
            }
        }

        if (message.deleteRoom === true) {
            try {
                const room = listOfRooms[message.roomid];

                if (room) {
                    const participants = room.participants;
                    delete listOfRooms[message.roomid];
                    participants.forEach((userid) => {
                        const user = listOfUsers[userid];
                        if (user) {
                            user.socket.disconnect();
                        }
                    });
                }
                callback(true);
            } catch (e) {
                debug('deleteRoom', e);
                callback(false);
            }
        }
    });
}

module.exports = {
    sendToAdmin
};