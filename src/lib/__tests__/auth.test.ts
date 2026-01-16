import { vi, test, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const mockSign = vi.fn(() => Promise.resolve("mock-jwt-token"));

vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation((payload) => ({
    payload,
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  })),
  jwtVerify: vi.fn(),
}));

import { createSession, getSession } from "@/lib/auth";
import { SignJWT, jwtVerify } from "jose";

beforeEach(() => {
  vi.clearAllMocks();
});

test("createSession creates a JWT with correct payload", async () => {
  const userId = "user-123";
  const email = "test@example.com";

  await createSession(userId, email);

  expect(SignJWT).toHaveBeenCalledTimes(1);
  const jwtPayload = vi.mocked(SignJWT).mock.calls[0][0];
  expect(jwtPayload?.userId).toBe(userId);
  expect(jwtPayload?.email).toBe(email);
  expect(jwtPayload?.expiresAt).toBeInstanceOf(Date);
});

test("createSession configures JWT with HS256 algorithm and 7d expiration", async () => {
  await createSession("user-123", "test@example.com");

  const jwtInstance = vi.mocked(SignJWT).mock.results[0].value;
  expect(jwtInstance.setProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
  expect(jwtInstance.setExpirationTime).toHaveBeenCalledWith("7d");
  expect(jwtInstance.setIssuedAt).toHaveBeenCalled();
  expect(mockSign).toHaveBeenCalled();
});

test("createSession sets cookie with correct name and options", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledTimes(1);

  const [cookieName, token, options] = mockCookieStore.set.mock.calls[0];

  expect(cookieName).toBe("auth-token");
  expect(token).toBe("mock-jwt-token");
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession sets cookie expiration to 7 days in the future", async () => {
  const now = Date.now();

  await createSession("user-789", "expire@test.com");

  const [, , options] = mockCookieStore.set.mock.calls[0];
  const expiresTime = options.expires.getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(expiresTime).toBeGreaterThanOrEqual(now + sevenDaysMs - 1000);
  expect(expiresTime).toBeLessThanOrEqual(now + sevenDaysMs + 1000);
});

test("getSession returns null when no token cookie exists", async () => {
  mockCookieStore.get.mockReturnValue(undefined);

  const session = await getSession();

  expect(session).toBeNull();
  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
});

test("getSession returns session payload when valid token exists", async () => {
  const mockPayload = {
    userId: "user-456",
    email: "valid@example.com",
    expiresAt: new Date(),
  };

  mockCookieStore.get.mockReturnValue({ value: "valid-jwt-token" });
  vi.mocked(jwtVerify).mockResolvedValue({ payload: mockPayload } as never);

  const session = await getSession();

  expect(session).toEqual(mockPayload);
  expect(jwtVerify).toHaveBeenCalledTimes(1);
  expect(vi.mocked(jwtVerify).mock.calls[0][0]).toBe("valid-jwt-token");
});

test("getSession returns null when token verification fails", async () => {
  mockCookieStore.get.mockReturnValue({ value: "invalid-token" });
  vi.mocked(jwtVerify).mockRejectedValue(new Error("Invalid token"));

  const session = await getSession();

  expect(session).toBeNull();
});