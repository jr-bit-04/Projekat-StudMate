import React from "react";
import backgroundImage from "../../assets/background.png";

const AuthLayout = ({ children }) => {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-[#0b3a8f] px-4 py-10 text-white">
      <img
        src={backgroundImage}
        alt="StudMate background"
        className="fixed inset-0 h-full w-full object-cover"
      />

      <div className="fixed inset-0 bg-[#0b3a8f]/15" />

      <div className="relative z-10 w-full max-w-[520px]">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
