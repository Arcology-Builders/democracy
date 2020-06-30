import React from "react";

const ctx = React.createContext({
  stage: 1,
  isStage: (x: number): boolean => false,
  setStage: (payload: number) => {},
});

const Provider = ctx.Provider;

const reducer = (state: any, action: { type: string; payload: any }) => {
  const _state = { ...state };

  if (action.type === "SET_STAGE") {
    _state.stage = action.payload;
  }

  return _state;
};

export const StageProvider = ({ children }: any) => {
  // @ts-ignore
  const [store, dispatch] = React.useReducer(reducer, { stage: 1 });

  const isStage = React.useCallback((x: number) => store.stage === x, [store]);

  return (
    <Provider
      value={{
        isStage,
        stage: store.stage,
        setStage: (payload: number) => dispatch({ type: "SET_STAGE", payload }),
      }}
    >
      {children}
    </Provider>
  );
};

export const useStage = () => React.useContext(ctx);
