import React from 'react';
import PropTypes from 'prop-types';

import BroadcastComponent from '../components/Broadcast';

import {
    getOrSetBroadcast,
    viewersUpdated,
    handleStream,
} from '../signalingClient';

class Broadcast extends React.Component {
    constructor(props) {
        super(props);
        this.videoRef = React.createRef();
        this.state = {
            broken: false,
            isMyStream: true,
            viewersCount: 0,
            text: '',
            messages: [],
        };
    }

    componentDidMount() {
        const { match: { params: { broadcastId } } } = this.props;

        /* handle broadcasting */
        getOrSetBroadcast(broadcastId, (isBroadcastExists) => {
            this.setState({ isMyStream: !isBroadcastExists });
        });

        viewersUpdated((event) => {
            this.setState(({ viewersCount, messages }) => ({
                viewersCount: event.numberOfBroadcastViewers,
                ...((event.numberOfBroadcastViewers > viewersCount) && {
                    messages: [
                        {
                            id: messages.length + 1,
                            avatar: null,
                            author: null,
                            message: 'New viewer came',
                            event: true,
                        },
                        ...messages,
                    ],
                }),
            }));
        });

        handleStream(this.videoRef.current);

        /* handle chat */
        this.chatFetchingHandler();
    }

    chatFetchingHandler = () => {
        // fake fetching
        const messages = [
            {
                id: 1,
                avatar: null,
                author: 'Queen',
                message: 'harum mollitia consectetur perspiciatis. Recusandae!',
                event: true,
            },
            {
                id: 2,
                avatar: null,
                author: 'Van',
                message: ', maxime alias temporibus aspernatur numquam',
                event: false,
            },
            {
                id: 3,
                avatar: null,
                author: 'Mike',
                message: 'Itaque dolor aut dolorem eligendi nobis totam earum iste',
                event: true,
            },
            {
                id: 4,
                avatar: null,
                author: 'Leo',
                message: 'Ipsam corrupti doloremque',
                event: false,
            },
            {
                id: 5,
                avatar: null,
                author: 'Kate',
                message: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit.',
                event: false,
            },
        ];
        this.setState({ messages });
    }

    onStopHandler = () => { }

    onLikeHandler = () => { this.setState({ broken: true }); }

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
                    event: false,
                },
                ...messages,
            ],
        }));
    }

    render() {
        const { broken } = this.state;
        if (broken) throw new Error('Broadcast not found!');
        return (
            <BroadcastComponent
                {...this.state}
                videoTarget={this.videoRef}
                onTextChange={this.onTextChangeHandler}
                onMessageSubmit={this.onMessageSubmitHandler}
                onLike={this.onLikeHandler}
                onStop={this.onStopHandler}
            />
        );
    }
}

Broadcast.propTypes = {
    match: PropTypes.shape({
        broadcastId: PropTypes.string,
    }).isRequired,
};

export default Broadcast;
