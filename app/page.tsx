import Link from "next/link";
import ShieldIcon from "@/components/ShieldIcon";

export default function Home() {
  return (
    <main className="page">
      <div className="card stack stack-center">
        <span className="brand-mark brand-mark-lg">
          <ShieldIcon size={24} />
        </span>
        <div>
          <p className="eyebrow">Milestone 2</p>
          <h1>Women Safety SOS</h1>
        </div>
        <p>Trigger an SOS and share your live location with nearby responders.</p>
        <Link href="/login" className="btn btn-primary">
          Get started
        </Link>
      </div>
    </main>
  );
}
