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
    ListSubheader,
    GridListTileBar,
} from '@material-ui/core';
import { Videocam } from '@material-ui/icons';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
    root: {
        flexGrow: 1,
    },
    appBar: {
        backgroundColor: theme.palette.background.default,
    },
    title: {
        flexGrow: 1,
        fontFamily: 'Dosis',
    },
    alterHeader: {
        minHeight: theme.mixins.toolbar.minHeight * 2,
    },
    content: {
        margin: '0 auto',
        width: '70%',
        [theme.breakpoints.down('md')]: {
            width: '90%',
        },
        [theme.breakpoints.only('xs')]: {
            width: '100%',
        },
    },
    gridTile: {
        backgroundColor: theme.palette.background.paper,
    },
    subheader: {
        height: 'auto!important',
    },
});

const gridCols = {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
};

const Home = ({ streams, classes, width }) => (
    <div className={classes.root}>
        <AppBar
            elevation={0}
            color="inherit"
            classes={{ root: classes.appBar }}
        >
            <Toolbar>
                <Typography
                    variant="h4"
                    color="textSecondary"
                    className={classes.title}
                    children={process.env.REACT_APP_WEBSITE_NAME.split('-')[0]}
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
                cellHeight={300}
                cols={gridCols[width]}
                spacing={16}
            >
                <GridListTile
                    key="Subheader"
                    cols={gridCols[width]}
                    className={classes.subheader}
                >
                    <ListSubheader component="div">Live streams</ListSubheader>
                </GridListTile>
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
                            // subtitle={(
                            //     <span>
                            //         by:
                            //         {author}
                            //     </span>
                            // )}
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

Home.propTypes = {
    streams: PropTypes.arrayOf(PropTypes.shape()).isRequired,
    width: PropTypes.string.isRequired,
    classes: PropTypes.objectOf(PropTypes.string).isRequired,
};

export default withWidth()(withStyles(styles)(Home));
