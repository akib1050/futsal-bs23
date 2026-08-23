const BASE = process.env.BASE_URL || "http://localhost:3000";

let adminCookie = "";
let playerCookie = "";

function cookieFrom(res) {
  const raw = res.headers.getSetCookie?.() ?? [];
  const hit = raw.find((c) => c.startsWith("futsal_session="));
  return hit ? hit.split(";")[0] : "";
}

async function call(path, { method = "GET", body, cookie } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { res, data };
}

function check(label, ok, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? ` — ${extra}` : ""}`);
  if (!ok) process.exitCode = 1;
}

const testEmail = `tester${Date.now()}@futsal.test`;

{
  const { res } = await call("/api/summary");
  check("summary blocked without login", res.status === 401, `status ${res.status}`);
}

{
  const { res, data } = await call("/api/auth/login", {
    method: "POST",
    body: { email: "akib@futsalbs23.com", password: "Akib12345" },
  });
  adminCookie = cookieFrom(res);
  check("admin login", res.ok && data?.role === "ADMIN", `status ${res.status}`);
  check("admin session cookie", !!adminCookie);
}

let poolRemaining = null;
{
  const { res, data } = await call("/api/summary", { cookie: adminCookie });
  poolRemaining = data?.pool?.remaining;
  check("admin reads pool summary", res.ok && typeof poolRemaining === "number", `remaining ${poolRemaining}`);
}

let claimedPlayer = null;
{
  const { data: roster } = await call("/api/auth/roster");
  claimedPlayer = roster?.[0];
  check("roster available to claim", Array.isArray(roster) && roster.length > 0);

  const { res } = await call("/api/auth/register", {
    method: "POST",
    body: {
      name: "Test Player",
      email: testEmail,
      password: "test1234",
      playerId: claimedPlayer.id,
    },
  });
  playerCookie = cookieFrom(res);
  check("player registers and is approved", res.status === 201, `status ${res.status}`);
}

{
  const { res } = await call("/api/admin/users", { cookie: playerCookie });
  check("player blocked from admin API", res.status === 403, `status ${res.status}`);
}

let creditBefore = null;
let userId = null;
{
  const { res, data } = await call("/api/me", { cookie: playerCookie });
  creditBefore = data?.stats?.credit;
  userId = data?.user?.id;
  check(
    "player sees credit + stats immediately",
    res.ok && typeof creditBefore === "number",
    `credit ${creditBefore}`
  );
}

let requestId = null;
const trxId = `TRX${Date.now()}`;
{
  const { res, data } = await call("/api/payment-requests", {
    method: "POST",
    cookie: playerCookie,
    body: { amount: 900, senderNumber: "01796620959", trxId, method: "BKASH" },
  });
  requestId = data?.id;
  check("player submits bKash payment", res.status === 201, `status ${res.status}`);

  const { res: dupe } = await call("/api/payment-requests", {
    method: "POST",
    cookie: playerCookie,
    body: { amount: 900, senderNumber: "01796620959", trxId },
  });
  check("duplicate trx rejected", dupe.status === 409, `status ${dupe.status}`);
}

{
  const { res } = await call(`/api/admin/payment-requests/${requestId}`, {
    method: "PATCH",
    cookie: adminCookie,
    body: { action: "APPROVE" },
  });
  check("admin approves payment", res.ok, `status ${res.status}`);

  const { data } = await call("/api/me", { cookie: playerCookie });
  const creditAfter = data?.stats?.credit;
  check(
    "player credit updated by 900",
    creditAfter === creditBefore + 900,
    `${creditBefore} -> ${creditAfter}`
  );
}

{
  const { data } = await call("/api/summary", { cookie: adminCookie });
  check(
    "pool remaining grew by 900",
    data?.pool?.remaining === poolRemaining + 900,
    `${poolRemaining} -> ${data?.pool?.remaining}`
  );
}

if (userId) {
  await call(`/api/admin/users/${userId}`, {
    method: "DELETE",
    cookie: adminCookie,
  });
}

console.log(process.exitCode ? "\nSMOKE FAILED" : "\nALL CHECKS PASSED");
