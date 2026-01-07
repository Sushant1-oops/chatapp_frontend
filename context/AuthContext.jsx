import React, { createContext, useState, useEffect } from "react";

import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";;
axios.defaults.baseURL = backendUrl;
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [authUser, setAuthUser] = useState(null);
  const [onlineUser, setOnlineUser] = useState([]);
  const [socket, setSocket] = useState(null);

  // check id user is authenticated or not if so, set the user data and connect socket
  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data?.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  //login function to handle userauthentication and socket connection

 const login = async (state, Credentials) => {
   try {
     const { data } = await axios.post(`/api/auth/${state}`, Credentials);

     if (data?.success) {
       setAuthUser(data.user);
       setToken(data.token);
       localStorage.setItem("token", data.token);

       axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

       connectSocket(data.user);
       toast.success(data.message);
       return true;
     }
   } catch (error) {
     toast.error(error.message);
     return false;
   }
 };


  //logout function and disconncet socket
const logout = async () => {
  socket?.disconnect();
  setSocket(null);
  setAuthUser(null);
  setToken(null);
  setOnlineUser([]);
  delete axios.defaults.headers.common["Authorization"];
  localStorage.removeItem("token");
  toast.success("logged out successfully");
};


  //update profile

const updateProfile = async (body) => {
  try {
    const { data } = await axios.put("/api/auth/update-profile", body);

    if (data.success) {
      setAuthUser((prev) => ({
        ...prev,
        ...data.user,
      }));
      toast.success("Profile updated successfully");
    }
  } catch (error) {
    toast.error(error.message);
  }
};
const connectSocket = (userData) => {
  if (!userData) return;

  if (socket) socket.disconnect();

  const newSocket = io(backendUrl, {
    auth: { userId: userData._id }, // ✅ must match backend
  });

  newSocket.on("connect", () => {
    console.log("Socket connected:", newSocket.id);
  });

  newSocket.on("getOnlineUsers", (userIds) => {
    setOnlineUser(userIds.map((id) => id.toString()));
  });

  setSocket(newSocket);
};


useEffect(() => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    checkAuth(); // ✅ ONLY WHEN TOKEN EXISTS
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
}, [token]);



  const value = {
    axios,
    authUser,
    onlineUsers:onlineUser,
    socket,
    login,
    logout,
    updateProfile,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
