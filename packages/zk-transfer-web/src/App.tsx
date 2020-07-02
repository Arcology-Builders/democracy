import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Homepage from "./views/Home";
import MakeTransaction from "./views/MakeTransaction";
import { StageProvider } from "./hooks/useStage";
import { useInitDemo } from './hooks/useDemo';

type AppProp = {
  demo: any;
};

function App() {
  useInitDemo();

  return (
    <StageProvider>
        <div className="App">
          <Router>
            <Switch>
              <Route
                exact
                path="/"
                render={() => (
                  <MakeTransaction />
                )}
              />
              <Route exact path="/home" component={Homepage} />
            </Switch>
          </Router>
        </div>
    </StageProvider>
  );
}

export default App;
