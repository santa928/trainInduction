import type React from "react";

/**
 * Renders the current app shell while implementation tasks add real screens.
 */
export default function App(): React.JSX.Element {
  return (
    <main className="app-shell">
      <h1>レールをつなごう！</h1>
      <p>でんしゃをえらんで、レールをつなごう。</p>
    </main>
  );
}
