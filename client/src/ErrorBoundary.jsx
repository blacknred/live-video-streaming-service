import React from 'react';
import PropTypes from 'prop-types';

import {
    Typography,
} from '@material-ui/core';
import { Report } from '@material-ui/icons';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
    root: {
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.unit,
    },
    icon: {
        height: '3em',
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
        if (error) {
            // You can render any custom fallback UI
            return (
                <div className={classes.root}>
                    <Report className={classes.icon} />
                    <Typography
                        variant="h6"
                        color="inherit"
                    >
                        {error}
                    </Typography>
                    <Typography
                        variant="body2"
                        color="textSecondary"
                    >
                        {errorInfo.componentStack}
                    </Typography>
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
