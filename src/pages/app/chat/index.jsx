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
import { setContactSearch, fetchUsers } from "./store";

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
    error,
  } = useSelector((state) => state.appchat);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const filteredContacts = contacts?.filter((item) =>
    item.fullName.toLowerCase().includes(searchContact.toLowerCase())
  );

  const isMobile = width < breakpoints.lg;

  if (isMobile) {
    if (activechat) {
      return <Chat />;
    }

    if (mobileChatSidebar) {
      return (
        <Card bodyClass="relative p-0 h-full overflow-hidden" className="h-full">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
            <MyProfile />
          </div>
          <div className="border-b border-slate-100 dark:border-slate-700 py-1">
            <div className="search px-3 mx-6 rounded-sm flex items-center space-x-3 rtl:space-x-reverse">
              <Icon
                icon="bytesize:search"
                className="flex-none text-base text-slate-900 dark:text-slate-400"
              />
              <input
                onChange={(e) => dispatch(setContactSearch(e.target.value))}
                placeholder="Search..."
                className="w-full flex-1 block bg-transparent placeholder:font-normal placeholder:text-slate-400 py-2 focus:ring-0 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-400"
              />
            </div>
          </div>
          <SimpleBar className="contact-height">
            {isLoading && (
              <div className="p-6 text-center text-slate-500">Loading Contacts...</div>
            )}
            {error && <div className="p-6 text-center text-red-500">Error: {error}</div>}
            {!isLoading && !error && filteredContacts?.map((contact) => (
              <Contacts key={contact.id} contact={contact} />
            ))}
            {!isLoading && !error && (!filteredContacts || filteredContacts.length === 0) && (
              <div className="p-6 text-center text-slate-500">No contacts found.</div>
            )}
          </SimpleBar>
        </Card>
      );
    }
    
    return <Blank />;
  }

  return (
    <div className="flex lg:space-x-5 chat-height overflow-hidden relative rtl:space-x-reverse">
      <div className="flex-none min-w-[260px]">
        <Card
          bodyClass="relative p-0 h-full overflow-hidden"
          className="h-full"
        >
          <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
            <MyProfile />
          </div>
          <div className="border-b border-slate-100 dark:border-slate-700 py-1">
            <div className="search px-3 mx-6 rounded-sm flex items-center space-x-3 rtl:space-x-reverse">
              <Icon
                icon="bytesize:search"
                className="flex-none text-base text-slate-900 dark:text-slate-400"
              />
              <input
                onChange={(e) => dispatch(setContactSearch(e.target.value))}
                placeholder="Search..."
                className="w-full flex-1 block bg-transparent placeholder:font-normal placeholder:text-slate-400 py-2 focus:ring-0 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-400"
              />
            </div>
          </div>
          <SimpleBar className="contact-height">
            {isLoading && (
              <div className="p-6 text-center text-slate-500">Loading Contacts...</div>
            )}
            {error && <div className="p-6 text-center text-red-500">Error: {error}</div>}
            {!isLoading && !error && filteredContacts?.map((contact) => (
              <Contacts key={contact.id} contact={contact} />
            ))}
            {!isLoading && !error && (!filteredContacts || filteredContacts.length === 0) && (
                <div className="p-6 text-center text-slate-500">No contacts found.</div>
            )}
          </SimpleBar>
        </Card>
      </div>

      <div className="flex-1">
        <div className="parent flex space-x-5 h-full rtl:space-x-reverse">
          <div className="flex-1">
            <Card bodyClass="p-0 h-full" className="h-full">
              {activechat ? <Chat /> : <Blank />}
            </Card>
          </div>
          {openinfo && activechat && (
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