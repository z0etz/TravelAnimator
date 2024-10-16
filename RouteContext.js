import React, { useState, createContext } from 'react';

export const RouteContext = createContext();

export const RouteProvider = ({ children }) => {
  const [routes, setRoutes] = useState([]);

  const addRoute = (newRoute) => {
    setRoutes([...routes, newRoute]);
  };

  return (
    <RouteContext.Provider value={{ routes, addRoute }}>
      {children}
    </RouteContext.Provider>
  );
};
