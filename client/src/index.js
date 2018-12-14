import React from 'react';
import { render } from 'react-dom';
import {
    BrowserRouter, Route, Switch, Redirect,
} from 'react-router-dom';
import { CssBaseline } from '@material-ui/core';

import Home from './Home';
import Room from './Room';
import ErrorBoundary from './ErrorBoundary';

import { setConnection } from './connection';
import registerServiceWorker from './registerServiceWorker';

setConnection();

const App = () => (
    <React.Fragment>
        <CssBaseline />
        <ErrorBoundary>
            <BrowserRouter>
                <Switch>
                    <Route path="/" exact component={Home} />
                    <Route path="/stream/:broadcastId?" exact component={Room} />
                    <Redirect to="/" />
                </Switch>
            </BrowserRouter>
        </ErrorBoundary>
    </React.Fragment>
);

render(<App />, document.getElementById('root'));
registerServiceWorker();
