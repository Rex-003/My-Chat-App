import { useState } from "react";
import Form from "./modules/Form/Form";
import Dashboard from "./modules/Dashboard/Dashboard";
import { Routes, Route, Navigate } from "react-router";

const ProtectedRoute = ({ children, auth = false }) => {
  const isLoggedIn = localStorage.getItem("user:token") != null || false;
  if (!isLoggedIn && auth) {
    return <Navigate to={"/users/sign_in"} />;
  } else if (
    isLoggedIn &&
    ["/users/sign_in", "/users/sign_up"].includes(window.location.pathname)
  ) {
    return <Navigate to={"/"} />;
  }
  return children;
};

function App() {
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute auth={true}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/sign_in"
          element={
            <ProtectedRoute>
              <Form isSingedUp={true} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/sign_up"
          element={
            <ProtectedRoute>
              <Form isSingedUp={false} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
