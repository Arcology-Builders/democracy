import React, { useState, useEffect } from "react";

// @ts-ignore
// import { Provider, useSelector, useDispatch } from "react-redux";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import Homepage from './views/Home';
import MakeTransaction from './views/MakeTransaction';
import Democracy from './components/context/Democracy';
import { getScreenName, setScreenName, generateScreenName } from "./util";

type AppProp = {
  demo: any
};

function App({ demo } : AppProp) {
  const [state, setState] = useState({
    chainId: demo.chainId,
    screenName: ''
  });

  useEffect(() => {
    const { chainId } = state;

    if (!chainId) {
      demo.clientInit()
        .then(() => {
          const screenName = getScreenName(demo.chainId);

          if (!screenName) {
            const newScreenName = generateScreenName();
            setScreenName(newScreenName, demo.chainId);
            setState({ chainId: demo.chainId, screenName: newScreenName });
          } 
          else {
            setState({ chainId: demo.chainId, screenName: screenName });
          }
        });
    }
  });

  return (
    <Democracy.Provider value={demo}>
      <div className="App">
          <Router>
            <Switch>
              <Route exact path="/" render={() => <MakeTransaction screenName={state.screenName} />} />
              <Route exact path="/home" component={Homepage} />
            </Switch>
          </Router> 
      </div>
    </Democracy.Provider>
  );
}

export default App;
