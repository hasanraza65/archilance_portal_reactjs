import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import useWidth from "@/hooks/useWidth";
import Icon from "@/components/ui/Icon";
import UserAvatar from "@/components/ui/UserAvatar";
import {
  toggleMobileChatSidebar,
  infoToggle,
  sendMessageToServer,
  deleteMessage,
  updateMessage,
  addReaction,
  fetchOlderConversation,
} from "./store";
import Swal from "sweetalert2";
import { getSocket } from "@/socket";
import MessageContextMenu from "./MessageContextMenu";
import { toast } from "react-toastify";

// Helper function to check if an attachment is an image
const isImage = (attachment) => {
  if (attachment.mime_type) {
    return attachment.mime_type.startsWith("image/");
  }
  if (attachment.file_name) {
    const extension = attachment.file_name.split(".").pop().toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension);
  }
  return false;
};

const Chat = () => {
  const { 
    user, 
    messFeed, 
    openinfo, 
    isMessagesLoading, 
    messagesError,
    nextPageUrl,
    isOlderMessagesLoading,
  } = useSelector((state) => state.appchat);
  const loggedInUser = useSelector((state) => state.auth.user);
  const { width, breakpoints } = useWidth();
  const dispatch = useDispatch();
  const chatheight = useRef(null);
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [caption, setCaption] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [menuState, setMenuState] = useState({
    visible: false,
    position: { x: 0, y: 0 },
    message: null,
  });
  const scrollHeightBeforeLoad = useRef(0);
  const isInitialLoad = useRef(true);

  // =====> SCROLL LOGIC STARTS HERE <=====

  // Effect for scrolling on new messages or initial load
  useEffect(() => {
    const chatContainer = chatheight.current;
    if (!chatContainer || isOlderMessagesLoading) return;

    // On initial load, scroll to the bottom
    if (isInitialLoad.current && !isMessagesLoading && messFeed.length > 0) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
        isInitialLoad.current = false;
        return;
    }

    // For new messages, scroll to bottom only if user is already near the bottom
    const { scrollHeight, scrollTop, clientHeight } = chatContainer;
    if (scrollHeight - scrollTop <= clientHeight + 300) { // 300px buffer
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messFeed, isMessagesLoading, isOlderMessagesLoading]);

  // Effect to handle scroll position during pagination (loading older messages)
  useEffect(() => {
    const chatContainer = chatheight.current;
    if (!chatContainer) return;

    if (isOlderMessagesLoading) {
        // When loading starts, save the current scroll height
        scrollHeightBeforeLoad.current = chatContainer.scrollHeight;
    } else if (scrollHeightBeforeLoad.current > 0) {
        // After loading finishes, restore scroll position relative to the old top
        chatContainer.scrollTop = chatContainer.scrollHeight - scrollHeightBeforeLoad.current;
        scrollHeightBeforeLoad.current = 0; // Reset for next time
    }
  }, [isOlderMessagesLoading]);

  // Reset initial load flag when the user changes
  useEffect(() => {
    isInitialLoad.current = true;
  }, [user.id]);

  // =====> SCROLL LOGIC ENDS HERE <=====

  const handleScroll = useCallback(() => {
      const chatContainer = chatheight.current;
      if (
          chatContainer &&
          chatContainer.scrollTop === 0 &&
          !isOlderMessagesLoading &&
          nextPageUrl
      ) {
          dispatch(fetchOlderConversation(nextPageUrl));
      }
  }, [isOlderMessagesLoading, nextPageUrl, dispatch]);

  useEffect(() => {
      const chatContainer = chatheight.current;
      chatContainer?.addEventListener("scroll", handleScroll);
      return () => {
          chatContainer?.removeEventListener("scroll", handleScroll);
      };
  }, [handleScroll]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
    e.target.value = null;
  };
  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };
  const cancelAttachment = () => {
    setAttachment(null);
    setCaption("");
  };
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (attachment && user?.id) {
      dispatch(
        sendMessageToServer({
          caption: caption,
          receiverId: user.id,
          attachments: [attachment],
        })
      )
        .unwrap()
        .then((result) => {
          const socket = getSocket();
          if (socket?.connected && result.originalMessage) {
            socket.emit("chat-message", result.originalMessage);
          }
        });
      setAttachment(null);
      setCaption("");
    } else if (message.trim() && user?.id) {
      dispatch(
        sendMessageToServer({
          content: message.trim(),
          receiverId: user.id,
          attachments: [],
        })
      )
        .unwrap()
        .then((result) => {
          const socket = getSocket();
          if (socket?.connected && result.originalMessage) {
            socket.emit("chat-message", result.originalMessage);
          }
        });
      setMessage("");
    }
  };
  const handleRightClick = (event, message) => {
    if (message.status === 'pending') {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setMenuState({
      visible: true,
      position: { x: event.clientX, y: event.clientY },
      message: message,
    });
  };
  const handleCloseMenu = () => {
    if (menuState.visible) {
      setMenuState({ ...menuState, visible: false });
    }
  };
  const handleDeleteMessage = (messageId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteMessage(messageId))
          .unwrap()
          .then(() => {
            const socket = getSocket();
            if (socket?.connected) {
              socket.emit("message-deleted", {
                messageId,
                receiverId: user.id,
              });
            }
          });
      }
    });
  };
  const handleEditClick = (message) => {
    setEditingMessageId(message.id);
    setEditedText(message.content);
  };
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedText("");
  };
  const handleUpdateSubmit = (e, messageId) => {
    e.preventDefault();
    if (editedText.trim()) {
      const newContent = editedText.trim();
      dispatch(updateMessage({ messageId, newContent }))
        .unwrap()
        .then(() => {
          const socket = getSocket();
          if (socket?.connected) {
            socket.emit("message-updated", {
              messageId,
              content: newContent,
              receiverId: user.id,
            });
          }
        });
      handleCancelEdit();
    }
  };
  const handleMenuAction = (action, data) => {
    const currentMessage = menuState.message;
    switch (action) {
      case "copy":
        navigator.clipboard.writeText(currentMessage.content);
        toast.success("Message copied to clipboard!");
        break;
      case "delete-for-me":
        handleDeleteMessage(currentMessage.id);
        break;
      case "react":
        dispatch(addReaction({ messageId: currentMessage.id, emoji: data }))
          .unwrap()
          .then((result) => {
            const socket = getSocket();
            const reactionData = result.response.reaction || result.response.data || result.response;
            if (socket?.connected && reactionData) {
              socket.emit("message-reacted", {
                messageId: currentMessage.id,
                reaction: reactionData,
                receiverId: user.id,
              });
            }
          })
          .catch((err) => {
            console.error("Failed to add reaction or emit socket event:", err);
          });
        break;
      case "reply":
        console.log("Reply action clicked for:", currentMessage);
        break;
      default:
        console.log(`Action: ${action}`, currentMessage);
    }
    handleCloseMenu();
  };

  const MessageStatus = ({ status, time }) => {
    if (status === 'pending') {
      return (
        <div className="text-xs text-right mt-1 flex items-center justify-end space-x-1 text-slate-400">
          <span>Sending</span>
          <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      );
    }
    return <div className="text-xs text-right mt-1">{time}</div>;
  };

  return (
    <div className="h-full flex flex-col" onClick={handleCloseMenu}>
      <header className="border-b border-slate-100 dark:border-slate-700">
        <div className="flex py-6 md:px-6 px-3 items-center">
          <div className="flex-1">
            <div className="flex space-x-3 rtl:space-x-reverse">
              {width <= breakpoints.lg && (
                <span
                  onClick={() => dispatch(toggleMobileChatSidebar(true))}
                  className="text-slate-900 dark:text-white cursor-pointer text-xl self-center ltr:mr-3 rtl:ml-3"
                >
                  <Icon icon="heroicons-outline:menu-alt-1" />
                </span>
              )}
              <div className="flex-none">
                <div className="h-10 w-10 rounded-full relative">
                  <span
                    className={`status ring-1 ring-white inline-block h-[10px] w-[10px] rounded-full absolute -right-0 top-0 ${
                      user.status === "active"
                        ? "bg-success-500"
                        : "bg-secondary-500"
                    }`}
                  ></span>
                  <UserAvatar
                    avatarUrl={user.avatar}
                    fullName={user.fullName}
                  />
                </div>
              </div>
              <div className="flex-1 text-start">
                <span className="block text-slate-800 dark:text-slate-300 text-sm font-medium mb-[2px] truncate">
                  {user.fullName}
                </span>
                <span className="block text-slate-500 dark:text-slate-300 text-xs font-normal capitalize">
                  Active now
                </span>
              </div>
            </div>
          </div>
          <div className="flex-none flex md:space-x-3 space-x-1 items-center rtl:space-x-reverse">
            <div className="msg-action-btn cursor-pointer">
              <Icon icon="heroicons-outline:phone" />
            </div>
            <div className="msg-action-btn cursor-pointer">
              <Icon icon="heroicons-outline:video-camera" />
            </div>
            <div
              onClick={() => dispatch(infoToggle(!openinfo))}
              className="msg-action-btn cursor-pointer"
            >
              <Icon icon="heroicons-outline:dots-horizontal" />
            </div>
          </div>
        </div>
      </header>

      <div className="chat-content flex-1 overflow-hidden">
        <div
          className="msgs overflow-y-auto h-full pt-6 space-y-6"
          ref={chatheight}
        >
          {isMessagesLoading && (
            <div className="flex justify-center items-center h-full">
                <Icon icon="eos-icons:loading" className="text-4xl text-slate-500" />
            </div>
          )}

          {isOlderMessagesLoading && (
              <div className="flex justify-center py-2">
                  <Icon icon="eos-icons:loading" className="text-2xl text-slate-500" />
              </div>
          )}

          {!isMessagesLoading && messFeed.length === 0 && !messagesError &&(
             <div className="text-center text-slate-500 h-full flex flex-col justify-center">
                No messages yet. Start the conversation!
             </div>
          )}

          {messagesError && !isMessagesLoading && (
             <div className="text-center text-danger-500 h-full flex flex-col justify-center">
                Error: {messagesError}
             </div>
          )}
          
          {!isMessagesLoading &&
            messFeed.map((item) => (
              <div
                className="block md:px-6 px-4"
                key={item.id}
                onContextMenu={(e) => handleRightClick(e, item)}
              >
                <div
                  className={`flex space-x-2 items-start group rtl:space-x-reverse ${
                    item.sender === "me" ? "justify-end" : ""
                  }`}
                >
                  {item.sender === "them" && (
                    <div className="flex-none self-end">
                      <UserAvatar
                        avatarUrl={item.img}
                        fullName={item.senderFullName}
                        className="h-8 w-8"
                      />
                    </div>
                  )}

                  <div
                    className={`flex flex-col max-w-[70%] ${
                      item.sender === "me" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`text-sm break-words w-full rounded-xl 
                    ${
                      item.sender === "me"
                        ? "bg-slate-900 text-white rounded-tr-none"
                        : "bg-slate-100 dark:bg-slate-600 dark:text-slate-300 text-slate-600 rounded-tl-none"
                    }`}
                    >
                      {editingMessageId === item.id ? (
                        <div className="p-3">
                          <form
                            onSubmit={(e) => handleUpdateSubmit(e, item.id)}
                          >
                            <textarea
                              value={editedText}
                              onChange={(e) => setEditedText(e.target.value)}
                              className="w-full bg-transparent text-white focus:ring-0 focus:outline-none resize-none"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  handleUpdateSubmit(e, item.id);
                                }
                                if (e.key === "Escape") {
                                  handleCancelEdit();
                                }
                              }}
                              autoFocus
                            />
                            <div className="text-xs text-right mt-1 space-x-2">
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="text-slate-400 hover:text-slate-200"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="text-blue-500 hover:text-blue-400 font-semibold"
                              >
                                Save
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <>
                          {item.attachments && item.attachments.length > 0 ? (
                            item.attachments.map((att, index) => (
                              <div key={att.is_local ? `local-${index}`: att.id || index} className="p-2">
                                {isImage(att) ? (
                                  <img
                                    src={att.url}
                                    alt={att.file_name}
                                    className="max-w-[250px] h-auto rounded-md object-cover"
                                  />
                                ) : (
                                  <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-slate-200 dark:bg-slate-700 p-3 rounded-lg flex items-center gap-3 hover:bg-slate-300 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <Icon
                                      icon="heroicons-outline:document-text"
                                      className="text-2xl"
                                    />
                                    <span className="text-sm font-medium flex-1 truncate">
                                      {att.file_name || "Download File"}
                                    </span>
                                  </a>
                                )}
                                {item.content && (
                                  <div className="pt-2">{item.content}</div>
                                )}
                                <MessageStatus status={item.status} time={item.time} />
                              </div>
                            ))
                          ) : (
                            <div className="p-3">
                              <div>{item.content}</div>
                              <MessageStatus status={item.status} time={item.time} />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {item.reactions && item.reactions.length > 0 && (
                      <div className="flex space-x-1 -mt-2 z-10">
                        {item.reactions.map((reaction, index) => (
                          <div
                            key={index}
                            className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs shadow-md border border-slate-200 dark:border-slate-600"
                          >
                            {reaction.reaction}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {item.sender === "me" && !editingMessageId && item.status !== 'pending' && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2 self-center">
                      {item.content && (
                        <div
                          onClick={() => handleEditClick(item)}
                          className="cursor-pointer"
                        >
                          <Icon
                            icon="heroicons-outline:pencil"
                            className="text-slate-400 hover:text-blue-500"
                          />
                        </div>
                      )}
                      <div
                        onClick={() => handleDeleteMessage(item.id)}
                        className="cursor-pointer"
                      >
                        <Icon
                          icon="heroicons-outline:trash"
                          className="text-slate-400 hover:text-danger-500"
                        />
                      </div>
                    </div>
                  )}
                  {item.sender === "me" && (
                    <div className="flex-none self-end">
                      <UserAvatar
                        avatarUrl={loggedInUser?.profile_pic}
                        fullName={loggedInUser?.name}
                        className="h-8 w-8"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      <footer className="md:px-6 px-4 border-t pt-4 border-slate-100 dark:border-slate-700">
        <form onSubmit={handleSendMessage} className="flex-1">
          {attachment && (
            <div className="relative p-3 mb-3 bg-slate-100 dark:bg-slate-900 rounded-md">
              <button
                type="button"
                onClick={cancelAttachment}
                className="absolute top-1.5 right-1.5 bg-slate-600/50 text-white rounded-full p-1 hover:bg-slate-800/70 z-10"
              >
                <Icon icon="heroicons-outline:x" />
              </button>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {attachment.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(attachment)}
                      alt="preview"
                      className="h-16 w-16 object-cover rounded"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                      <Icon
                        icon="heroicons-outline:document"
                        className="text-3xl"
                      />
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Caption (optional)"
                    className="w-full bg-transparent focus:outline-none dark:text-white"
                    autoFocus
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3 pb-2">
            <div className="flex-none">
              <button
                type="button"
                onClick={triggerFileSelect}
                className="h-8 w-8 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex flex-col justify-center items-center text-lg rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                <Icon icon="heroicons-outline:paper-clip" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
            </div>

            <div className="flex-1">
              {!attachment && (
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Type your message..."
                  className="focus:ring-0 focus:outline-0 block w-full bg-transparent dark:text-white resize-none"
                />
              )}
              {attachment && (
                <div className="text-sm text-slate-400">
                  Press Enter to send
                </div>
              )}
            </div>
            <div className="flex-none md:pr-0 pr-3">
              <button
                type="submit"
                className="h-8 w-8 bg-slate-900 text-white flex flex-col justify-center items-center text-lg rounded-full"
              >
                <Icon
                  icon="heroicons-outline:paper-airplane"
                  className="transform rotate-[60deg]"
                />
              </button>
            </div>
          </div>
        </form>
      </footer>
      <MessageContextMenu
        visible={menuState.visible}
        position={menuState.position}
        message={menuState.message}
        onClose={handleCloseMenu}
        onAction={handleMenuAction}
      />
    </div>
  );
};

export default Chat;