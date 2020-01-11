import React from "react";

// @ts-ignore
// import { Provider, useSelector, useDispatch } from "react-redux";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import Homepage from './views/Home';
import MakeTransaction from './views/MakeTransaction';
import Democracy from './components/context/Democracy';

type AppProp = {
  demo: any
};

function App({ demo } : AppProp) {
  // await api.init(demo);
  return (
    <Democracy.Provider value={demo}>
      <div className="App">
          <Router>
            <Switch>
              <Route exact path="/" component={MakeTransaction} />
              <Route exact path="/home" component={Homepage} />
            </Switch>
          </Router> 
      </div>
    </Democracy.Provider>
  );
}

export default App;
