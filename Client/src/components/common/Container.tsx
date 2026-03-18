import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  className?: string;
}>;

export function Container({ className = "", children }: Props) {
  return (
    <div
      className={`mx-auto w-full max-w-8xl px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </div>
  );
}
