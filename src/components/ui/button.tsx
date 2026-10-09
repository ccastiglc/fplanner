"use client";

import * as React from "react";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, asChild, children, ...props }, ref) => {
    if (asChild) {
      const Component = React.forwardRef<HTMLButtonElement>(
        (asChildProps, innerRef) => (
          <button ref={innerRef} className={className} {...asChildProps}>
            {children}
          </button>
        )
      );
      return <Component {...props}>{children}</Component>;
    }

    return (
      <button
        ref={ref}
        className={className}
        disabled={props.disabled}
        type={props.type === undefined ? "button" : props.type}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";