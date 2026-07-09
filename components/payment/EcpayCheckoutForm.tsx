"use client";

import { useEffect, useRef } from "react";

type EcpayCheckoutFormProps = {
  actionUrl: string;
  fields: Record<string, string>;
};

export function EcpayCheckoutForm({ actionUrl, fields }: EcpayCheckoutFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  return (
    <form ref={formRef} method="POST" action={actionUrl}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
    </form>
  );
}
