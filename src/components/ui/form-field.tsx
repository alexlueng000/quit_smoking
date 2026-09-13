import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
};

export function FormField({ label, hint, required, children }: FormFieldProps) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        {label}
        {required && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
            必填
          </span>
        )}
      </span>
      {hint && <span className="mt-1 block text-xs leading-5 text-slate-500">{hint}</span>}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}
