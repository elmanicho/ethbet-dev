import React from 'react'
import ReactDOM from 'react-dom'
import {Provider} from 'react-redux';
import configureStore from './store/configureStore';
import {Router, Route} from 'react-router-dom'
import * as serviceWorker from './serviceWorker';

import './css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.css';

import './css/custom.css';

import Home from './components/Home';
import EtherHome from './components/ether/Home';

import history from './history'

const store = configureStore();


ReactDOM.render(
  <Provider store={store}>
    <Router history={history}>
      <div>
        <Route exact path="/" component={Home}/>
        <Route exact path="/ebet" component={Home}/>

        <Route exact path="/eth" component={EtherHome}/>
      </div>
    </Router>
  </Provider>
  ,
  document.getElementById('root')
);

serviceWorker.unregister();