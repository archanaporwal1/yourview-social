"use client";

import { useState } from "react";
import Link from "next/link";

import SocialLayout from "@/components/social/SocialLayout";
import Icon from "@/components/social/Icon";

type SettingsSection =
  | "account"
  | "profile"
  | "privacy"
  | "notifications"
  | "appearance"
  | "security";

export default function SettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("account");

  const sections: {
    id: SettingsSection;
    title: string;
    description: string;
    icon: React.ComponentProps<typeof Icon>["name"];
  }[] = [
    {
      id: "account",
      title: "Account",
      description: "Manage your account information and login details.",
      icon: "user",
    },
    {
      id: "profile",
      title: "Profile",
      description: "Manage your name, bio, location and profile information.",
      icon: "profile",
    },
    {
      id: "privacy",
      title: "Privacy & Safety",
      description: "Control your privacy, messaging and blocked accounts.",
      icon: "settings",
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Choose which activity notifications you receive.",
      icon: "bell",
    },
    {
      id: "appearance",
      title: "Appearance",
      description: "Customize the way YourView looks on your device.",
      icon: "edit",
    },
    {
      id: "security",
      title: "Security",
      description: "Manage sessions, logout and account security.",
      icon: "logout",
    },
  ];

  return (
    <SocialLayout active="settings">
      <main className="settings-page">
        <header className="settings-header">
          <Link href="/guest" className="back-button" aria-label="Back">
            <Icon name="arrow-left" size={22} />
          </Link>

          <div>
            <h1>Settings</h1>
            <p>Manage your YourView experience</p>
          </div>
        </header>

        <div className="settings-layout">
          <aside className="settings-menu">
            {sections.map((section) => {
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  className={`settings-menu-item ${
                    isActive ? "active" : ""
                  }`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="settings-menu-icon">
                    <Icon name={section.icon} size={21} />
                  </span>

                  <span className="settings-menu-text">
                    <strong>{section.title}</strong>
                    <small>{section.description}</small>
                  </span>

                  <span className="settings-menu-arrow">›</span>
                </button>
              );
            })}
          </aside>

          <section className="settings-content">
            {activeSection === "account" && (
              <AccountSettings />
            )}

            {activeSection === "profile" && (
              <ProfileSettings />
            )}

            {activeSection === "privacy" && (
              <PrivacySettings />
            )}

            {activeSection === "notifications" && (
              <NotificationSettings />
            )}

            {activeSection === "appearance" && (
              <AppearanceSettings />
            )}

            {activeSection === "security" && (
              <SecuritySettings />
            )}
          </section>
        </div>
      </main>

      <style jsx>{`
        .settings-page {
          min-height: 100vh;
          background: #000;
          color: #fff;
        }

        .settings-header {
          height: 76px;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 0 20px;
          border-bottom: 1px solid #2f3336;
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(0, 0, 0, 0.92);
          backdrop-filter: blur(12px);
        }

        .back-button {
          width: 40px;
          height: 40px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          text-decoration: none;
          transition: background 0.15s ease;
        }

        .back-button:hover {
          background: #181818;
        }

        .settings-header h1 {
          margin: 0;
          font-size: 20px;
          line-height: 24px;
          font-weight: 800;
          letter-spacing: -0.2px;
        }

        .settings-header p {
          margin: 2px 0 0;
          color: #71767b;
          font-size: 13px;
        }

        .settings-layout {
          display: grid;
          grid-template-columns: 290px minmax(0, 1fr);
          min-height: calc(100vh - 76px);
        }

        .settings-menu {
          border-right: 1px solid #2f3336;
          padding: 10px 0;
        }

        .settings-menu-item {
          width: 100%;
          min-height: 76px;
          padding: 13px 18px;
          border: 0;
          background: transparent;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 13px;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .settings-menu-item:hover {
          background: #080808;
        }

        .settings-menu-item.active {
          background: #16181c;
        }

        .settings-menu-icon {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .settings-menu-item.active .settings-menu-icon {
          background: rgba(29, 155, 240, 0.14);
          color: #1d9bf0;
        }

        .settings-menu-text {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .settings-menu-text strong {
          font-size: 15px;
          line-height: 20px;
          font-weight: 700;
        }

        .settings-menu-text small {
          color: #71767b;
          font-size: 12px;
          line-height: 17px;
        }

        .settings-menu-arrow {
          color: #71767b;
          font-size: 25px;
          line-height: 1;
        }

        .settings-content {
          width: 100%;
          max-width: 680px;
          padding: 26px 28px 80px;
        }

        .settings-section h2 {
          margin: 0;
          font-size: 22px;
          line-height: 28px;
          font-weight: 800;
        }

        .settings-section-description {
          margin: 7px 0 24px;
          color: #71767b;
          font-size: 14px;
          line-height: 20px;
        }

        .settings-card {
          border: 1px solid #2f3336;
          border-radius: 14px;
          overflow: hidden;
        }

        .setting-row {
          min-height: 68px;
          padding: 14px 17px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid #2f3336;
        }

        .setting-row:last-child {
          border-bottom: 0;
        }

        .setting-row-text {
          min-width: 0;
        }

        .setting-row-title {
          font-size: 15px;
          line-height: 20px;
          font-weight: 700;
        }

        .setting-row-description {
          margin-top: 3px;
          color: #71767b;
          font-size: 13px;
          line-height: 18px;
        }

        .setting-value {
          color: #71767b;
          font-size: 13px;
          flex-shrink: 0;
        }

        .setting-button {
          min-height: 34px;
          padding: 0 15px;
          border: 1px solid #536471;
          border-radius: 999px;
          background: transparent;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .setting-button:hover {
          background: #181818;
        }

        .toggle {
          width: 46px;
          height: 26px;
          border: 0;
          border-radius: 999px;
          background: #536471;
          padding: 3px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .toggle.on {
          background: #1d9bf0;
        }

        .toggle-knob {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.18s ease;
        }

        .toggle.on .toggle-knob {
          transform: translateX(20px);
        }

        .info-box {
          margin-top: 18px;
          padding: 14px 16px;
          border-radius: 12px;
          background: #16181c;
          color: #8b98a5;
          font-size: 13px;
          line-height: 19px;
        }

        .danger-card {
          margin-top: 24px;
          border: 1px solid #3d2428;
          border-radius: 14px;
          overflow: hidden;
        }

        .danger-title {
          padding: 16px;
          color: #f4212e;
          font-size: 15px;
          font-weight: 800;
          border-bottom: 1px solid #3d2428;
        }

        .danger-row {
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .danger-row strong {
          font-size: 14px;
        }

        .danger-row p {
          margin: 4px 0 0;
          color: #71767b;
          font-size: 13px;
          line-height: 18px;
        }

        .danger-button {
          min-height: 34px;
          padding: 0 15px;
          border: 1px solid #f4212e;
          border-radius: 999px;
          background: transparent;
          color: #f4212e;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .danger-button:hover {
          background: rgba(244, 33, 46, 0.1);
        }

        @media (max-width: 800px) {
          .settings-layout {
            grid-template-columns: 1fr;
          }

          .settings-menu {
            border-right: 0;
            border-bottom: 1px solid #2f3336;
          }

          .settings-menu-item {
            min-height: 64px;
          }

          .settings-content {
            max-width: none;
            padding: 24px 18px 90px;
          }
        }

        @media (max-width: 700px) {
          .settings-header {
            height: 64px;
            padding: 0 14px;
          }

          .settings-header p {
            display: none;
          }

          .settings-menu-text small {
            display: none;
          }

          .settings-menu-item {
            min-height: 58px;
            padding: 10px 15px;
          }

          .settings-content {
            padding: 22px 14px 85px;
          }

          .settings-section h2 {
            font-size: 20px;
          }

          .setting-row {
            padding: 14px;
          }

          .danger-row {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </SocialLayout>
  );
}

function AccountSettings() {
  return (
    <div className="settings-section">
      <h2>Account</h2>
      <p className="settings-section-description">
        Manage your YourView account information.
      </p>

      <div className="settings-card">
        <div className="setting-row">
          <div className="setting-row-text">
            <div className="setting-row-title">Username</div>
            <div className="setting-row-description">
              Your unique YourView handle.
            </div>
          </div>

          <span className="setting-value">Manage from Profile</span>
        </div>

        <div className="setting-row">
          <div className="setting-row-text">
            <div className="setting-row-title">Email address</div>
            <div className="setting-row-description">
              Your account email address.
            </div>
          </div>

          <span className="setting-value">Not connected</span>
        </div>

        <div className="setting-row">
          <div className="setting-row-text">
            <div className="setting-row-title">Password</div>
            <div className="setting-row-description">
              Change your account password.
            </div>
          </div>

          <button className="setting-button" type="button">
            Change
          </button>
        </div>
      </div>

      <div className="info-box">
        Account editing will be connected to the registered-user and guest
        account systems in the next step.
      </div>
    </div>
  );
}

function ProfileSettings() {
  return (
    <div className="settings-section">
      <h2>Profile</h2>
      <p className="settings-section-description">
        Manage the information shown on your YourView profile.
      </p>

      <div className="settings-card">
        <div className="setting-row">
          <div className="setting-row-text">
            <div className="setting-row-title">Name</div>
            <div className="setting-row-description">
              The name displayed on your profile.
            </div>
          </div>

          <Link href="/profile" className="setting-button">
            Edit
          </Link>
        </div>

        <div className="setting-row">
          <div className="setting-row-text">
            <div className="setting-row-title">Bio</div>
            <div className="setting-row-description">
              Tell people a little about yourself.
            </div>
          </div>

          <Link href="/profile" className="setting-button">
            Edit
          </Link>
        </div>

        <div className="setting-row">
          <div className="setting-row-text">
            <div className="setting-row-title">Location</div>
            <div className="setting-row-description">
              City and country displayed on your profile.
            </div>
          </div>

          <Link href="/profile" className="setting-button">
            Edit
          </Link>
        </div>

        <div className="setting-row">
          <div className="setting-row-text">
            <div className="setting-row-title">Date of birth</div>
            <div className="setting-row-description">
              Control whether your birthday information is displayed.
            </div>
          </div>

          <Link href="/profile" className="setting-button">
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}

function PrivacySettings() {
  const [privateAccount, setPrivateAccount] = useState(false);
  const [messageRequests, setMessageRequests] = useState(true);

  return (
    <div className="settings-section">
      <h2>Privacy & Safety</h2>
      <p className="settings-section-description">
        Control who can interact with you and how your account is discovered.
      </p>

      <div className="settings-card">
        <div className="setting-row">
          <div className="setting-row-text">
            <div className="setting-row-title">Private account</div>
            <div className="setting-row-description">
              Require approval before people can follow you.
            </div>
          </div>

          <button
            type="button"
            className={`toggle ${privateAccount ? "on" : ""}`}
            onClick={() => setPrivateAccount((value) => !value)}
            aria-label="Toggle private account"
            aria-pressed={privateAccount}
          >
            <div className="toggle-knob" />
          </button>
        </div>

        <div className="setting-row">
          <div className="setting-row-text">
            <div className="setting-row-title">
              Message requests
            </div>
            <div className="setting-row-description">
              Allow private messages from people you do not follow.
            </div>
          </div>

          <button
            type="button"
            className={`toggle ${messageRequests ? "on" : ""}`}
            onClick={() => setMessageRequests((value) => !value)}
            aria-label="Toggle message requests"
            aria-pressed={messageRequests}
          >
            <div className="toggle-knob" />
          </button>
        </div>

        <div className="setting-row">
          <div className="setting-row-text">
            <div className="setting-row-title">Blocked accounts</div>
            <div className="setting-row-description">
              Manage accounts that you have blocked.
            </div>
          </div>

          <button type="button" className="setting-button">
            Manage
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [likes, setLikes] = useState(true);
  const [replies, setReplies] = useState(true);
  const [reposts, setReposts] = useState(true);
  const [follows, setFollows] = useState(true);
  const [messages, setMessages] = useState(true);

  const rows = [
    {
      title: "Likes",
      description: "When someone likes your post.",
      value: likes,
      setValue: setLikes,
    },
    {
      title: "Replies",
      description: "When someone replies to your post.",
      value: replies,
      setValue: setReplies,
    },
    {
      title: "Reposts",
      description: "When someone reposts your post.",
      value: reposts,
      setValue: setReposts,
    },
    {
      title: "New followers",
      description: "When someone follows you.",
      value: follows,
      setValue: setFollows,
    },
    {
      title: "Messages",
      description: "When you receive a private message.",
      value: messages,
      setValue: setMessages,
    },
  ];

  return (
    <div className="settings-section">
      <h2>Notifications</h2>
      <p className="settings-section-description">
        Choose the activity you want to be notified about.
      </p>

      <div className="settings-card">
        {rows.map((row) => (
          <div className="setting-row" key={row.title}>
            <div className="setting-row-text">
              <div className="setting-row-title">{row.title}</div>
              <div className="setting-row-description">
                {row.description}
              </div>
            </div>

            <button
              type="button"
              className={`toggle ${row.value ? "on" : ""}`}
              onClick={() => row.setValue(!row.value)}
              aria-label={`Toggle ${row.title}`}
              aria-pressed={row.value}
            >
              <div className="toggle-knob" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppearanceSettings() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className="settings-section">
      <h2>Appearance</h2>
      <p className="settings-section-description">
        Customize how YourView looks.
      </p>

      <div className="settings-card">
        <div className="setting-row">
          <div className="setting-row-text">
            <div className="setting-row-title">Dark mode</div>
            <div className="setting-row-description">
              Use the dark YourView interface.
            </div>
          </div>

          <button
            type="button"
            className={`toggle ${darkMode ? "on" : ""}`}
            onClick={() => setDarkMode((value) => !value)}
            aria-label="Toggle dark mode"
            aria-pressed={darkMode}
          >
            <div className="toggle-knob" />
          </button>
        </div>

        <div className="setting-row">
          <div className="setting-row-text">
            <div className="setting-row-title">Display language</div>
            <div className="setting-row-description">
              Language used throughout YourView.
            </div>
          </div>

          <span className="setting-value">English</span>
        </div>
      </div>

      <div className="info-box">
        Appearance preferences will be saved to your account in the backend
        settings step.
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="settings-section">
      <h2>Security</h2>
      <p className="settings-section-description">
        Manage your sessions and account security.
      </p>

      <div className="settings-card">
        <div className="setting-row">
          <div className="setting-row-text">
            <div className="setting-row-title">Active sessions</div>
            <div className="setting-row-description">
              Review devices currently signed in to your account.
            </div>
          </div>

          <button type="button" className="setting-button">
            Manage
          </button>
        </div>

        <div className="setting-row">
          <div className="setting-row-text">
            <div className="setting-row-title">Log out</div>
            <div className="setting-row-description">
              Sign out of your current YourView session.
            </div>
          </div>

          <Link href="/auth/logout" className="setting-button">
            Log out
          </Link>
        </div>
      </div>

      <div className="danger-card">
        <div className="danger-title">Danger zone</div>

        <div className="danger-row">
          <div>
            <strong>Delete account</strong>
            <p>
              Permanently delete your YourView account and associated data.
            </p>
          </div>

          <button type="button" className="danger-button">
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}