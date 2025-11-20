"use client";
import React, { useState } from "react";
import { Input } from "./input"; // Import your existing Shadcn/Custom Input
import { IconEye, IconEyeOff } from "@tabler/icons-react";

// We forward the ref so React Hook Form can control this component
export const PasswordInput = React.forwardRef(({ className, ...props }, ref) => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <div className="relative">
      <Input
        type={isVisible ? "text" : "password"}
        className={`${className} pr-10`} // Add padding-right so text doesn't overlap icon
        ref={ref}
        {...props}
      />
      <button
        type="button"
        onClick={toggleVisibility}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 focus:outline-none"
      >
        {isVisible ? (
          <IconEyeOff className="h-4 w-4" />
        ) : (
          <IconEye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";