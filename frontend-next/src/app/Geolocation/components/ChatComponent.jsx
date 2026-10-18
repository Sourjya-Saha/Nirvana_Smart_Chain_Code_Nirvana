"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { io } from "socket.io-client";
import { MessageCircle, Send, X, Clock, CheckCircle } from "lucide-react";

export default function ChatComponent({
  userId,
  cartId,
  role = "retailer",
  isLight = false,
  socketServer = process.env.NEXT_PUBLIC_GEOLOC_SOCKET_URL || "http://localhost:8000",
}) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef(null);
  const messageQueue = useRef(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getRoleBadge = (msgRole) => {
    const r = (msgRole || "").toLowerCase();
    switch (r) {
      case "manufacturer":
        return {
          label: "Manufacturer",
          color: isLight
            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
            : "bg-indigo-950/60 text-indigo-300 border-indigo-800",
        };
      case "wholesaler":
        return {
          label: "Wholesaler",
          color: isLight
            ? "bg-cyan-50 text-cyan-700 border-cyan-200"
            : "bg-cyan-950/60 text-cyan-300 border-cyan-800",
        };
      case "retailer":
        return {
          label: "Retailer",
          color: isLight
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-emerald-950/60 text-emerald-300 border-emerald-800",
        };
      case "driver":
        return {
          label: "Driver",
          color: isLight
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-amber-950/60 text-amber-300 border-amber-800",
        };
      default:
        return {
          label: msgRole || "User",
          color: isLight
            ? "bg-neutral-100 text-neutral-700 border-neutral-300"
            : "bg-neutral-800 text-neutral-300 border-neutral-700",
        };
    }
  };

  useEffect(() => {
    if (!userId || !cartId) return;

    const newSocket = io(socketServer, {
      query: { user_id: userId, cart_id: cartId, role },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      newSocket.emit("request-chat-history", { cart_id: cartId });
    });

    newSocket.on("chat-history", (data) => {
      if (data?.history) {
        setMessages(data.history);
        messageQueue.current.clear();
        data.history.forEach((msg) => {
          messageQueue.current.add(`${msg.sender_id}-${msg.timestamp}`);
        });
      }
    });

    newSocket.on("new-message", (message) => {
      const messageId = `${message.sender_id}-${message.timestamp}`;
      if (!messageQueue.current.has(messageId)) {
        messageQueue.current.add(messageId);
        setMessages((prev) => [...prev, message]);
      }
    });

    newSocket.on("connect_error", () => {
      setIsConnected(false);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userId, cartId, role, socketServer]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !socket) return;

    socket.emit("send-message", {
      cart_id: cartId,
      content: messageInput.trim(),
    });

    setMessageInput("");
    setCharCount(0);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    const input = e.target.value;
    if (input.length <= 200) {
      setMessageInput(input);
      setCharCount(input.length);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const isUserMessage = (message) => {
    return message.sender_id === userId || message.role === role;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`w-full py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
          isLight
            ? "bg-neutral-900 hover:bg-black text-white"
            : "bg-white hover:bg-neutral-200 text-black"
        }`}
      >
        <MessageCircle className="w-4 h-4" />
        <span>Shipment Chat Room</span>
        {messages.length > 0 && (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isLight ? "bg-white text-black" : "bg-black text-white"
            }`}
          >
            {messages.length}
          </span>
        )}
      </button>

      {mounted && isOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
              {/* Entire modal is the chatroom itself - 100% filled, no margins */}
              <div
                className={`w-full max-w-xl h-[600px] max-h-[85vh] rounded-2xl flex flex-col shadow-2xl border overflow-hidden ${
                  isLight
                    ? "bg-white border-neutral-200 text-neutral-900"
                    : "bg-[#0d0e13] border-neutral-800 text-white"
                }`}
              >
                {/* Header */}
                <div
                  className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
                    isLight
                      ? "bg-neutral-50/90 border-neutral-200 text-neutral-900"
                      : "bg-[#121319]/90 border-neutral-800/80 text-white"
                  }`}
                >
                  <div>
                    <h3
                      className={`font-editorial text-lg font-light tracking-tight ${
                        isLight ? "text-neutral-900" : "text-white"
                      }`}
                    >
                      Shipment Chat Room
                    </h3>
                    <div className="flex items-center gap-2 text-xs mt-0.5">
                      <span className={`font-mono ${isLight ? "text-neutral-500" : "text-neutral-400"}`}>
                        Cart #{cartId}
                      </span>
                      <span className="text-neutral-400">&bull;</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                          }`}
                        />
                        <span className={`text-[11px] ${isLight ? "text-neutral-600" : "text-neutral-300"}`}>
                          {isConnected ? "Connected" : "Disconnected"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className={`p-2 rounded-full transition-colors cursor-pointer ${
                      isLight
                        ? "hover:bg-neutral-200 text-neutral-600 hover:text-black"
                        : "hover:bg-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Messages Body (Fills entire available height) */}
                <div
                  className={`flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3 ${
                    isLight ? "bg-neutral-50/40 text-neutral-900" : "bg-[#090a0e] text-white"
                  }`}
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 p-6">
                      <MessageCircle className="w-9 h-9 stroke-1 mb-2.5 text-neutral-400" />
                      <p className={`text-sm font-medium ${isLight ? "text-neutral-800" : "text-neutral-200"}`}>
                        No messages in this shipment channel yet.
                      </p>
                      <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                        Send a direct dispatch message to coordinate with the assigned driver and stakeholders.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMe = isUserMessage(message);
                      const badge = getRoleBadge(message.role);

                      return (
                        <div
                          key={`${message.sender_id}-${message.timestamp}`}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-neutral-500">
                            <span className={`font-medium ${isLight ? "text-neutral-700" : "text-neutral-300"}`}>
                              {message.sender_name || (isMe ? "You" : "Stakeholder")}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded border text-[9px] font-semibold ${badge.color}`}>
                              {badge.label}
                            </span>
                          </div>

                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                              isMe
                                ? isLight
                                  ? "bg-neutral-900 text-white rounded-tr-none"
                                  : "bg-white text-black font-medium rounded-tr-none"
                                : isLight
                                ? "bg-white text-neutral-900 rounded-tl-none border border-neutral-200"
                                : "bg-[#181a24] text-white rounded-tl-none border border-neutral-800"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                            <div
                              className={`flex items-center justify-end gap-1 mt-1.5 text-[9px] ${
                                isMe
                                  ? isLight
                                    ? "text-neutral-400"
                                    : "text-neutral-600"
                                  : isLight
                                  ? "text-neutral-500"
                                  : "text-neutral-400"
                              }`}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              <span>{formatTime(message.timestamp)}</span>
                              {isMe && <CheckCircle className="w-2.5 h-2.5" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar (Flush with bottom) */}
                <div
                  className={`p-3.5 border-t shrink-0 ${
                    isLight ? "bg-neutral-50/90 border-neutral-200" : "bg-[#121319]/90 border-neutral-800/80"
                  }`}
                >
                  <div className="relative">
                    <textarea
                      value={messageInput}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyPress}
                      placeholder="Type a message to the courier & stakeholders..."
                      maxLength={200}
                      rows={2}
                      className={`w-full p-3 pr-14 text-xs rounded-xl resize-none border outline-none transition-all ${
                        isLight
                          ? "bg-white border-neutral-200 text-neutral-900 focus:border-black placeholder:text-neutral-400"
                          : "bg-[#181a24] border-neutral-800 text-white focus:border-neutral-600 placeholder:text-neutral-500"
                      }`}
                    />
                    <div className="absolute right-2.5 bottom-3.5 flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400">{charCount}/200</span>
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || !isConnected}
                        className={`p-2 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                          isLight
                            ? "bg-neutral-900 hover:bg-black text-white"
                            : "bg-white hover:bg-neutral-200 text-black"
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}
