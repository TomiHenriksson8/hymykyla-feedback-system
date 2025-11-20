// Admin navigation button shown in top right corner of the page
export function AdminButton() {
  return (
    <div className="absolute top-4 right-4 z-20">
      <a
        href="/hallinta"
        className="text-2xl text-ink hover:text-brand"
        title="Hallinta"
      >
        👤
      </a>
    </div>
  );
}
