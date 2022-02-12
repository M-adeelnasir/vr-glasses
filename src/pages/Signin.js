import React from 'react';
import './Signin.css';
import LoginImg from './assets/signin/login.jpg';
import Logo from './assets/signin/logo.svg';
import GoogleLogin from 'react-google-login';
import SecoLogo from './assets/secowhite.png';
import { Route, Navigate, useNavigate } from 'react-router-dom';



var isAuth;

const Signin = () => {
    let history = useNavigate();
    const onSuccess = response => {
        console.log(response);
        isAuth = true;
        localStorage.setItem('isAuth', isAuth);
        // history('/home')
        window.location.reload();
    }
    const onFailureSuccess = response => {
        alert('Only Secomind Users are Allowed');
    }

    return (
        <>
            <div className="container__main" style={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

                <div class="container" id="container">
                    <div class="form-container sign-up-container">

                    </div>
                    <div class="form-container sign-in-container">
                        <form action="#">
                            <h1 style={{ textAlign: 'center', marginTop: '20%' }} s>Sign in</h1>
                            <h3 style={{ textAlign: 'center', marginTop: '15%' }}> We want to verify your identity</h3>
                            <div class="social-container">

                            </div>
                            <div style={{ textAlign: 'center', marginTop: '15%' }}>
                                <GoogleLogin
                                    clientId='202168566883-i8nn170aqm9ugrepogm0ggl6ljqn2d85.apps.googleusercontent.com'
                                    render={renderProps => (
                                        <input name="login" onClick={renderProps.onClick} disabled={renderProps.disabled} id="login" className="button-29" type="button" value="Login with Google" />
                                    )}
                                    hostedDomain={'secomind.ai'}
                                    buttonText="Login"
                                    // uxMode='redirect'
                                    onSuccess={onSuccess}
                                    onFailure={onFailureSuccess}
                                    cookiePolicy={'single_host_origin'}
                                />
                            </div>
                        </form>
                    </div>
                    <div class="overlay-container">
                        <div class="overlay">
                            <div class="overlay-panel overlay-left">
                                <h1>Welcome Back!</h1>
                                <p>To keep connected with us please login with your personal info</p>
                                <button class="ghost" id="signIn">Sign In</button>
                            </div>
                            <div class="overlay-panel overlay-right">
                                <img src={SecoLogo} style={{ width: '300px' }} alt="" />

                                <p>Use your google and start journey with us</p>


                            </div>
                        </div>
                    </div>
                </div>

















            </div>
        </>
    )

}

export default Signin;

