import React from 'react';

import HomeComponent from '../components/Home';

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            streams: [],
        };
    }

    componentDidMount() {
        this.streamsFetchHandler();
    }

    streamsFetchHandler = () => {
        // fake fetching
        const streams = [
            {
                id: 1,
                thumb: null,
                author: 'Queen',
                live: true,
            },
            {
                id: 2,
                thumb: null,
                author: 'Van',
                live: true,
            },
            {
                id: 3,
                thumb: null,
                author: 'Mike',
                live: true,
            },
            {
                id: 4,
                thumb: null,
                author: 'Leo',
                live: true,
            },
            {
                id: 5,
                thumb: null,
                author: 'Kate',
                live: false,
            },
        ];
        this.setState({ streams });
    }

    render() {
        return <HomeComponent {...this.state} />;
    }
}

export default Home;
