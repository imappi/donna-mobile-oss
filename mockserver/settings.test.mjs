import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";
import { readSettings, updateSettings } from "./settings.mjs";

test("settings preserve declared facts, isolate preferences and reject unsupported authority", () => {
  const book = {};
  assert.equal(readSettings(book, "a").vat_period, null);
  assert.deepEqual(readSettings(book, "a").financial_year, {
    current: null,
    first: null,
    statements: null,
  });
  const prefs = {
    needs_you: false,
    due_dates: true,
    monthly_summary: true,
    every_receipt: false,
  };
  updateSettings(book, "a", {
    type: "set_notifications",
    notifications: prefs,
  });
  assert.deepEqual(readSettings(book, "a").notifications, prefs);
  assert.equal(readSettings(book, "b").notifications.needs_you, true);
  updateSettings(book, "a", { type: "set_vat_period", vat_period: "quarter" });
  assert.equal(readSettings(book, "b").vat_period, "quarter");
  const before = structuredClone(book);
  for (const action of [
    null,
    {},
    { type: "connect_bank" },
    { type: "set_vat_period", vat_period: "month", authority: true },
    { type: "set_vat_period", vat_period: "week" },
    { type: "set_notifications", notifications: { needs_you: "true" } },
    { type: "set_notifications", notifications: { ...prefs, send: true } },
  ]) {
    assert.throws(() => updateSettings(book, "a", action));
    assert.deepEqual(book, before);
  }
  assert.equal(readSettings(book, "a").notification_delivery, "not_configured");
});

test("settings HTTP flow: auth, isolation, persistence after login, explicit receipts and no accounting mutation", async (t) => {
  const server = spawn(process.execPath, ["mockserver/server.mjs"], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, PORT: "0", OPENAI_API_KEY: "" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(async () => {
    server.kill();
    await new Promise((resolve) =>
      server.exitCode !== null ? resolve() : server.once("exit", resolve),
    );
  });
  const root = await new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => reject(Error("Startup timeout")), 5000);
    server.once("error", reject);
    server.stdout.on("data", (chunk) => {
      output += chunk;
      const url = output.match(/http:\/\/localhost:\d+/)?.[0];
      if (url) {
        clearTimeout(timer);
        resolve(url);
      }
    });
  });
  const request = async (path, token, body, expected = 200) => {
    const response = await fetch(root + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    assert.equal(response.status, expected, path);
    return response.json();
  };
  const login = () =>
    request("/auth/sessions", null, {
      email: "demo@example.test",
      password: "receipts",
    });
  const session = await login(),
    token = session.access_token,
    path = "/entities/" + session.default_entity_id;
  await request(path + "/settings", null, undefined, 401);
  await request(
    "/entities/ent-onboarding-preview/settings",
    token,
    undefined,
    404,
  );
  await request(
    "/entities/ent-onboarding-preview/settings",
    token,
    { type: "set_vat_period", vat_period: "year" },
    404,
  );
  const beforeQueue = await request(path + "/queue", token);
  const before = await request(path + "/settings", token);
  const result = await request(path + "/settings", token, {
    type: "set_vat_period",
    vat_period: "quarter",
  });
  assert.equal(result.settings.vat_period, "quarter");
  assert.ok(result.receipt.at);
  assert.ok(result.receipt.summary);
  assert.equal(
    (await request(path + "/settings", (await login()).access_token))
      .vat_period,
    "quarter",
  );
  assert.equal(
    (await request("/entities/" + session.entities[1].id + "/settings", token))
      .vat_period,
    null,
  );
  const prefs = { ...before.notifications, every_receipt: true };
  const changed = await request(path + "/settings", token, {
    type: "set_notifications",
    notifications: prefs,
  });
  assert.deepEqual(changed.settings.notifications, prefs);
  assert.equal(changed.settings.source, "sample");
  assert.equal(changed.settings.notification_delivery, "not_configured");
  await request(path + "/settings", token, { type: "connect_bank" }, 400);
  await request(
    path + "/settings",
    token,
    { type: "set_notifications", notifications: { every_receipt: true } },
    400,
  );
  assert.deepEqual(
    (await request(path + "/queue", token)).cards,
    beforeQueue.cards,
  );
  assert.equal(
    (await request(path + "/queue", token)).needs_you_count,
    beforeQueue.needs_you_count,
  );
});
