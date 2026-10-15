import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { describe, it } from "node:test";

import { SMTPServer } from "smtp-server";

import { parseRawMessage, SmtpOutboundTransport } from "../mail-transports";
import { partnershipsMailboxSpec } from "../provisioning";
import type { MailboxConnection } from "../types";

const RAW_HTML_ONLY = Buffer.from(
  [
    "From: Checkr Partnerships <partners@checkr.com>",
    "To: partnerships@nathson.com",
    "Cc: bd@checkr.com",
    "Subject: Re: Partner application",
    "Message-ID: <reply-1@checkr.com>",
    "In-Reply-To: <outreach-1@nathson.com>",
    "References: <root@nathson.com> <outreach-1@nathson.com>",
    "Date: Wed, 15 Oct 2026 12:00:00 +0000",
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "",
    "<p>Thanks &mdash; can you share <b>expected volume</b>?</p><script>alert(1)</script>",
    "",
  ].join("\r\n"),
);

describe("parseRawMessage", () => {
  it("normalizes headers, threading ids and converts HTML to text", async () => {
    const m = await parseRawMessage(RAW_HTML_ONLY, "INBOX", 42, "partnerships@nathson.com");
    assert.equal(m.direction, "INBOUND");
    assert.equal(m.messageIdHeader, "reply-1@checkr.com");
    assert.equal(m.inReplyTo, "outreach-1@nathson.com");
    assert.deepEqual(m.references, ["root@nathson.com", "outreach-1@nathson.com"]);
    assert.equal(m.fromAddress, "partners@checkr.com");
    assert.deepEqual(m.ccAddresses, ["bd@checkr.com"]);
    assert.equal(m.imapUid, 42);
    assert.match(m.textBody, /expected volume/i);
    assert.doesNotMatch(m.textBody, /<p>|<b>/);
  });

  it("marks mail from the mailbox itself as OUTBOUND and synthesizes a missing Message-ID", async () => {
    const raw = Buffer.from("From: partnerships@nathson.com\r\nTo: a@checkr.com\r\nSubject: Hi\r\n\r\nbody\r\n");
    const m = await parseRawMessage(raw, "INBOX.Sent", 1, "partnerships@nathson.com");
    assert.equal(m.direction, "OUTBOUND");
    assert.match(m.messageIdHeader, /^bof-synthetic-/);
  });
});

describe("SmtpOutboundTransport (local test server, no network)", () => {
  it("authenticates and delivers the exact message with reply headers", async () => {
    const received: { auth?: string; rcpt: string[]; data?: string } = { rcpt: [] };
    const server = new SMTPServer({
      authOptional: false,
      allowInsecureAuth: true,
      disabledCommands: ["STARTTLS"],
      onAuth(auth, _session, cb) {
        received.auth = `${auth.username}:${auth.password}`;
        cb(null, { user: auth.username });
      },
      onRcptTo(address, _session, cb) {
        received.rcpt.push(address.address);
        cb();
      },
      onData(stream, _session, cb) {
        const chunks: Buffer[] = [];
        stream.on("data", (c: Buffer) => chunks.push(c));
        stream.on("end", () => {
          received.data = Buffer.concat(chunks).toString("utf8");
          cb();
        });
      },
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = (server.server.address() as AddressInfo).port;
    try {
      const mailbox: MailboxConnection = {
        id: "mb",
        ...partnershipsMailboxSpec({ mailHost: "smtp.local.test", approverUserIds: ["u1"] }),
        smtpHost: "127.0.0.1",
        smtpPort: port,
        imapHost: null,
        sendEnabled: true,
        status: "ACTIVE",
      };
      const transport = new SmtpOutboundTransport(async () => ({ username: "partnerships@nathson.com", password: "test-only" }), {
        sentFolder: null,
        allowInsecureForTests: true,
      });
      const result = await transport.send(mailbox, {
        fromAddress: "partnerships@nathson.com",
        fromName: "BackOfficeFleet Partnerships",
        toAddresses: ["partners@checkr.com"],
        ccAddresses: ["bd@checkr.com"],
        subject: "Re: Partner application",
        textBody: "Initial volume is our founding fleet cohort.",
        inReplyTo: "reply-1@checkr.com",
      });
      assert.equal(received.auth, "partnerships@nathson.com:test-only");
      assert.deepEqual(received.rcpt.sort(), ["bd@checkr.com", "partners@checkr.com"]);
      assert.match(received.data ?? "", /In-Reply-To: <reply-1@checkr\.com>/);
      assert.match(received.data ?? "", /founding fleet cohort/);
      assert.ok(result.providerMessageId.includes("@"));
      assert.deepEqual(result.rejectedRecipients, []);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
