"use client";

import Link from "next/link";
import Icon from "./Icon";

export default function RightSidebar() {
  return (
    <aside className="right-sidebar">
      <div className="search-box">
        <Icon name="search" size={19} />

        <input placeholder="Search YourView" />
      </div>

      <section className="side-card">
        <h2>What's happening</h2>

        <div className="trend">
          <span>Trending</span>
          <strong>YourView</strong>
          <small>Latest conversations</small>
        </div>

        <div className="trend">
          <span>Trending</span>
          <strong>Community</strong>
          <small>See what people are saying</small>
        </div>

        <button className="show-more">
          Show more
        </button>
      </section>

      <section className="side-card">
        <h2>Who to follow</h2>

        <div className="follow-row">
          <div className="avatar small">Y</div>

          <div>
            <strong>YourView</strong>
            <span>@yourview</span>
          </div>

          <button className="follow-button">
            Follow
          </button>
        </div>
      </section>

      <div className="side-footer">
        <Link href="/guest/recover">
          Recover guest account
        </Link>

        <span>·</span>
        <span>Privacy</span>
        <span>·</span>
        <span>Terms</span>
        <span>·</span>
        <span>© 2026 YourView</span>
      </div>
    </aside>
  );
}