import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { writeAudit, listAuditLogs, workspaceIdFromPath } from "../src/audit.ts";
import { inviteMember } from "../src/rbac.ts";
import {
  userWithWorkspace,
  registerAndLogin,
  req,
  expectStatus,
  resetDb,
  expectOk,
  bearer,
} from "./helpers.ts";

beforeEach(() => {
  resetDb();
});

test("T08: audit log returns records newest-first with a working cursor", () => {
  const { user, workspaceId } = userWithWorkspace("audit-owner@example.com");
  const ownerId = user.id;

  // Six records stamped 1s apart, all newer than the workspace.created audit
  // row so their relative order is deterministic.
  const base = Date.now() + 1000;
  for (let i = 0; i < 6; i += 1) {
    writeAudit(workspaceId, ownerId, `evt-${i}`, { seq: i }, base + i * 1000);
  }

  const path = `/api/workspaces/${workspaceId}/audit`;
  const pages: string[][] = [];
  const cursors: Array<string | null> = [];
  let cursor: string | null = null;

  for (let round = 0; round < 10; round += 1) {
    const qs = cursor ? `?limit=2&cursor=${encodeURIComponent(cursor)}` : "?limit=2";
    const res = listAuditLogs(req("GET", `${path}${qs}`, undefined, bearer(user.token)));
    expectStatus(res, 200);
    const body = expectOk(res);
    const records = body.records as Array<{ id: string; action: string; createdAt: number }>;
    pages.push(records.map((r) => r.action));
    cursor = (body.nextCursor as string | null) ?? null;
    cursors.push(cursor);
    if (!cursor || records.length === 0) break;
  }

  // Newest-first ordering across all pages.
  const flat = pages.flat();
  assert.deepEqual(flat, ["evt-5", "evt-4", "evt-3", "evt-2", "evt-1", "evt-0", "workspace.created"]);

  // Page sizes respected: two records per page until the tail.
  assert.deepEqual(pages[0], ["evt-5", "evt-4"]);
  assert.deepEqual(pages[1], ["evt-3", "evt-2"]);
  assert.deepEqual(pages[2], ["evt-1", "evt-0"]);
  assert.deepEqual(pages[3], ["workspace.created"]);

  // Cursors: non-null while more records remain, null once the tail page
  // (fewer records than the limit) has been returned.
  assert.equal(cursors.length, 4);
  assert.ok(cursors[0]);
  assert.ok(cursors[1]);
  assert.ok(cursors[2]);
  assert.equal(cursors[3], null);
});

test("T08: with a cursor only records strictly after it are returned", () => {
  const { user, workspaceId } = userWithWorkspace("audit-owner2@example.com");
  const base = Date.now() + 1000;
  for (let i = 0; i < 5; i += 1) {
    writeAudit(workspaceId, user.id, `evt-${i}`, {}, base + i * 1000);
  }

  // First page: the two newest records (evt-4, evt-3) with a cursor.
  const first = expectOk(
    listAuditLogs(
      req("GET", `/api/workspaces/${workspaceId}/audit?limit=2`, undefined, bearer(user.token)),
    ),
  );
  const firstRecords = first.records as Array<{ action: string; createdAt: number }>;
  assert.deepEqual(firstRecords.map((r) => r.action), ["evt-4", "evt-3"]);
  const cursor = first.nextCursor as string;

  // Second page must return strictly older records only.
  const second = expectOk(
    listAuditLogs(
      req(
        "GET",
        `/api/workspaces/${workspaceId}/audit?limit=2&cursor=${encodeURIComponent(cursor)}`,
        undefined,
        bearer(user.token),
      ),
    ),
  );
  const secondRecords = second.records as Array<{ action: string; createdAt: number }>;
  assert.deepEqual(secondRecords.map((r) => r.action), ["evt-2", "evt-1"]);

  const lastTimestamp = firstRecords[1].createdAt;
  for (const record of secondRecords) {
    assert.ok(record.createdAt <= lastTimestamp, "records are at or before the cursor position");
  }
  const secondCursor = second.nextCursor as string;
  assert.notEqual(secondCursor, cursor, "cursor advances between pages");
  assert.ok(
    (secondCursor as unknown as string).length > 0,
    "page 2 still has a nextCursor",
  );
});

test("T08: audit log access is role-gated (viewers blocked, members allowed)", () => {
  const { user: owner, workspaceId } = userWithWorkspace("audit-owner3@example.com");

  const viewer = registerAndLogin("audit-viewer@example.com");
  const member = registerAndLogin("audit-member@example.com");

  for (const [email, role] of [
    [viewer.email, "Viewer"],
    [member.email, "Member"],
  ] as const) {
    expectStatus(
      inviteMember(
        req("POST", `/api/workspaces/${workspaceId}/members`, { email, role }, bearer(owner.token)),
      ),
      201,
    );
  }

  const viewerRes = listAuditLogs(
    req("GET", `/api/workspaces/${workspaceId}/audit`, undefined, bearer(viewer.token)),
  );
  expectStatus(viewerRes, 403);

  const memberRes = listAuditLogs(
    req("GET", `/api/workspaces/${workspaceId}/audit`, undefined, bearer(member.token)),
  );
  expectStatus(memberRes, 200);
});

test("T08: workspaceIdFromPath parses nested audit paths", () => {
  assert.equal(workspaceIdFromPath("/api/workspaces/ws-abc/audit?limit=5"), "ws-abc");
  assert.equal(workspaceIdFromPath("/api/workspaces/ws-abc"), "ws-abc");
  assert.equal(workspaceIdFromPath("/api/other"), null);
});