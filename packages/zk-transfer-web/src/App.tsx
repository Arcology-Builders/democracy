import React from "react";

// @ts-ignore
// import { Provider, useSelector, useDispatch } from "react-redux";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import Homepage from './views/Home';
import MakeTransaction from './views/MakeTransaction';

function App() {
  return (
    <>
      <div className="App">
        <Router>
          <Switch>
            <Route exact path="/" component={MakeTransaction} />
            <Route exact path="/home" component={Homepage} />
          </Switch>
        </Router> 
      </div>
    </>
  );
}

export default App;
