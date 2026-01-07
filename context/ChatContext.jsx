import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";


export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const { socket, axios } = useContext(AuthContext);

  // ✅ get all users
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ get messages
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ send message
  const sendMessages = async (messageData) => {
    try {
      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );
      if (data.success) {
        setMessages((prev) => [...prev, data.newMessage]);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ SOCKET LISTENER (FIXED)
 useEffect(() => {
  if (!socket) return;

  const handleNewMessage = (newMessage) => {
    if (selectedUser && newMessage.senderId.toString() === selectedUser._id.toString()) {
      newMessage.seen = true;
      setMessages(prev => [...prev, newMessage]);
      axios.put(`/api/messages/mark/${newMessage._id}`);
    } else {
      setUnseenMessages(prev => ({
        ...prev,
        [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1
      }));
    }
  };

  socket.on("newMessage", handleNewMessage);

  return () => socket.off("newMessage", handleNewMessage);
}, [socket, selectedUser]);


  const value = {
    messages,
    users,
    selectedUser,
    setSelectedUser,
    getUsers,
    getMessages,
    sendMessages,
    unseenMessages,
    setUnseenMessages,
    setMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
