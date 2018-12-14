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
import {
    VideocamOff,
    People,
    Favorite,
    Cancel,
} from '@material-ui/icons';
import { withStyles } from '@material-ui/core/styles';

import Connection from './connection';

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
    left: {
        flexBasis: '40%',
    },
    preview: {
        flexGrow: 1,
        flexBasis: '50%',
    },
    fixedButtons: {
        position: 'fixed',
        left: theme.spacing.unit * 3,
        top: theme.spacing.unit * 3,
        bottom: theme.spacing.unit * 3,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        [theme.breakpoints.down('md')]: {
            bottom: '9%',
            opacity: 0.5,
            '&:hover': {
                opacity: 1,
            },
        },
        [theme.breakpoints.only('xs')]: {
            bottom: '54%',
        },
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
        [theme.breakpoints.up('xs')]: {
            padding: `${theme.spacing.unit * 3}px
            ${theme.spacing.unit}px`,
        },
        [theme.breakpoints.up('sm')]: {
            padding: `${theme.spacing.unit * 5}px
            ${theme.spacing.unit * 3}px`,
        },
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
            broadcastId: null,
            isMyStream: true,
            viewersCount: 0,
            text: '',
            messages: [],
        };
    }

    componentDidMount() {
        this.chatFetchingHandler();

        console.log(Connection);

        /* handle broadcasting */
        let { match: { params: { broadcastId } } } = this.props;
        // in case of non valid broadcastId set new one
        if (!broadcastId || broadcastId.replace(/^\s+|\s+$/g, '').length <= 0) {
            broadcastId = Connection.token();
        }
        Connection.extra.broadcastId = broadcastId;
        Connection.session = {
            audio: true,
            video: true,
            oneway: true,
        };
        this.setState({ broadcastId });
        Connection.getSocket((socket) => {
            socket.emit('check-broadcast-presence', broadcastId, (isBroadcastExists) => {
                console.log('check-broadcast-presence', broadcastId, isBroadcastExists);
                if (!isBroadcastExists) {
                    // start broadcast by set broadcaster' userid
                    Connection.userid = broadcastId;
                    this.setState({ isMyStream: true });
                }
                // join broadcast
                socket.emit('join-broadcast', {
                    broadcastId,
                    userid: Connection.userid,
                    typeOfStreams: Connection.session,
                });
                this.setState({ isMyStream: false });
            });
        });


        Connection.onNumberOfBroadcastViewersUpdated = (event) => {
            // if (!Connection.isInitiator) return;
            // document.getElementById('broadcast-viewers-counter')
            //     .innerText = `Viewers: ${event.numberOfBroadcastViewers}`;
            console.log(event);
            this.setState({ viewersCount: event.numberOfBroadcastViewers });
        };
    }

    chatFetchingHandler = () => {
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
    }

    onStopHandler = () => { }

    onLikeHandler = () => { }

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
        const {
            text, messages, viewersCount, isMyStream, broadcastId,
        } = this.state;
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
                        placeholder={`Message to ${broadcastId}`}
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
                                            <People />
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
                <Hidden mdDown>
                    <div className={classes.left} />
                </Hidden>
                <video
                    id="video-preview"
                    className={classes.preview}
                    controls
                    loop
                >
                    <track default kind="captions" src="" />
                </video>
                <div className={classes.fixedButtons}>
                    <Fab
                        component={Link}
                        to="/"
                        color="secondary"
                        size={width === 'xs' ? 'medium' : 'large'}
                        variant={width === 'xs' ? 'round' : 'extended'}
                        onClick={this.onStopHandler}
                    >
                        {isMyStream ? <VideocamOff /> : <Cancel />}
                        {width !== 'xs' && (
                            <span>
                                &nbsp;
                                {isMyStream ? 'Turn off' : 'Leave'}
                            </span>
                        )}
                    </Fab>
                    <Fab
                        color="primary"
                        size={width === 'xs' ? 'small' : 'large'}
                        onClick={this.onLikeHandler}
                    >
                        <Favorite />
                    </Fab>
                </div>
                <div className={classes.chat}>
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
                    <Hidden only="xs">
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
