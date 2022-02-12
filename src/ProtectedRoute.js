import React, { useEffect } from 'react'
import { Route, Navigate } from 'react-router-dom'

var auth;
const ProtectedRoute = ({ Component, isAuth }) => {
    isAuth !== null ? auth = true : auth = false;
    return isAuth ? <Component /> : <Navigate to="/" />
}

export default ProtectedRoute
