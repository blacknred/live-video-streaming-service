import React from 'react';
import { render } from 'react-dom';
import {
    BrowserRouter, Route, Switch, Redirect,
} from 'react-router-dom';
import { CssBaseline } from '@material-ui/core';

import Home from './Home';
import Room from './Room';
import ErrorBoundary from './ErrorBoundary';

import registerServiceWorker from './registerServiceWorker';

const App = () => (
    <React.Fragment>
        <CssBaseline />
        <ErrorBoundary>
            <BrowserRouter>
                <Switch>
                    <Route path="/" exact component={Home} />
                    <Route path="/stream/:streamId?" exact component={Room} />
                    <Redirect to="/" />
                </Switch>
            </BrowserRouter>
        </ErrorBoundary>
    </React.Fragment>
);

render(<App />, document.getElementById('root'));
registerServiceWorker();
