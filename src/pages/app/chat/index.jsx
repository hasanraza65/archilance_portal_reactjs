// src/pages/app/chat/ChatPage.jsx

import React, { useEffect } from "react";
import SimpleBar from "simplebar-react";
import useWidth from "@/hooks/useWidth";
import { useSelector, useDispatch } from "react-redux";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import MyProfile from "./MyProfile";
import Contacts from "./Contacts";
import Chat from "./Chat";
import Blank from "./Blank";
import Info from "./Info";
import { toggleMobileChatSidebar, setContactSearch, fetchUsers } from "./store";

const ChatPage = () => {
  const { width, breakpoints } = useWidth();
  const dispatch = useDispatch();

  const { 
    activechat, 
    openinfo, 
    mobileChatSidebar, 
    contacts, 
    searchContact, 
    isLoading, 
    error 
  } = useSelector((state) => state.appchat);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const filteredContacts = contacts?.filter((item) =>
    item.fullName.toLowerCase().includes(searchContact.toLowerCase())
  );

  return (
    <div className="flex lg:space-x-5 chat-height overflow-hidden relative rtl:space-x-reverse">
      <div
        className={`transition-all duration-150 flex-none min-w-[260px] 
        ${width < breakpoints.lg ? "absolute h-full top-0 md:w-[260px] w-[200px] z-999" : "flex-none min-w-[260px]"}
        ${width < breakpoints.lg && mobileChatSidebar ? "left-0 " : "-left-full "}`}
      >
        <Card bodyClass="relative p-0 h-full overflow-hidden" className="h-full">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
            <MyProfile />
          </div>
          <div className="border-b border-slate-100 dark:border-slate-700 py-1">
            <div className="search px-3 mx-6 rounded-sm flex items-center space-x-3 rtl:space-x-reverse">
              <Icon icon="bytesize:search" className="flex-none text-base text-slate-900 dark:text-slate-400" />
              <input
                onChange={(e) => dispatch(setContactSearch(e.target.value))}
                placeholder="Search..."
                className="w-full flex-1 block bg-transparent placeholder:font-normal placeholder:text-slate-400 py-2 focus:ring-0 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-400"
              />
            </div>
          </div>
          <SimpleBar className="contact-height">
            {isLoading && <div className="p-6 text-center text-slate-500">Loading...</div>}
            {error && <div className="p-6 text-center text-red-500">Error: {error}</div>}
            {!isLoading && !error && filteredContacts?.length > 0 &&
                filteredContacts.map((contact) => <Contacts key={contact.id} contact={contact} />)
            }
            {!isLoading && !error && (!filteredContacts || filteredContacts.length === 0) &&
                <div className="p-6 text-center text-slate-500">No contacts found.</div>
            }
          </SimpleBar>
        </Card>
      </div>

      {width < breakpoints.lg && mobileChatSidebar && (
        <div
          className="overlay bg-slate-900 dark:bg-slate-900 dark:bg-opacity-60 bg-opacity-60 backdrop-filter backdrop-blur-xs absolute w-full flex-1 inset-0 z-99 rounded-md"
          onClick={() => dispatch(toggleMobileChatSidebar(false))}
        ></div>
      )}

      <div className="flex-1">
        <div className="parent flex space-x-5 h-full rtl:space-x-reverse">
          <div className="flex-1">
            <Card bodyClass="p-0 h-full" className="h-full">
              {activechat ? <Chat /> : <Blank />}
            </Card>
          </div>
          {width > breakpoints.lg && openinfo && activechat && (
            <div className="flex-none w-[285px]">
              <Card bodyClass="p-0 h-full" className="h-full">
                <Info />
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;