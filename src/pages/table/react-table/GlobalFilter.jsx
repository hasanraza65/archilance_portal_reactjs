import React, { useState } from "react";
import Textinput from "@/components/ui/Textinput";

// Hum yahan props mein se filter, setFilter, aur className nikal rahe hain
// taake className ko seedha Textinput ko de sakein.
const GlobalFilter = ({ filter, setFilter, className = "" }) => {
  const [value, setValue] = useState(filter);
  
  const onChange = (e) => {
    setValue(e.target.value);
    setFilter(e.target.value || undefined);
  };

  // Extra div hata diya gaya hai.
  // Ab className seedha Textinput par lagegi.
  return (
    <Textinput
      value={value || ""}
      onChange={onChange}
      placeholder="search..."
      className={className} // Yahan className ko pass kiya ja raha hai
    />
  );
};

export default GlobalFilter;