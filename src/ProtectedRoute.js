import React from 'react'
import { Route, Navigate } from 'react-router-dom'

const ProtectedRoute = ({ Component, isAuth }) => {
    const auth = isAuth;
    return auth ? <Component /> : <Navigate to="/login" />
}

export default ProtectedRoute
