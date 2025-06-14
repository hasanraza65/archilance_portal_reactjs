import React from "react";
import { useSelector, useDispatch } from "react-redux";
import Icon from "@/components/ui/Icon";
import { toggleProfile } from "./store";
import UserAvatar from "./UserAvatar";

const MyProfile = () => {
  const { openProfile } = useSelector((state) => state.appchat);
  const dispatch = useDispatch();

  return (
    <div>
      <header>
        <div className="flex px-6 pt-6">
          <div className="flex-1">
            <div className="flex space-x-3 rtl:space-x-reverse">
              <div className="flex-none"><UserAvatar fullName="My Name" avatarUrl={null} /></div>
              <div className="flex-1 text-start">
                <span className="block text-slate-800 dark:text-slate-300 text-sm font-medium mb-[2px]">
                  My Name
                  <span className="status bg-success-500 inline-block h-[10px] w-[10px] rounded-full ml-3"></span>
                </span>
                <span className="block text-slate-500 dark:text-slate-300 text-xs font-normal">Available</span>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default MyProfile;