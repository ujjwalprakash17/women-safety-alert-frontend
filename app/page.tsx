import Link from "next/link";

export default function Home() {
  return (
    <main className="page">
      <div className="card stack">
        <div>
          <p className="eyebrow">Milestone 1</p>
          <h1>Women Safety SOS</h1>
        </div>
        <p>Walking skeleton — scaffold, PWA basics, and Google sign-in.</p>
        <Link href="/login" className="btn btn-primary">
          Go to login
        </Link>
      </div>
    </main>
  );
}
