import React, { useState } from "react";
import Icon from "@/components/ui/Icon";
import Cleave from "cleave.js/react";
import "cleave.js/dist/addons/cleave-phone.us"; // Only if you use US phone formatting with Cleave

const Textinput = ({
  type,
  label,
  placeholder = "Add Project",
  classLabel = "form-label",
  className = "",
  // classGroup = "", // classGroup was not used
  register,      // From react-hook-form
  name,
  readonly,
  // value,      // Controlled value is usually handled by react-hook-form via register or defaultValue
  error,         // Error object from react-hook-form
  icon,          // This prop was declared but not used. Consider its purpose.
  disabled,
  id,
  horizontal,
  validate,      // THIS WILL NOW BE THE VALIDATION RULES OBJECT for react-hook-form
  isMask,
  msgTooltip,
  description,
  hasicon,       // For password visibility toggle
  onChange,      // Can still be used for custom logic, but RHF handles basic changes
  options,       // For Cleave.js
  onFocus,
  defaultValue,  // react-hook-form can also set defaultValue via register or useForm
  ...rest
}) => {
  const [open, setOpen] = useState(false); // For password visibility
  const handleOpen = () => {
    setOpen(!open);
  };

  // Determine the input type for password fields based on the 'open' state
  const inputType = type === "password" && open ? "text" : type;

  // Construct validation rules for react-hook-form's register function
  // The 'validate' prop is now expected to be the rules object
  const validationRules = validate || {};

  // If a 'required' prop (boolean) was passed directly to Textinput
  // and not defined in 'validate' object, add it to the rules.
  if (rest.required && typeof validationRules.required === 'undefined') {
    validationRules.required = `${label || name} is required.`;
  }


  // Standard input rendering logic
  const renderInput = () => (
    <input
      type={inputType}
      id={id || name} // Use name as fallback for id if not provided
      placeholder={placeholder}
      readOnly={readonly}
      disabled={disabled}
      defaultValue={defaultValue} // RHF will override this if name is registered
      onChange={onChange}
      // Register the input with react-hook-form, spreading its props
      // and passing the name and constructed validationRules
      {...(register && name ? register(name, validationRules) : {})}
      // Spread any other remaining props like 'min', 'max', 'pattern' (if not in validate)
      {...rest}
      className={`${error ? "has-error border-danger-500" : "border-slate-300 dark:border-slate-600"} 
                  form-control py-2 ${className} 
                  focus:border-primary-500 focus:ring-primary-500 
                  dark:bg-slate-800 dark:text-slate-200`}
    />
  );

  // Cleave.js (masked input) rendering logic
  const renderMaskedInput = () => (
    <Cleave
      id={id || name}
      placeholder={placeholder}
      options={options} // Cleave.js specific options
      readOnly={readonly}
      disabled={disabled}
      onChange={onChange} // RHF will manage value, but onChange can be for other side effects
      onFocus={onFocus}
      // Register the input with react-hook-form
      {...(register && name ? register(name, validationRules) : {})}
      {...rest}
      className={`${error ? "has-error border-danger-500" : "border-slate-300 dark:border-slate-600"} 
                  form-control py-2 ${className}
                  focus:border-primary-500 focus:ring-primary-500
                  dark:bg-slate-800 dark:text-slate-200`}
    />
  );
  
  // Conditional rendering for inputs based on whether 'name' (for RHF) and 'isMask' are provided
  let inputElement;
  if (isMask) {
    inputElement = renderMaskedInput();
  } else {
    inputElement = renderInput();
  }
  // Fallback for when `name` prop is not provided (RHF won't be used for this input)
  // This part is kept for compatibility if Textinput is used outside RHF.
  if (!register || !name) {
      if (isMask) {
          inputElement = (
            <Cleave
                id={id}
                placeholder={placeholder}
                options={options}
                className={`${error ? " has-error border-danger-500" : "border-slate-300 dark:border-slate-600"} form-control py-2 ${className}`}
                onFocus={onFocus}
                readOnly={readonly}
                disabled={disabled}
                onChange={onChange} // Custom onChange if not using RHF
                defaultValue={defaultValue}
                {...rest}
            />
          );
      } else {
          inputElement = (
            <input
                type={inputType}
                id={id}
                className={`form-control py-2 ${className} ${error ? " has-error border-danger-500" : "border-slate-300 dark:border-slate-600"}`}
                placeholder={placeholder}
                readOnly={readonly}
                disabled={disabled}
                onChange={onChange} // Custom onChange if not using RHF
                defaultValue={defaultValue}
                {...rest}
            />
          );
      }
  }


  return (
    <div
      className={`fromGroup ${error ? "has-error" : ""} ${horizontal ? "flex items-start" : ""} mb-4`}
    >
      {label && (
        <label
          htmlFor={id || name} // Ensure htmlFor matches input id
          className={`block capitalize ${classLabel} ${
            horizontal ? "flex-0 mr-6 md:w-[100px] w-[60px] break-words" : "mb-1"
          } text-sm font-medium text-slate-700 dark:text-slate-300`}
        >
          {label}
        </label>
      )}
      <div className={`relative ${horizontal ? "flex-1" : ""}`}>
        {inputElement}

        {/* Icons for password toggle, error, and success (now from RHF error state) */}
        <div className="flex text-xl absolute ltr:right-[14px] rtl:left-[14px] top-1/2 -translate-y-1/2 space-x-1 rtl:space-x-reverse">
          {hasicon && type === "password" && ( // Show only if hasicon and type is password
            <span
              className="cursor-pointer text-slate-500 dark:text-slate-400"
              onClick={handleOpen}
            >
              {open ? (
                <Icon icon="heroicons-outline:eye" />
              ) : (
                <Icon icon="heroicons-outline:eye-off" />
              )}
            </span>
          )}

          {error && ( // Show error icon if RHF error object exists
            <span className="text-danger-500">
              <Icon icon="heroicons-outline:information-circle" />
            </span>
          )}
          {/* 
            The original 'validate' prop was used for a success tick.
            RHF doesn't have a direct 'is-valid' state like this without extra logic.
            You could use `!error && isDirty && isValid` from RHF's formState if you want a success tick.
            For simplicity, I'm removing the direct success tick based on the old 'validate' prop.
            If you need it, you'll have to derive it from RHF's state.
          */}
        </div>
      </div>

      {/* Error message from react-hook-form */}
      {error && error.message && ( // Check error.message
        <div
          className={`mt-2 ${
            msgTooltip
              ? "inline-block bg-danger-500 text-white text-[10px] px-2 py-1 rounded-sm"
              : "text-danger-500 block text-sm"
          }`}
        >
          {error.message} {/* Display RHF error message */}
        </div>
      )}

      {/* Description (remains the same) */}
      {description && <span className="input-description mt-1 block text-xs text-slate-500 dark:text-slate-400">{description}</span>}
    </div>
  );
};

export default Textinput;