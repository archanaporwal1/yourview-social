"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import SocialLayout from "@/components/social/SocialLayout";
import Icon from "@/components/social/Icon";

import {
  createGuestSession,
  getGuestSession,
  type GuestSession,
} from "@/lib/guest/session";


type Message = {
  id: string;
  sender_guest_id: string;
  receiver_guest_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};


type GuestProfile = {
  id: string;
  guest_handle: string;
};


type Conversation = {
  guest_id: string;
  guest_handle: string;
  last_message: string;
  last_message_at: string;
  last_message_id: string;
  last_message_mine: boolean;
  unread_count: number;
};


export default function MessagesPage() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const targetGuestId =
    searchParams.get("to");


  const [guest, setGuest] =
    useState<GuestSession | null>(null);


  const [targetGuest, setTargetGuest] =
    useState<GuestProfile | null>(null);


  const [messages, setMessages] =
    useState<Message[]>([]);


  const [conversations, setConversations] =
    useState<Conversation[]>([]);


  const [messageText, setMessageText] =
    useState("");


  const [loading, setLoading] =
    useState(true);


  const [sending, setSending] =
    useState(false);


  const [error, setError] =
    useState("");


  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);


  const initialized =
    useRef(false);


  // =====================================================
  // INITIALIZE
  // =====================================================

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    initialize();
  }, []);


  // =====================================================
  // AUTO SCROLL
  // =====================================================

  useEffect(() => {
    if (targetGuestId) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages, targetGuestId]);


  // =====================================================
  // POLLING
  // =====================================================

  useEffect(() => {
    if (!guest) {
      return;
    }


    const timer =
      window.setInterval(() => {
        if (targetGuestId) {
          loadConversation(
            guest.id,
            targetGuestId,
            true
          );
        } else {
          loadInbox(
            guest.id,
            true
          );
        }
      }, 4000);


    return () =>
      window.clearInterval(timer);
  }, [
    guest,
    targetGuestId,
  ]);


  // =====================================================
  // INITIALIZE GUEST
  // =====================================================

  async function initialize() {
    try {
      setLoading(true);
      setError("");


      let session =
        await getGuestSession();


      if (!session) {
        session =
          await createGuestSession();
      }


      setGuest(session);


      if (targetGuestId) {
        await loadConversation(
          session.id,
          targetGuestId,
          false
        );
      } else {
        await loadInbox(
          session.id,
          false
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load messages."
      );
    } finally {
      setLoading(false);
    }
  }


  // =====================================================
  // LOAD INBOX
  // =====================================================

  async function loadInbox(
    currentGuestId: string,
    silent: boolean
  ) {
    try {
      if (!silent) {
        setLoading(true);
      }


      const response =
        await fetch(
          "/api/messages",
          {
            method: "GET",

            headers: {
              "x-yourview-guest-id":
                currentGuestId,
            },

            cache: "no-store",
          }
        );


      const result =
        await response
          .json()
          .catch(() => null);


      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to load messages."
        );
      }


      setConversations(
        Array.isArray(
          result?.conversations
        )
          ? result.conversations
          : []
      );
    } catch (err) {
      console.error(err);

      if (!silent) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load messages."
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }


  // =====================================================
  // LOAD PRIVATE CONVERSATION
  // =====================================================

  async function loadConversation(
    currentGuestId: string,
    recipientId: string,
    silent: boolean
  ) {
    try {
      if (!silent) {
        setLoading(true);
      }


      const response =
        await fetch(
          "/api/messages?to=" +
            encodeURIComponent(
              recipientId
            ),
          {
            method: "GET",

            headers: {
              "x-yourview-guest-id":
                currentGuestId,
            },

            cache: "no-store",
          }
        );


      const result =
        await response
          .json()
          .catch(() => null);


      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to load conversation."
        );
      }


      setTargetGuest(
        result?.target_guest || null
      );


      setMessages(
        Array.isArray(
          result?.messages
        )
          ? result.messages
          : []
      );
    } catch (err) {
      console.error(err);

      if (!silent) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load conversation."
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }


  // =====================================================
  // SEND MESSAGE
  // =====================================================

  async function handleSend(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    if (
      !guest ||
      !targetGuestId ||
      sending
    ) {
      return;
    }


    const body =
      messageText.trim();


    if (!body) {
      return;
    }


    try {
      setSending(true);
      setError("");


      const response =
        await fetch(
          "/api/messages",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "x-yourview-guest-id":
                guest.id,
            },

            body: JSON.stringify({
              to: targetGuestId,
              body,
            }),
          }
        );


      const result =
        await response
          .json()
          .catch(() => null);


      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to send message."
        );
      }


      setMessageText("");


      if (result?.message) {
        setMessages(
          (previous) => [
            ...previous,
            result.message,
          ]
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to send message."
      );
    } finally {
      setSending(false);
    }
  }


  // =====================================================
  // FORMAT TIME
  // =====================================================

  function formatTime(
    value: string
  ) {
    const date =
      new Date(value);


    const now =
      new Date();


    const sameDay =
      date.toDateString() ===
      now.toDateString();


    if (sameDay) {
      return date.toLocaleTimeString(
        undefined,
        {
          hour: "numeric",
          minute: "2-digit",
        }
      );
    }


    return date.toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short",
      }
    );
  }


  // =====================================================
  // OPEN CONVERSATION
  // =====================================================

  function openConversation(
    id: string
  ) {
    router.push(
      "/messages?to=" +
        encodeURIComponent(id)
    );
  }


  // =====================================================
  // INBOX
  // =====================================================

  if (!targetGuestId) {
    return (
      <SocialLayout
        guestHandle={
          guest?.guest_handle
        }
        active="messages"
      >
        <section className="feed">
          <header className="feed-header">
            <div className="messages-title">
              <strong>
                Messages
              </strong>
            </div>
          </header>


          {error && (
            <div className="message-error">
              {error}
            </div>
          )}


          {loading ? (
            <div className="loading-state">
              <div className="spinner" />

              <span>
                Loading messages...
              </span>
            </div>
          ) : conversations.length ===
            0 ? (
            <div className="empty-inbox">
              <div className="empty-icon">
                <Icon name="message" />
              </div>

              <h2>
                Your messages
              </h2>

              <p>
                Private conversations
                with other YourView users
                will appear here.
              </p>
            </div>
          ) : (
            <div className="conversation-list">
              {conversations.map(
                (conversation) => (
                  <button
                    key={
                      conversation.guest_id
                    }
                    type="button"
                    className="conversation-item"
                    onClick={() =>
                      openConversation(
                        conversation.guest_id
                      )
                    }
                  >
                    <div className="conversation-avatar">
                      {conversation.guest_handle
                        .charAt(0)
                        .toUpperCase()}
                    </div>


                    <div className="conversation-content">
                      <div className="conversation-top">
                        <strong>
                          {
                            conversation.guest_handle
                          }
                        </strong>

                        <span>
                          {formatTime(
                            conversation.last_message_at
                          )}
                        </span>
                      </div>


                      <div className="conversation-bottom">
                        <span
                          className={
                            conversation.unread_count >
                            0
                              ? "conversation-preview unread"
                              : "conversation-preview"
                          }
                        >
                          {conversation.last_message_mine
                            ? "You: "
                            : ""}

                          {
                            conversation.last_message
                          }
                        </span>


                        {conversation.unread_count >
                          0 && (
                          <span className="unread-badge">
                            {
                              conversation.unread_count
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              )}
            </div>
          )}
        </section>


        <aside className="right-sidebar">
          <div className="side-card">
            <h2>
              Private messages
            </h2>

            <p>
              Your conversations are
              private between you and
              the selected user.
            </p>
          </div>
        </aside>


        <style>{`
          .messages-title {
            height: 64px;
            display: flex;
            align-items: center;
            padding: 0 18px;
          }

          .messages-title strong {
            color: #e7e9ea;
            font-size: 20px;
            font-weight: 800;
          }

          .conversation-list {
            width: 100%;
          }

          .conversation-item {
            width: 100%;
            min-height: 76px;
            border: 0;
            border-bottom: 1px solid #2f3336;
            background: #000;
            color: #e7e9ea;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 18px;
            text-align: left;
            cursor: pointer;
          }

          .conversation-item:hover {
            background: #080808;
          }

          .conversation-avatar {
            width: 48px;
            height: 48px;
            flex: 0 0 48px;
            border-radius: 50%;
            background: #2f3336;
            color: #e7e9ea;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 800;
          }

          .conversation-content {
            min-width: 0;
            flex: 1;
          }

          .conversation-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }

          .conversation-top strong {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #e7e9ea;
            font-size: 15px;
            font-weight: 800;
          }

          .conversation-top span {
            flex: 0 0 auto;
            color: #71767b;
            font-size: 12px;
          }

          .conversation-bottom {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 5px;
          }

          .conversation-preview {
            min-width: 0;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #71767b;
            font-size: 14px;
          }

          .conversation-preview.unread {
            color: #e7e9ea;
            font-weight: 700;
          }

          .unread-badge {
            min-width: 20px;
            height: 20px;
            padding: 0 6px;
            border-radius: 9999px;
            background: #1d9bf0;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 800;
          }

          .empty-inbox {
            min-height: 500px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px 20px;
          }

          .empty-inbox h2 {
            margin: 0;
            color: #e7e9ea;
            font-size: 24px;
            font-weight: 800;
          }

          .empty-inbox p {
            max-width: 390px;
            margin: 10px 0 0;
            color: #71767b;
            font-size: 15px;
            line-height: 1.5;
          }

          .empty-icon {
            width: 56px;
            height: 56px;
            border: 1px solid #536471;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #e7e9ea;
            margin-bottom: 18px;
          }

          .message-error {
            margin: 12px 18px;
            padding: 12px 14px;
            border: 1px solid #5c3030;
            border-radius: 10px;
            background: #211616;
            color: #ffb4b4;
            font-size: 14px;
          }

          @media (max-width: 700px) {
            .conversation-item {
              padding-left: 12px;
              padding-right: 12px;
            }
          }
        `}</style>
      </SocialLayout>
    );
  }


  // =====================================================
  // PRIVATE CONVERSATION
  // =====================================================

  return (
    <SocialLayout
      guestHandle={
        guest?.guest_handle
      }
      active="messages"
    >
      <section className="feed">
        <header className="feed-header">
          <div className="messages-header">
            <button
              type="button"
              className="back-button"
              onClick={() => {
                router.push(
                  "/messages"
                );
              }}
              aria-label="Back to messages"
            >
              <Icon name="arrow-left" />
            </button>


            <div className="header-person">
              {targetGuest ? (
                <>
                  <strong>
                    {
                      targetGuest.guest_handle
                    }
                  </strong>

                  <span>
                    @
                    {
                      targetGuest.guest_handle
                    }
                  </span>
                </>
              ) : (
                <strong>
                  Messages
                </strong>
              )}
            </div>
          </div>
        </header>


        {error && (
          <div className="message-error">
            {error}
          </div>
        )}


        {loading ? (
          <div className="loading-state">
            <div className="spinner" />

            <span>
              Loading conversation...
            </span>
          </div>
        ) : (
          <div className="conversation">
            <div className="messages-list">
              {messages.length ===
              0 ? (
                <div className="conversation-empty">
                  <div className="conversation-avatar">
                    {targetGuest
                      ?.guest_handle
                      ?.charAt(0)
                      .toUpperCase() ||
                      "Y"}
                  </div>

                  <strong>
                    {
                      targetGuest?.guest_handle
                    }
                  </strong>

                  <span>
                    Start a private
                    conversation.
                  </span>
                </div>
              ) : (
                messages.map(
                  (message) => {
                    const mine =
                      message.sender_guest_id ===
                      guest?.id;

                    return (
                      <div
                        key={
                          message.id
                        }
                        className={
                          mine
                            ? "message-row mine"
                            : "message-row"
                        }
                      >
                        <div className="message-bubble">
                          <div className="message-body">
                            {
                              message.body
                            }
                          </div>

                          <div className="message-time">
                            {formatTime(
                              message.created_at
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )
              )}

              <div
                ref={
                  messagesEndRef
                }
              />
            </div>


            <form
              className="message-compose"
              onSubmit={
                handleSend
              }
            >
              <textarea
                value={
                  messageText
                }
                onChange={(
                  event
                ) =>
                  setMessageText(
                    event.target.value
                  )
                }
                placeholder="Start a message..."
                maxLength={5000}
                rows={1}
                disabled={sending}
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                      "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();

                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />

              <button
                type="submit"
                className="send-button"
                disabled={
                  sending ||
                  !messageText.trim()
                }
                aria-label="Send message"
              >
                <Icon name="share" />
              </button>
            </form>
          </div>
        )}
      </section>


      <aside className="right-sidebar">
        <div className="side-card">
          <h2>
            Private messages
          </h2>

          <p>
            Your conversations are
            private between you and
            the selected user.
          </p>
        </div>
      </aside>


      <style>{`
        .messages-header {
          height: 64px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 18px;
        }

        .back-button {
          width: 38px;
          height: 38px;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: #e7e9ea;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .back-button:hover {
          background: #181818;
        }

        .header-person {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .header-person strong {
          color: #e7e9ea;
          font-size: 18px;
          font-weight: 800;
        }

        .header-person span {
          color: #71767b;
          font-size: 13px;
          margin-top: 2px;
        }

        .message-error {
          margin: 12px 18px;
          padding: 12px 14px;
          border: 1px solid #5c3030;
          border-radius: 10px;
          background: #211616;
          color: #ffb4b4;
          font-size: 14px;
        }

        .conversation {
          height: calc(100vh - 64px);
          min-height: 500px;
          display: flex;
          flex-direction: column;
        }

        .messages-list {
          flex: 1;
          overflow-y: auto;
          padding: 20px 18px 24px;
        }

        .message-row {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 10px;
        }

        .message-row.mine {
          justify-content: flex-end;
        }

        .message-bubble {
          max-width: 72%;
          padding: 10px 13px 7px;
          border-radius: 18px;
          background: #202327;
          color: #e7e9ea;
        }

        .message-row.mine .message-bubble {
          background: #1d9bf0;
          color: #fff;
          border-bottom-right-radius: 5px;
        }

        .message-row:not(.mine) .message-bubble {
          border-bottom-left-radius: 5px;
        }

        .message-body {
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          font-size: 15px;
          line-height: 1.4;
        }

        .message-time {
          margin-top: 4px;
          text-align: right;
          font-size: 11px;
          opacity: 0.7;
        }

        .message-compose {
          min-height: 70px;
          border-top: 1px solid #2f3336;
          display: flex;
          align-items: flex-end;
          gap: 10px;
          padding: 12px 14px;
          background: #000;
        }

        .message-compose textarea {
          flex: 1;
          min-height: 42px;
          max-height: 140px;
          resize: none;
          border: 1px solid #536471;
          border-radius: 20px;
          background: #000;
          color: #e7e9ea;
          outline: none;
          padding: 11px 15px;
          font-family: inherit;
          font-size: 15px;
          line-height: 1.35;
        }

        .message-compose textarea:focus {
          border-color: #1d9bf0;
        }

        .message-compose textarea::placeholder {
          color: #71767b;
        }

        .send-button {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          border: 0;
          border-radius: 50%;
          background: #1d9bf0;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .send-button:disabled {
          opacity: 0.4;
          cursor: default;
        }

        .conversation-empty {
          min-height: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #71767b;
          text-align: center;
        }

        .conversation-avatar {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: #2f3336;
          color: #e7e9ea;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .conversation-empty strong {
          color: #e7e9ea;
          font-size: 18px;
        }

        .conversation-empty span {
          margin-top: 5px;
          font-size: 14px;
        }

        .empty-icon {
          width: 56px;
          height: 56px;
          border: 1px solid #536471;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e7e9ea;
          margin-bottom: 18px;
        }

        @media (max-width: 700px) {
          .conversation {
            height: calc(100vh - 120px);
            min-height: 400px;
          }

          .messages-list {
            padding-left: 12px;
            padding-right: 12px;
          }

          .message-bubble {
            max-width: 82%;
          }

          .message-compose {
            padding: 10px;
          }
        }
      `}</style>
    </SocialLayout>
  );
}