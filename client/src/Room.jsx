import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import {
    Fab,
    Chip,
    List,
    Input,
    Avatar,
    Hidden,
    Toolbar,
    Divider,
    ListItem,
    withWidth,
    ListItemText,
    InputAdornment,
    ListItemAvatar,
} from '@material-ui/core';
import { VideocamOff, Person } from '@material-ui/icons';
import { withStyles } from '@material-ui/core/styles';

const ENTER_KEY = 13;

const styles = theme => ({
    root: {
        flexGrow: 1,
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        [theme.breakpoints.only('xs')]: {
            flexDirection: 'column',
        },
    },
    preview: {
        flexGrow: 1,
    },
    offlineButton: {
        position: 'fixed',
        left: 20,
        top: 20,
    },
    chat: {
        flexBasis: '40%',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
    },
    chatList: {
        flexGrow: 1,
        overflowY: 'auto',
        paddingTop: theme.spacing.unit * 2,
    },
    messageForm: {
        height: 50,
    },
    adornment: {
        height: '100%',
    },
    chip: {
        margin: theme.spacing.unit,
    },
});

class Room extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            text: '',
            messages: [],
            viewersCount: 0,
        };
    }

    componentDidMount() {
        // fake fetching
        const messages = [
            {
                id: 1,
                avatar: null,
                author: 'Queen',
                message: 'harum mollitia consectetur perspiciatis. Recusandae!',
            },
            {
                id: 2,
                avatar: null,
                author: 'Van',
                message: ', maxime alias temporibus aspernatur numquam',
            },
            {
                id: 3,
                avatar: null,
                author: 'Mike',
                message: 'Itaque dolor aut dolorem eligendi nobis totam earum iste',
            },
            {
                id: 4,
                avatar: null,
                author: 'Leo',
                message: 'Ipsam corrupti doloremque',
            },
            {
                id: 5,
                avatar: null,
                author: 'Kate',
                message: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit.',
            },
        ];
        this.setState({ messages });


        // /* handle broadcasting */

        // const { match: { params: { broadcastId } } } = this.props;
        // // in case of non valid broadcastId set new one
        // if (!broadcastId || broadcastId.replace(/^\s+|\s+$/g, '').length <= 0) {
        //     broadcastId = connection.token();
        // }
        // connection.extra.broadcastId = broadcastId;
        // connection.session = {
        //     audio: true,
        //     video: true,
        //     oneway: true
        // };
        // connection.getSocket((socket) => {
        //     socket.emit('check-broadcast-presence', broadcastId, (isBroadcastExists) => {
        //         if (!isBroadcastExists) {
        //             // the first person (i.e. real-broadcaster) MUST set his user-id
        //             connection.userid = broadcastId;
        //         }
        //         console.log('check-broadcast-presence', broadcastId, isBroadcastExists);
        //         socket.emit('join-broadcast', {
        //             broadcastId,
        //             userid: connection.userid,
        //             typeOfStreams: connection.session
        //         });
        //     });
        // });
    }

    onStopStreamHandler = () => { }

    onTextChangeHandler = ({ target: { name, value } }) => {
        this.setState({ [name]: value });
    }

    onMessageSubmitHandler = () => {
        this.setState(({ text, messages }) => ({
            text: '',
            messages: [
                {
                    id: messages.length + 1,
                    avatar: null,
                    author: 'Leo',
                    message: text,
                },
                ...messages,
            ],
        }));
    }

    render() {
        const { text, messages, viewersCount } = this.state;
        const { classes, width } = this.props;
        const newMessageForm = (
            <>
                <Divider />
                <Toolbar className={classes.messageForm}>
                    <Input
                        autoFocus
                        disableUnderline
                        fullWidth
                        id="new-message"
                        type="text"
                        name="text"
                        autoComplete="off"
                        value={text}
                        placeholder="New message"
                        onChange={this.onTextChangeHandler}
                        onKeyDown={
                            e => e.keyCode === ENTER_KEY
                                && this.onMessageSubmitHandler()
                        }
                        endAdornment={(
                            <InputAdornment
                                position="end"
                                className={classes.adornment}
                            >
                                <Chip
                                    avatar={(
                                        <Avatar>
                                            <Person />
                                        </Avatar>
                                    )}
                                    id="broadcast-viewers-counter"
                                    label={viewersCount}
                                    className={classes.chip}
                                />
                            </InputAdornment>
                        )}
                    />
                </Toolbar>
            </>
        );

        return (
            <div className={classes.root}>
                <video
                    id="video-preview"
                    className={classes.preview}
                    controls
                    loop
                >
                    <track default kind="captions" src="" />
                </video>
                <Fab
                    // id="open-or-join"
                    // <button >Open or Join Broadcast</button>
                    component={Link}
                    to="/"
                    className={classes.offlineButton}
                    color="secondary"
                    variant={width === 'xs' ? 'round' : 'extended'}
                    size={width === 'xs' ? 'small' : 'large'}
                    onClick={this.onStopStreamHandler}
                >
                    <VideocamOff />
                    {width !== 'xs' && <span>&nbsp;Go Offline</span>}
                </Fab>
                <div className={classes.chat}>
                    {/* <Toolbar variant="dense">
                        {<span id="status" />}
                        <input type="text" id="broadcast-id"
                        value="room-xyz" autocorrect=off autocapitalize=off size=20>
                    </Toolbar> */}
                    <List className={classes.chatList}>
                        {messages.map(({
                            id, avatar, author, message,
                        }) => (
                            <ListItem
                                key={`message-${id}`}
                                alignItems="flex-start"
                            >
                                <ListItemAvatar>
                                    {
                                        avatar
                                            ? <Avatar src={avatar} />
                                            : (
                                                <Avatar>
                                                    {author.charAt(0).toUpperCase()}
                                                </Avatar>
                                            )
                                    }
                                </ListItemAvatar>
                                <ListItemText
                                    primary={message}
                                    secondary={author}
                                />
                            </ListItem>
                        ))}
                    </List>
                    <Hidden mdDown>
                        {newMessageForm}
                    </Hidden>
                </div>
                <Hidden smUp>
                    {newMessageForm}
                </Hidden>
            </div>
        );
    }
}

Room.propTypes = {
    match: PropTypes.shape({
        broadcastId: PropTypes.string,
    }).isRequired,
    width: PropTypes.string.isRequired,
    classes: PropTypes.objectOf(PropTypes.string).isRequired,
};

export default withWidth()(withStyles(styles)(Room));
