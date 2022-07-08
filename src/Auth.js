import React, { useState, Fragment } from 'react';
import ProtectedRoute from "./ProtectedRoute";
import App from './App';
import Signin from "./pages/Signin";
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";



const Auth = () => {
    var isAuth = localStorage.getItem("isAuth");
    if (isAuth !== null && isAuth !== undefined && isAuth !== "") {
        isAuth = true;
    }
    return (
        <>
            {isAuth === "true" ? <App /> : <Signin />}
            <App />
        </>
        // <Routes>
        //     <Route exact path="/" element={<Signin />} />
        //     <Route path="/home" element={<ProtectedRoute isAuth={isAuth} Component={App} />} />
        // </Routes>
    )

};

export default Auth;
