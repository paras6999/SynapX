import React, { useState, useContext } from "react";
import "../App.css";
import LoginVector from "../assets/LoginVector.png";
import { UserContext } from "../context/UserContext";
import { useNavigate, Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GoogleAuthButton from "../components/GoogleAuthButton";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { setUserInfo } = useContext(UserContext);
  const navigate = useNavigate();

  const completeAuth = (userInfo, message = "Welcome back to SynapX") => {
    setUserInfo(userInfo);
    toast.success(message);
    setTimeout(() => {
      navigate("/");
    }, 1200);
  };

  async function login(e) {
    e.preventDefault();

    // Client-side validation
    if (!email || !password) {
      toast.error("Please fill out all fields");
      return;
    }

    // Email format validation including the presence of "@"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/users/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Email or password does not match");
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return;
      }

      const userInfo = await response.json();
      completeAuth(userInfo);
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  }

  // Function for Guest Login
  function loginAsGuest() {
    // Set predefined guest credentials
    setEmail("guestuser10@gmail.com");
    setPassword("12345678");
  }

  return (
    <div className="login-page">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Link className="auth-brand" to="/">
        Synap<span>X</span>
      </Link>
      <div className="login-container auth-container">
        <div className="login-form-container auth-panel">
          <p className="auth-eyebrow">Secure access</p>
          <h2 className="login-title">Welcome back</h2>
          <p className="auth-copy">
            Continue to your prediction dashboard and saved report workflows.
          </p>
          <GoogleAuthButton
            onAuthenticated={(userInfo) =>
              completeAuth(userInfo, "Signed in with Google")
            }
          />
          <div className="auth-divider">
            <span>or use email</span>
          </div>
          <form className="login-form" onSubmit={login}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="login-button">
              Log In
            </button>
          </form>
          {/* Added Guest Login Button [NEW] */}
          <button onClick={loginAsGuest} className="guest-login-button">
            Log in as Guest
          </button>
          <div className="login-footer">
            <p>
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
          </div>
        </div>
        <div className="login-image auth-visual">
          <div className="auth-visual-copy">
            <h3>Predict faster with SynapX</h3>
            <p>One account for screening tools, uploads, and PDF reports.</p>
          </div>
          <img src={LoginVector} alt="Login Vector" />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
