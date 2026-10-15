import type { IncomingMessage, MailboxConnection } from "./types";

/**
 * Transport boundary. Decrypted credentials reach transports only inside the
 * server process (see mail-transports.ts); no route, log or agent receives them.
 */

export interface OutgoingEmail {
  fromAddress: string;
  fromName: string;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string;
  textBody: string;
  inReplyTo: string | null;
}

export interface SendResult {
  providerMessageId: string;
  acceptedRecipients: string[];
  rejectedRecipients: string[];
}

export interface OutboundTransport {
  readonly kind: string;
  send(mailbox: MailboxConnection, email: OutgoingEmail): Promise<SendResult>;
}

export interface FetchedMessage extends IncomingMessage {
  imapUid: number;
}

export interface FetchBatch {
  messages: FetchedMessage[];
  uidValidity: number;
  /** Highest UID examined in this batch (even if a message was skipped). */
  lastUid: number;
  hasMore: boolean;
}

export interface InboundSource {
  readonly kind: string;
  /** Incremental fetch: UIDs greater than `sinceUid`, at most `limit` messages. */
  fetchSince(mailbox: MailboxConnection, folder: string, sinceUid: number, limit: number): Promise<FetchBatch>;
}

/** Default transport: refuses to send. Sending stays off until separately authorized. */
export class DisabledTransport implements OutboundTransport {
  readonly kind = "disabled";
  async send(): Promise<SendResult> {
    throw new Error("Email sending is disabled in this environment");
  }
}

/** Test double that records what would have been sent. Never touches the network. */
export class RecordingTransport implements OutboundTransport {
  readonly kind = "recording";
  readonly sent: OutgoingEmail[] = [];
  async send(mailbox: MailboxConnection, email: OutgoingEmail): Promise<SendResult> {
    this.sent.push(email);
    return {
      providerMessageId: `recorded-${this.sent.length}@${mailbox.address.split("@")[1]}`,
      acceptedRecipients: [...email.toAddresses, ...email.ccAddresses],
      rejectedRecipients: [],
    };
  }
}
