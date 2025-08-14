// This should be your custom search component, let's call it CustomSearchFilter.jsx
import React from 'react';
import Icon from "@/components/ui/Icon";

const CustomSearchFilter = ({ filter, setFilter, placeholder = "Search..." }) => {
  // We use filter and setFilter to match react-table's props
  const [value, setValue] = React.useState(filter);

  const onChange = (e) => {
    setValue(e.target.value);
    setFilter(e.target.value || undefined); // react-table expects undefined for empty
  };
  
  // Update local state when the global filter is cleared externally
  React.useEffect(() => {
    setValue(filter);
  }, [filter]);

  return (
    <div className="relative">
      <Icon
        icon="heroicons-outline:search"
        className="absolute top-1/2 -translate-y-1/2 left-3 w-5 h-5 text-slate-400 pointer-events-none"
      />
      <input
        type="text"
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        // This className has all our fixes for height, padding, and focus border
        className="form-control w-full h-10 !pl-10 no-focus-border"
      />
    </div>
  );
};

export default CustomSearchFilter;