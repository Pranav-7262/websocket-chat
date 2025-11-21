import { use, useEffect, useRef, useState } from "react";
import { ConnectWS } from "./ws";
export default function App() {
  const timer = useRef(null); // useref to hold the typing timer
  const socket = useRef(null); //useref to hold the socket instance
  const [userName, setUserName] = useState("");
  const [showNamePopup, setShowNamePopup] = useState(true);
  const [inputName, setInputName] = useState("");
  const [typers, settypers] = useState([]);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    socket.current = ConnectWS; //initialize the socket connection

    socket.current.on("connect", () => {
      //listen for connect event , emit by socket.io client built-in
      socket.current.on("roomNotice", (userName) => {
        // listen for roomNotice event from server
        console.log(`${userName} has joined the chat !`);
      });
    });

    socket.current.on("chatMessage", (message) => {
      // listen for chatMessage event from server
      console.log("message from server", message);
      setMessages((m) => [...m, message]);
    });
    socket.current.on("typing", (username) => {
      // listen for typing event from server
      settypers((prevTypers) => {
        //here we check if username already exists in typers array
        const exists = prevTypers.includes(username);
        if (exists) return prevTypers;
        return [...prevTypers, username];
      });
    });
    socket.current.on("stopTyping", (username) => {
      // listen for stopTyping event from server
      settypers((prevTypers) => prevTypers.filter((name) => name !== username));
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  useEffect(() => {
    //here we emit typing event when text changes
    if (text.trim() !== "") {
      socket.current.emit("typing", userName);
      clearTimeout(timer.current); // clear previous timer
    }
    timer.current = setTimeout(() => {
      socket.current.emit("stopTyping", userName);
    }, 1000);

    return () => {
      clearTimeout(timer.current);
    }; //cleanup function to clear timer on unmount or before next effect run
  }, [text, userName]);

  // FORMAT TIMESTAMP TO HH:MM FOR MESSAGES
  function formatTime(ts) {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  // SUBMIT NAME TO GET STARTED, OPEN CHAT WINDOW WITH INITIAL MESSAGE
  function handleNameSubmit(e) {
    e.preventDefault();
    const trimmed = inputName.trim();
    if (!trimmed) return;

    // JOIN ROOM
    socket.current.emit("joinRoom", trimmed);

    // WELCOME MESSAGE
    const welcomeMsg = {
      id: Date.now(),
      sender: "System",
      text: `Welcome ${trimmed}! You have joined the group chat.`,
      ts: Date.now(),
    };
    setMessages([welcomeMsg]);

    setUserName(trimmed);
    setShowNamePopup(false);
  }

  // SEND MESSAGE FUNCTION
  function sendMessage() {
    const t = text.trim();
    if (!t) return;

    // USER MESSAGE
    const msg = {
      id: Date.now(),
      sender: userName,
      text: t,
      ts: Date.now(),
    };
    setMessages((m) => [...m, msg]);

    // EMIT MESSAGE TO SERVER
    socket.current.emit("chatMessage", msg); // emit chatMeassage event to server

    // CLEAR TEXTAREA

    setText("");
  }

  // HANDLE ENTER KEY TO SEND MESSAGE
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 p-4 font-inter">
      {/* ENTER YOUR NAME TO START CHATTING */}
      {showNamePopup && (
        <div className="fixed inset-0 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl shadow-lg max-w-md p-6">
            <h1 className="text-xl font-semibold text-black">
              Enter your name
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Enter your name to start chatting. This will be used to identify
            </p>
            <form onSubmit={handleNameSubmit} className="mt-4">
              <input
                autoFocus
                value={inputName}
                autoComplete="off"
                onChange={(e) => setInputName(e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 outline-green-500 placeholder-gray-400"
                placeholder="Your name (e.g. John Doe)"
              />
              <button
                type="submit"
                className="block ml-auto mt-3 px-4 py-1.5 rounded-full bg-green-500 text-white font-medium cursor-pointer"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CHAT WINDOW */}
      {!showNamePopup && (
        <div className="w-full max-w-2xl h-[90vh] bg-white rounded-xl shadow-md flex flex-col overflow-hidden">
          {/* CHAT HEADER */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
            <div className="h-10 w-10 rounded-full bg-[#075E54] flex items-center justify-center text-white font-semibold">
              R
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-[#303030]">
                Realtime group chat
              </div>
              {typers.length > 0 && (
                <div className="text-xs text-gray-500 italic">
                  {typers.join(", ")} {typers.length === 1 ? "is" : "are"}{" "}
                  typing...
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Signed in as{" "}
              <span className="font-medium text-[#303030] capitalize">
                {userName}
              </span>
            </div>
          </div>

          {/* CHAT MESSAGE LIST */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-100 flex flex-col">
            {messages.map((m) => {
              const mine = m.sender === userName;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] p-3 my-2 rounded-[18px] text-sm leading-5 shadow-sm ${
                      mine
                        ? "bg-[#DCF8C6] text-[#303030] rounded-br-2xl"
                        : "bg-white text-[#303030] rounded-bl-2xl"
                    }`}
                  >
                    <div className="break-words whitespace-pre-wrap">
                      {m.text}
                    </div>
                    <div className="flex justify-between items-center mt-1 gap-16">
                      <div className="text-[11px] font-bold">{m.sender}</div>
                      <div className="text-[11px] text-gray-500 text-right">
                        {formatTime(m.ts)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CHAT TEXTAREA */}
          <div className="px-4 py-3 border-t border-gray-200 bg-white">
            <div className="flex items-center justify-between gap-4 border border-gray-200 rounded-full">
              <textarea
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="w-full resize-none px-4 py-4 text-sm outline-none"
              />
              <button
                onClick={sendMessage}
                className="bg-green-500 text-white px-4 py-2 mr-2 rounded-full text-sm font-medium cursor-pointer"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
