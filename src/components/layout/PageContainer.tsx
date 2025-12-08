import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function PageContainer({ children, className }: Props) {
  return (
    <div className={`w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 ${className || ""}`}>
      {children}
    </div>
  );
}
