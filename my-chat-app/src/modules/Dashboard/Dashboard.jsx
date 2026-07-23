import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { io } from "socket.io-client";
const Dashboard = () => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user:details")),
  );
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    setSocket(io("https://my-chat-app-tam8.onrender.com"));
  }, []);

  useEffect(() => {
    socket?.emit("addUser", user?._id);
    socket?.on("getUsers", (users) => {
      console.log("activeUsers :>>", users);
    });
    socket?.on("getMessage", (data) => {
      setMessages((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { user: data.user, message: data.message },
        ],
      }));
    });
  }, [socket]);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user:details"));

    const fetchConversations = async () => {
      const res = await fetch(
        `https://my-chat-app-tam8.onrender.com/api/conversation/${loggedInUser?._id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const resData = await res.json();
      setConversations(resData);
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch(
        `https://my-chat-app-tam8.onrender.com/api/users/${user?._id}`,
        {
          method: "GET",

          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const resData = await res.json();
      setUsers(resData);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("user:token");

    if (!token) {
      navigate("/users/sign_in", { replace: true });
    }
  }, [navigate]);

  const fetchMessages = async (conversationId, receiver) => {
    const res = await fetch(
      `https://my-chat-app-tam8.onrender.com/api/message/${conversationId}?senderId=${user?._id}&receiverId=${receiver?.receiverId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    const resData = await res.json();
    setMessages({ messages: resData, receiver, conversationId });
  };

  const sendMessage = async (e) => {
    socket?.emit("sendMessage", {
      conversationId: messages?.conversationId,
      senderId: user?._id,
      message,
      receiverId: messages?.receiver?.receiverId,
    });
    const res = await fetch(
      `https://my-chat-app-tam8.onrender.com/api/message`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: messages?.conversationId,
          senderId: user?._id,
          message,
          receiverId: messages?.receiver?.receiverId,
        }),
      },
    );
    setMessage("");
  };

  const handleLogout = () => {
    localStorage.removeItem("user:token");
    localStorage.removeItem("user:details");

    navigate("/users/sign_in");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="w-screen flex">
      <div className="w-[25%] h-screen bg-[#f3f5ff]">
        <div className="flex justify-center items-center my-8">
          <div className="border border-blue-400 p-[1px] rounded-full">
            <img
              src="https://www.flaticon.com/free-icon/avatar_147140"
              width={60}
              height={60}
            />
          </div>
          <div className="ml-8">
            <h3 className="text-2xl">{user.fullName}</h3>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Sign Out
            </button>
            <p className="text-lg font-light">My Account</p>
          </div>
        </div>
        <hr />
        <div>
          <div className="ml-4 mt-10 text-blue-500 text-lg">Messages</div>
          <div className="mx-4">
            {conversations.length > 0 ? (
              conversations.map(({ conversationId, user }) => {
                return (
                  <div className="flex items-center py-2 border-b border-b-gray-300 ">
                    <div
                      className="cursor-pointer flex items-center "
                      onClick={() => fetchMessages(conversationId, user)}
                    >
                      <div className="border border-blue-400 p-[2px] rounded-full">
                        <img
                          src="https://www.google.com/imgres?q=user%20icon&imgurl=https%3A%2F%2Fwww.iconpacks.net%2Ficons%2F2%2Ffree-user-icon-3296-thumb.png&imgrefurl=https%3A%2F%2Fwww.iconpacks.net%2Ffree-icon%2Fuser-3296.html&docid=A13m_lfE03JgFM&tbnid=kSUzsyhpc_f4CM&vet=12ahUKEwj9kNr4k9eTAxXpzzgGHUQlAmEQnPAOegQIHxAB..i&w=512&h=512&hcb=2&ved=2ahUKEwj9kNr4k9eTAxXpzzgGHUQlAmEQnPAOegQIHxAB"
                          width={50}
                          height={50}
                        />
                      </div>
                      <div className="ml-8">
                        <h3 className="text-lg">{user?.fullName}</h3>
                        <p className="text-sm font-light text-gray-600">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-lg font-semibold mt-24">
                {" "}
                No Conversations
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="w-[50%] h-screen bg-white flex flex-col items-center">
        {messages?.receiver?.fullName && (
          <div className="w-[75%] bg-[#f3f5ff] h-[80px] my-14 rounded-full flex items-center px-14">
            <div className="border border-blue-400 p-[1px] rounded-full cursor-pointer">
              <img
                src="https://www.flaticon.com/free-icon/avatar_147140"
                width={60}
                height={60}
              />
            </div>
            <div className="ml-6 mr-auto">
              <h3 className="text-lg">{messages?.receiver?.fullName}</h3>
              <p className="text-sm font-light text-gray-600">
                {messages?.receiver?.email}
              </p>
            </div>
            <div className="cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="icon icon-tabler icons-tabler-outline icon-tabler-phone-outgoing"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2c-8.072 -.49 -14.51 -6.928 -15 -15a2 2 0 0 1 2 -2" />
                <path d="M15 5h6" />
                <path d="M18.5 7.5l2.5 -2.5l-2.5 -2.5" />
              </svg>
            </div>
          </div>
        )}
        <div className="h-[75%] w-full overflow-scroll shadow-sm">
          <div className="px-10 py-14 ">
            {messages?.messages?.length > 0 ? (
              messages.messages.map(({ message, user: { id } = {} }) => {
                return (
                  <div
                    className={`max-w-[40%] rounded-b-xl p-4 mb-6 ${id === user?._id ? "bg-blue-500 text-white rounded-tl-xl ml-auto" : "bg-[#f3f5ff] rounded-tr-xl"}`}
                  >
                    {message}
                  </div>
                );
              })
            ) : (
              <div className="text-center text-lg font-semibold mt-24">
                No Messages or No Conversation Selected
              </div>
            )}
          </div>
        </div>
        {messages?.receiver?.fullName && (
          <div className="p-14 w-full flex items-center">
            <input
              placeholder="Type a message...."
              className="p-4 w-[75%] border-0 rounded-full bg-[#f3f5ff] focus:ring-0 focus:border-0 outline-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div
              className={`ml-4 p-2 cursor-pointer bg-[#f3f5ff] rounded-full ${!message && "pointer-events-none"}`}
              onClick={() => sendMessage()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="icon icon-tabler icons-tabler-outline icon-tabler-send"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M10 14l11 -11" />
                <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
              </svg>
            </div>
            <div className="ml-4 p-2 cursor-pointer bg-[#f3f5ff] rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="icon icon-tabler icons-tabler-outline icon-tabler-plus"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 5l0 14" />
                <path d="M5 12l14 0" />
              </svg>
            </div>
          </div>
        )}
      </div>
      <div className="w-[25%] h-screen bg-[#f3f5ff]">
        <div className="ml-4 mt-10 text-blue-500 text-lg">Contacts</div>
        <div className="mx-4">
          {users.length > 0 ? (
            users.map(({ userId, user }) => {
              return (
                <div className="flex items-center py-2 border-b border-b-gray-300 ">
                  <div
                    className="cursor-pointer flex items-center "
                    onClick={() => fetchMessages("new", user)}
                  >
                    <div className="border border-blue-400 p-[2px] rounded-full">
                      <img
                        src="https://www.google.com/imgres?q=user%20icon&imgurl=https%3A%2F%2Fwww.iconpacks.net%2Ficons%2F2%2Ffree-user-icon-3296-thumb.png&imgrefurl=https%3A%2F%2Fwww.iconpacks.net%2Ffree-icon%2Fuser-3296.html&docid=A13m_lfE03JgFM&tbnid=kSUzsyhpc_f4CM&vet=12ahUKEwj9kNr4k9eTAxXpzzgGHUQlAmEQnPAOegQIHxAB..i&w=512&h=512&hcb=2&ved=2ahUKEwj9kNr4k9eTAxXpzzgGHUQlAmEQnPAOegQIHxAB"
                        width={50}
                        height={50}
                      />
                    </div>
                    <div className="ml-8">
                      <h3 className="text-lg">{user?.fullName}</h3>
                      <p className="text-sm font-light text-gray-600">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-lg font-semibold mt-24">
              {" "}
              No Conversations
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
