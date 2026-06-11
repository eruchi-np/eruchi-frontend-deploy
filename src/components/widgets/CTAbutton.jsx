import React from "react";

const CTAButton = ({
  onClick,
  href,
  children,
  bgColor = "#000000",
  textColor = "#ffffff",
  fluid = false,
}) => {
  const style = {
    width: fluid ? "100%" : "295px",
    height: "64px",
    backgroundColor: bgColor,
    color: textColor,
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    fontSize: fluid ? "clamp(18px, 4vw, 28px)" : "32px",
    flexShrink: fluid ? undefined : 0,
  };

  const cls =
    "rounded-full transition-opacity hover:opacity-80 flex items-center justify-center text-center";

  if (href)
    return (
      <a href={href} className={cls} style={style}>
        {children}
      </a>
    );

  return (
    <button onClick={onClick} className={cls} style={style}>
      {children}
    </button>
  );
};

export default CTAButton;