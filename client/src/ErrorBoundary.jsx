import React from 'react';
import PropTypes from 'prop-types';

import {
    Button,
    Typography,
} from '@material-ui/core';
import { Report } from '@material-ui/icons';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
    root: {
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: 500,
        // minHeight: 500,
        margin: `${theme.mixins.toolbar.minHeight}px auto`,
    },
    icon: {
        height: theme.spacing.unit * 15,
        width: theme.spacing.unit * 15,
    },
});

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        this.setState({
            error,
            errorInfo,
        });
    }

    render() {
        const { error, errorInfo } = this.state;
        const { children, classes } = this.props;
        const message = error && error.toString();
        if (errorInfo) {
            // You can render any custom fallback UI
            return (
                <div className={classes.root}>
                    <Report
                        className={classes.icon}
                        color="disabled"
                    />
                    <br />
                    <br />
                    <Typography
                        variant="h4"
                        color="inherit"
                        paragraph
                    >
                        {message && message.substr(message.indexOf(' ') + 1)}
                    </Typography>
                    <Typography
                        variant="body2"
                        color="textSecondary"
                        paragraph
                    >
                        {errorInfo.componentStack}
                    </Typography>
                    <br />
                    <br />
                    <Button
                        variant="outlined"
                        children="Go to home"
                        href="/"
                        size="large"
                    />
                </div>
            );
        }
        return children;
    }
}

ErrorBoundary.propTypes = {
    classes: PropTypes.objectOf(PropTypes.string).isRequired,
    children: PropTypes.node.isRequired,
};

export default withStyles(styles)(ErrorBoundary);
