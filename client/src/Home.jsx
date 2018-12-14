import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import {
    Fab,
    AppBar,
    Toolbar,
    GridList,
    withWidth,
    Typography,
    IconButton,
    GridListTile,
    GridListTileBar,
} from '@material-ui/core';
import { Videocam } from '@material-ui/icons';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
    root: {
        flexGrow: 1,
    },
    title: {
        flexGrow: 1,
        fontFamily: 'Dosis',
    },
    alterHeader: {
        minHeight: theme.mixins.toolbar.minHeight * 2,
        [theme.breakpoints.only('xs')]: {
            ...theme.mixins.toolbar,
        },
    },
    content: {
        overflowX: 'hidden',
        padding: theme.spacing.unit * 3,
        [theme.breakpoints.only('xs')]: {
            padding: theme.spacing.unit,
        },
    },
    gridTile: {
        backgroundColor: theme.palette.grey[200],
    },
});

const gridCols = {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 6,
    xl: 8,
};

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            streams: [],
        };
    }

    componentDidMount() {
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
        const { streams } = this.state;
        const { classes, width } = this.props;
        return (
            <div className={classes.root}>
                <AppBar>
                    <Toolbar>
                        <Typography
                            variant="h5"
                            color="inherit"
                            className={classes.title}
                            children={process.env.REACT_APP_WEBSITE_NAME}
                        />
                        <Fab
                            variant={width === 'xs' ? 'round' : 'extended'}
                            size={width === 'xs' ? 'small' : 'large'}
                            color="secondary"
                            component={Link}
                            to="/stream"
                        >
                            <Videocam />
                            {width !== 'xs' && <span>&nbsp;Go live</span>}
                        </Fab>
                    </Toolbar>
                </AppBar>
                <main className={classes.content}>
                    <div className={classes.alterHeader} />
                    <GridList
                        cellHeight={200}
                        cols={gridCols[width]}
                        spacing={15}
                    >
                        {streams.map(({
                            id, thumb, author, live,
                        }) => (
                            <GridListTile
                                key={`stream-${id}`}
                                component={Link}
                                to={`/stream/${id}`}
                                classes={{ tile: classes.gridTile }}
                            >
                                <img src={thumb} alt="" />
                                <GridListTileBar
                                    title={author}
                                    subtitle={(
                                        <span>
                                            by:
                                            {author}
                                        </span>
                                    )}
                                    actionIcon={
                                        live && (
                                            <IconButton color="secondary">
                                                <Videocam />
                                            </IconButton>
                                        )
                                    }
                                />
                            </GridListTile>
                        ))}
                    </GridList>
                </main>
            </div>
        );
    }
}

Home.propTypes = {
    width: PropTypes.string.isRequired,
    classes: PropTypes.objectOf(PropTypes.string).isRequired,
};

export default withWidth()(withStyles(styles)(Home));
