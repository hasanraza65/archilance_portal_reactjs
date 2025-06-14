// src/pages/app/chat/Info.jsx

import React from "react";
import SimpleBar from "simplebar-react";
import { useSelector } from "react-redux";
import Icon from "@/components/ui/Icon";
import UserAvatar from "./UserAvatar"; // 1. Import the UserAvatar component

// import images (these are for the "shared documents" section)
import Image1 from "@/assets/images/chat/sd1.png";
import Image2 from "@/assets/images/chat/sd2.png";
import Image3 from "@/assets/images/chat/sd3.png";
import Image4 from "@/assets/images/chat/sd4.png";
import Image5 from "@/assets/images/chat/sd5.png";
import Image6 from "@/assets/images/chat/sd6.png";

const socials = [
  { name: "facebook", icon: "bi:facebook", link: "#" },
  { name: "twitter", link: "#", icon: "bi:twitter" },
  { name: "instagram", link: "#", icon: "bi:instagram" },
];

const Info = () => {
  // 2. Point the selector to the correct slice name: 'appchat'
  // We only need the 'user' object here.
  const { user } = useSelector((state) => state.appchat);

  // 3. Add a "guard clause" to prevent errors if no chat is active
  if (!user || !user.fullName) {
    return (
      <div className="h-full p-6 flex items-center justify-center">
        <p className="text-slate-500 text-center">
          Select a conversation to see user information.
        </p>
      </div>
    );
  }

  return (
    <SimpleBar className="h-full p-6">
      <h4 className="text-xl text-slate-900 dark:text-slate-300 font-medium mb-8">
        About
      </h4>
      <div className="h-[100px] w-[100px] rounded-full mx-auto mb-4">
        {/* 4. Use the UserAvatar component for consistency and safety */}
        <UserAvatar
          avatarUrl={user.avatar}
          fullName={user.fullName}
          className="w-full h-full"
        />
      </div>
      <div className="text-center">
        <h5 className="text-base text-slate-600 dark:text-slate-300 font-medium mb-1">
          {user.fullName}
        </h5>
        <h6 className="text-xs text-slate-600 dark:text-slate-300 font-normal">
          {user.role || "User"}
        </h6>
      </div>
      <ul className="list-item mt-5 space-y-4 border-b border-slate-100 dark:border-slate-700 pb-5 -mx-6 px-6">
        <li className="flex justify-between text-sm text-slate-600 dark:text-slate-300 leading-none">
          <div className="flex space-x-2 items-start rtl:space-x-reverse">
            <Icon icon="heroicons-outline:location-marker" className="text-base" />
            <span>Location</span>
          </div>
          <div className="font-medium">Bangladesh</div>
        </li>
        <li className="flex justify-between text-sm text-slate-600 dark:text-slate-300 leading-none">
          <div className="flex space-x-2 items-start rtl:space-x-reverse">
            <Icon icon="heroicons-outline:user" className="text-base" />
            <span>Members since</span>
          </div>
          <div className="font-medium">Oct 2021</div>
        </li>
        <li className="flex justify-between text-sm text-slate-600 dark:text-slate-300 leading-none">
          <div className="flex space-x-2 items-start rtl:space-x-reverse">
            <Icon icon="heroicons-outline:translate" className="text-base" />
            <span>Language</span>
          </div>
          <div className="font-medium">English</div>
        </li>
      </ul>
      <ul className="list-item space-y-3 border-b border-slate-100 dark:border-slate-700 pb-5 -mx-6 px-6 mt-5">
        {socials?.map((slink, sindex) => (
          <li key={sindex} className="text-sm text-slate-600 dark:text-slate-300 leading-none">
            <button className="flex space-x-2 rtl:space-x-reverse">
              <Icon icon={slink.icon} className="text-base" />
              <span className="capitalize font-normal text-slate-600 dark:text-slate-300">
                {slink.name}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <h4 className="py-4 text-sm text-secondary-500 dark:text-slate-300 font-normal">
        Shared documents
      </h4>
      <ul className="grid grid-cols-3 gap-2">
        <li className="h-[46px]"><img src={Image1} alt="" className="w-full h-full object-cover rounded-[3px]" /></li>
        <li className="h-[46px]"><img src={Image2} alt="" className="w-full h-full object-cover rounded-[3px]" /></li>
        <li className="h-[46px]"><img src={Image3} alt="" className="w-full h-full object-cover rounded-[3px]" /></li>
        <li className="h-[46px]"><img src={Image4} alt="" className="w-full h-full object-cover rounded-[3px]" /></li>
        <li className="h-[46px]"><img src={Image5} alt="" className="w-full h-full object-cover rounded-[3px]" /></li>
        <li className="h-[46px]"><img src={Image6} alt="" className="w-full h-full object-cover rounded-[3px]" /></li>
      </ul>
    </SimpleBar>
  );
};

export default Info;