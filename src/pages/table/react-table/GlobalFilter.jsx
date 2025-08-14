
import React from 'react';
import Icon from "@/components/ui/Icon";

const GlobalFilter =({ value, onChange, placeholder = "Search..." }) => {

  return (
    <div className="relative w-full">
      <Icon
        icon="heroicons-outline:search"
        className="absolute top-1/2 -translate-y-1/2 left-3 w-5 h-5 text-slate-400 pointer-events-none"
      />
      
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="form-control w-full h-10 !pl-10 no-focus-border"
      />
    </div>
  );
};

export default GlobalFilter;