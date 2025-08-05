import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import useWidth from "@/hooks/useWidth";
import Icon from "@/components/ui/Icon";
import UserAvatar from "@/components/ui/UserAvatar";
import {
  goBackToChatList,
  infoToggle,
  sendMessageToServer,
  deleteMessage,
  updateMessage,
  addReaction,
  removeReaction,
  fetchOlderConversation,
} from "./store";
import Swal from "sweetalert2";
import { getSocket } from "@/socket";
import MessageContextMenu from "./MessageContextMenu";
import { toast } from "react-toastify";
import AudioPlayer from "./AudioPlayer";

const isImage = (attachment) => {
  const mime = attachment.mime_type || "";
  if (mime) {
    return mime.startsWith("image/");
  }
  const name = attachment.file_name || "";
  if (name) {
    const extension = name.split(".").pop().toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension);
  }
  return false;
};

const isAudio = (attachment) => {
  const mime = attachment.mime_type || "";
  if (mime) {
    return mime.startsWith("audio/");
  }
  const name = attachment.file_name || "";
  if (name) {
    const extension = name.split(".").pop().toLowerCase();
    return ["mp3", "wav", "ogg", "webm", "m4a", "aac"].includes(extension);
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
  const [replyingTo, setReplyingTo] = useState(null);
  const scrollHeightBeforeLoad = useRef(0);
  const prevMessFeedLengthRef = useRef(messFeed.length);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const chatContainer = chatheight.current;
    if (!chatContainer) return;

    if (isOlderMessagesLoading) {
      scrollHeightBeforeLoad.current = chatContainer.scrollHeight;
      return;
    }

    if (scrollHeightBeforeLoad.current > 0) {
      chatContainer.scrollTop =
        chatContainer.scrollHeight - scrollHeightBeforeLoad.current;
      scrollHeightBeforeLoad.current = 0;
      prevMessFeedLengthRef.current = messFeed.length;
      return;
    }

    if (messFeed.length > prevMessFeedLengthRef.current) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    prevMessFeedLengthRef.current = messFeed.length;
  }, [messFeed, isOlderMessagesLoading]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

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
    if (e) e.preventDefault();
    const basePayload = {
      receiverId: user.id,
      replyTo: replyingTo ? replyingTo.id : null,
    };

    if (attachment && user?.id) {
      dispatch(
        sendMessageToServer({
          ...basePayload,
          caption: caption,
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
          ...basePayload,
          content: message.trim(),
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
    setReplyingTo(null);
  };
  const handleRightClick = (event, message) => {
    if (message.status === "pending") {
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

  const handleCloseMenu = useCallback(() => {
    if (menuState.visible) {
      setMenuState((prev) => ({ ...prev, visible: false }));
    }
  }, [menuState.visible]);

  useEffect(() => {
    if (!menuState.visible) {
      return;
    }

    window.addEventListener("scroll", handleCloseMenu, true);

    return () => {
      window.removeEventListener("scroll", handleCloseMenu, true);
    };
  }, [menuState.visible, handleCloseMenu]);

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
    const socket = getSocket();

    switch (action) {
      case "copy":
        navigator.clipboard.writeText(currentMessage.content);
        toast.success("Message copied to clipboard!");
        break;
      case "delete-for-me":
        handleDeleteMessage(currentMessage.id);
        break;
      case "react": {
        const myReaction = currentMessage.reactions.find(
          (r) => r.user_id === loggedInUser.id
        );

        const actionToDispatch =
          myReaction && myReaction.reaction === data
            ? removeReaction({ messageId: currentMessage.id })
            : addReaction({ messageId: currentMessage.id, emoji: data });

        dispatch(actionToDispatch)
          .unwrap()
          .then((result) => {
            if (socket?.connected) {
              if (actionToDispatch.type.includes("removeReaction")) {
                socket.emit("message-reacted", {
                  messageId: result.messageId,
                  userId: result.userId,
                  removed: true,
                  receiverId: user.id,
                });
              } else {
                const reactionData =
                  result.response.reaction ||
                  result.response.data ||
                  result.response;
                if (reactionData) {
                  socket.emit("message-reacted", {
                    messageId: currentMessage.id,
                    reaction: reactionData,
                    receiverId: user.id,
                  });
                }
              }
            }
          });
        break;
      }
      case "reply":
        setReplyingTo(currentMessage);
        break;
      default:
        console.log(`Action: ${action}`, currentMessage);
    }
    handleCloseMenu();
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());

        if (audioChunksRef.current.length === 0) {
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioFile = new File(
          [audioBlob],
          `voice-message-${Date.now()}.webm`,
          { type: "audio/webm" }
        );

        const basePayload = {
          receiverId: user.id,
          replyTo: replyingTo ? replyingTo.id : null,
        };

        dispatch(
          sendMessageToServer({
            ...basePayload,
            caption: "",
            attachments: [audioFile],
          })
        )
          .unwrap()
          .then((result) => {
            const socket = getSocket();
            if (socket?.connected && result.originalMessage) {
              socket.emit("chat-message", result.originalMessage);
            }
          });

        if (replyingTo) {
          setReplyingTo(null);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const resetRecordingState = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    mediaRecorderRef.current = null;
    recordingIntervalRef.current = null;
  };

  const handleStopAndSend = () => {
    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === "recording" ||
        mediaRecorderRef.current.state === "paused")
    ) {
      mediaRecorderRef.current.stop();
    }
    resetRecordingState();
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = () => {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      };
      mediaRecorderRef.current.stop();
    }
    resetRecordingState();
  };

  const handleTogglePauseResume = () => {
    if (isPaused) {
      mediaRecorderRef.current.resume();
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      clearInterval(recordingIntervalRef.current);
    }
    setIsPaused(!isPaused);
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (timeInSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const MessageStatus = ({ status, time }) => {
    if (status === "pending") {
      return (
        <div className="text-xs text-right mt-1 flex items-center justify-end space-x-1 text-slate-400">
          <span>Sending</span>
          <svg
            className="animate-spin h-3 w-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      );
    }
    return <div className="text-xs text-right mt-1">{time}</div>;
  };

  const ReplyPreview = () => (
    <div className="relative p-3 mb-3 bg-slate-100 dark:bg-slate-900 rounded-md border-l-4 border-blue-500">
      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-blue-500 text-sm">
            Replying to{" "}
            {replyingTo.sender === "me"
              ? "Yourself"
              : replyingTo.senderFullName}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
            {replyingTo.content || "Attachment"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReplyingTo(null)}
          className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <Icon icon="heroicons-outline:x" />
        </button>
      </div>
    </div>
  );

  const RepliedMessageBlock = ({ message }) => {
    if (!message.parent) return null;

    const parentSenderName =
      message.parent.sender?.name ||
      (message.sender === "me" ? user.fullName : "Yourself");

    return (
      <div className="p-2 mb-2 bg-black/5 dark:bg-white/10 rounded-lg border-l-4 border-blue-500">
        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
          {parentSenderName}
        </div>
        <p className="text-xs text-slate-300 dark:text-white truncate mt-1">
          {message.parent.message || "Attachment"}
        </p>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <header className="border-b border-slate-100 dark:border-slate-700">
        <div className="flex py-6 md:px-6 px-3 items-center">
          <div className="flex-1">
            <div className="flex space-x-3 rtl:space-x-reverse">
              {width <= breakpoints.lg && (
                <span
                  onClick={() => dispatch(goBackToChatList())}
                  className="text-slate-900 dark:text-white cursor-pointer text-xl self-center ltr:mr-3 rtl:ml-3"
                >
                  <Icon icon="heroicons-outline:arrow-left" />
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
            <a
              href="https://outlook.office365.com/book/ArchilanceLLC@archilance.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 rtl:space-x-reverse text-white bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1.5 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Icon icon="heroicons-outline:calendar" className="text-lg" />
              <span className="text-sm font-medium hidden sm:block">
                Schedule a meeting
              </span>
            </a>
            {width > breakpoints.lg && (
                <div
                onClick={() => dispatch(infoToggle(!openinfo))}
                className="msg-action-btn cursor-pointer"
                >
                <Icon icon="heroicons-outline:dots-horizontal" />
                </div>
            )}
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
              <Icon
                icon="eos-icons:loading"
                className="text-4xl text-slate-500"
              />
            </div>
          )}

          {isOlderMessagesLoading && (
            <div className="flex justify-center py-2">
              <Icon
                icon="eos-icons:loading"
                className="text-2xl text-slate-500"
              />
            </div>
          )}

          {!isMessagesLoading && messFeed.length === 0 && !messagesError && (
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
                        <div
                          className={
                            item.attachments.length > 0 &&
                            (isAudio(item.attachments[0]) ||
                              isImage(item.attachments[0]))
                              ? "p-1"
                              : "p-3"
                          }
                        >
                          <RepliedMessageBlock message={item} />
                          {item.attachments && item.attachments.length > 0 ? (
                            item.attachments.map((att, index) => (
                              <div
                                key={
                                  att.is_local
                                    ? `local-${index}`
                                    : att.id || index
                                }
                                className="pt-1"
                              >
                                {isImage(att) ? (
                                  <img
                                    src={att.url}
                                    alt={att.file_name}
                                    className="max-w-[250px] h-auto rounded-md object-cover"
                                  />
                                ) : isAudio(att) ? (
                                  <AudioPlayer src={att.url} />
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
                                  <div className="p-2">{item.content}</div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div>{item.content}</div>
                          )}
                          <div className="px-2 pb-1">
                            <MessageStatus
                              status={item.status}
                              time={item.time}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {item.reactions && item.reactions.length > 0 && (
                        <div className="-mt-3 z-10">
                            <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] scrollbar-hide py-1">
                                {item.reactions.map((reaction) => (
                                    <div
                                    key={reaction.id}
                                    className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs shadow-md border border-slate-200 dark:border-slate-600 flex-shrink-0"
                                    >
                                    {reaction.reaction}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                  </div>
                  {width > breakpoints.lg &&
                    item.sender === "me" &&
                    !editingMessageId &&
                    item.status !== "pending" && (
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
        {replyingTo && <ReplyPreview />}
        <form onSubmit={handleSendMessage} className="flex-1">
          {attachment && !isRecording && (
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
            {!isRecording && (
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
                  accept="image/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
              </div>
            )}

            <div className="flex-1">
              {isRecording ? (
                <div className="flex items-center justify-between w-full">
                  <button
                    type="button"
                    onClick={handleCancelRecording}
                    className="h-8 w-8 text-danger-500 flex flex-col justify-center items-center text-lg rounded-full hover:bg-danger-500/10"
                  >
                    <Icon icon="heroicons-outline:trash" />
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleTogglePauseResume}
                      className="h-8 w-8 text-slate-600 dark:text-slate-300 flex flex-col justify-center items-center text-lg rounded-full"
                    >
                      <Icon
                        icon={
                          isPaused
                            ? "heroicons-outline:play"
                            : "heroicons-outline:pause"
                        }
                      />
                    </button>
                    <div className="text-slate-500 dark:text-slate-400 font-medium">
                      {formatTime(recordingTime)}
                    </div>
                  </div>
                </div>
              ) : !attachment ? (
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
              ) : (
                <div className="text-sm text-slate-400">
                  Press Enter to send the attachment
                </div>
              )}
            </div>

            <div className="flex-none md:pr-0 pr-3">
              {message.trim() === "" && !attachment ? (
                isRecording ? (
                  <button
                    type="button"
                    onClick={handleStopAndSend}
                    className="h-8 w-8 bg-success-500 text-white flex flex-col justify-center items-center text-lg rounded-full"
                  >
                    <Icon
                      icon="heroicons-outline:paper-airplane"
                      className="transform rotate-[60deg]"
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="h-8 w-8 bg-slate-900 text-white flex flex-col justify-center items-center text-lg rounded-full"
                  >
                    <Icon icon="heroicons-outline:microphone" />
                  </button>
                )
              ) : (
                <button
                  type="submit"
                  className="h-8 w-8 bg-slate-900 text-white flex flex-col justify-center items-center text-lg rounded-full"
                >
                  <Icon
                    icon="heroicons-outline:paper-airplane"
                    className="transform rotate-[60deg]"
                  />
                </button>
              )}
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
        loggedInUserId={loggedInUser?.id}
      />
    </div>
  );
};

export default Chat;