import { describe, expect, it } from "vitest";
import { validateAdminAuthorization } from "@/lib/auth/admin";

describe("admin basic authentication", () => {
  const password = "a-secure-admin-password";

  it("accepts exact credentials", () => {
    const header = `Basic ${btoa(`admin:${password}`)}`;
    expect(validateAdminAuthorization(header, "admin", password)).toBe(true);
  });

  it("rejects invalid and weak configurations", () => {
    expect(validateAdminAuthorization(`Basic ${btoa("admin:wrong")}`, "admin", password)).toBe(false);
    expect(validateAdminAuthorization(null, "admin", password)).toBe(false);
    expect(validateAdminAuthorization(`Basic ${btoa("admin:short")}`, "admin", "short")).toBe(false);
  });
});
