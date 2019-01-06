import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import {
    Fab,
    Chip,
    List,
    Input,
    Avatar,
    Toolbar,
    ListItem,
    withWidth,
    Typography,
    ListItemText,
    InputAdornment,
    ListItemAvatar,
} from '@material-ui/core';
import {
    People,
    Cancel,
    Favorite,
    VideocamOff,
} from '@material-ui/icons';
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
    options: {
        flexBasis: '30%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        [theme.breakpoints.down('md')]: {
            zIndex: theme.zIndex.drawer,
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: '7%',
        },
    },
    title: {
        fontFamily: 'Dosis',
        [theme.breakpoints.down('md')]: {
            color: theme.palette.grey[400],
        },
    },
    preview: {
        flexGrow: 1,
        backgroundColor: theme.palette.common.black,
    },
    chat: {
        flexBasis: '30%',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        padding: `${theme.spacing.unit}px ${theme.spacing.unit * 3}px`,
        [theme.breakpoints.up('sm')]: {
            alignItems: 'flex-end',
        },
        [theme.breakpoints.only('xs')]: {
            zIndex: theme.zIndex.drawer,
            position: 'fixed',
            left: 0,
        },
    },
    chatList: {
        flexGrow: 1,
        overflowY: 'auto',
        display: 'flex',
        overflowX: 'hidden',
        flexDirection: 'column',
        [theme.breakpoints.up('sm')]: {
            alignItems: 'flex-end',
        },
        [theme.breakpoints.up('lg')]: {
            width: '80%',
        },
        '&>li': {
            width: 'auto',
            maxWidth: '100%',
            marginBottom: theme.spacing.unit,
            backgroundColor: theme.palette.background.paper,
        },
    },
    messageForm: {
        height: 50,
        borderRadius: 50,
        minWidth: '80%',
        backgroundColor: theme.palette.background.paper,
    },
    adornment: {
        height: '100%',
    },
    chip: {
        // margin: theme.spacing.unit,
    },
});

const ChatMessage = ({
    avatar, author, message, event,
}) => (
    <ListItem
        alignItems="flex-start"
        dense
        disabled={event}
    >
        {!event && (
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
        )}
        <ListItemText
            primary={author + message}
            //secondary={}
        />
    </ListItem>
);

const Broadcast = ({
    classes, width, text, messages, viewersCount, isMyStream, videoTarget,
    onTextChange, onMessageSubmit, onLike, onStop,
}) => {
    const viewersCountWidget = (
        <Chip
            avatar={(
                <Avatar>
                    <People />
                </Avatar>
            )}
            label={viewersCount}
            className={classes.chip}
        />
    );

    const newMessageForm = (
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
                placeholder="new message"
                onChange={onTextChange}
                onKeyDown={
                    e => e.keyCode === ENTER_KEY
                        && onMessageSubmit()
                }
                startAdornment={(
                    <InputAdornment
                        position="start"
                        className={classes.adornment}
                    >
                        <Avatar>A</Avatar>
                    </InputAdornment>
                )}
                endAdornment={(
                    <InputAdornment
                        position="end"
                        className={classes.adornment}
                    >
                        {!isMyStream && viewersCountWidget}
                    </InputAdornment>
                )}
            />
        </Toolbar>
    );

    const video = (
        <video
            controls
            loop
            ref={videoTarget}
            className={classes.preview}
        >
            <track default kind="captions" src="" />
        </video>
    );

    const chatList = (
        <List className={classes.chatList}>
            {messages.map(message => (
                <ChatMessage
                    {...message}
                    key={`message-${message.id}`}
                />
            ))}
        </List>
    );

    return (
        <div className={classes.root}>
            <div className={classes.options}>
                <Toolbar>
                    <Typography
                        variant="h4"
                        color="textSecondary"
                        className={classes.title}
                        children={process.env.REACT_APP_WEBSITE_NAME.split('-')[0]}
                    />
                </Toolbar>
                {!isMyStream && (
                    <Fab
                        color="primary"
                        size={width === 'xs' ? 'small' : 'large'}
                        onClick={onLike}
                    >
                        <Favorite />
                    </Fab>
                )}
                <Toolbar>
                    <Fab
                        component={Link}
                        to="/"
                        color="secondary"
                        size={width === 'xs' ? 'medium' : 'large'}
                        variant={width === 'xs' ? 'round' : 'extended'}
                        onClick={onStop}
                    >
                        {isMyStream ? <VideocamOff /> : <Cancel />}
                        {width !== 'xs' && (
                            <span>
                                &nbsp;
                                    {isMyStream ? 'Turn off' : 'Leave'}
                            </span>
                        )}
                    </Fab>
                </Toolbar>
            </div>
            {video}
            <div className={classes.chat}>
                {chatList}
                {isMyStream && viewersCountWidget}
                {!isMyStream && newMessageForm}
            </div>
        </div>
    );
};

ChatMessage.propTypes = {
    avatar: PropTypes.string,
    author: PropTypes.string,
    message: PropTypes.string.isRequired,
    event: PropTypes.bool.isRequired,
};

Broadcast.propTypes = {
    width: PropTypes.string.isRequired,
    classes: PropTypes.objectOf(PropTypes.string).isRequired,
    text: PropTypes.string.isRequired,
    messages: PropTypes.arrayOf(PropTypes.shape()).isRequired,
    viewersCount: PropTypes.number.isRequired,
    isMyStream: PropTypes.bool.isRequired,
    videoTarget: PropTypes.shape().isRequired,
    onTextChange: PropTypes.func.isRequired,
    onMessageSubmit: PropTypes.func.isRequired,
    onLike: PropTypes.func.isRequired,
    onStop: PropTypes.func.isRequired,
};

export default withWidth()(withStyles(styles)(Broadcast));
