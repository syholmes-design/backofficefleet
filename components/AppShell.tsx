/** Product shell: main content only — global chrome is {@link BofHeader} in root layout. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bof-root">
      <main className="bof-main">{children}</main>
    </div>
  );
}
