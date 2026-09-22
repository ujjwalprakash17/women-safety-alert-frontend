"use client";

import { useEffect, useState } from "react";
import { api, type TrustedContact } from "@/lib/api";
import { useAuthedUser } from "@/lib/useAuthedUser";
import { useToast } from "@/components/ToastProvider";
import Topbar from "@/components/Topbar";
import BottomNav from "@/components/BottomNav";
import PageLoading from "@/components/PageLoading";

const MAX_CONTACTS = 5;

export default function ContactsPage() {
  const { me, loading: authLoading, error: authError } = useAuthedUser();
  const { showToast } = useToast();
  const [contacts, setContacts] = useState<TrustedContact[] | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authError) showToast(authError, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authError]);

  useEffect(() => {
    if (authLoading) return;
    api
      .listContacts()
      .then(setContacts)
      .catch((err) => showToast(err instanceof Error ? err.message : String(err), "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api.addContact({
        name,
        phone_number: phone,
        relationship_label: relationship || undefined,
      });
      setContacts((prev) => [...(prev ?? []), created]);
      setName("");
      setPhone("");
      setRelationship("");
      showToast(`${created.name} added.`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteContact(id);
      setContacts((prev) => (prev ?? []).filter((c) => c.id !== id));
      showToast("Contact removed.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err), "error");
    }
  }

  if (authLoading || contacts === null) return <PageLoading />;

  const atLimit = contacts.length >= MAX_CONTACTS;

  return (
    <>
      <Topbar me={me} />

      <main className="page">
        <div className="card card-wide stack">
          <div>
            <h1>Trusted contacts</h1>
            <p>
              Up to {MAX_CONTACTS} people. SMS delivery on SOS isn&apos;t wired up yet — this just
              manages who&apos;s on the list.
            </p>
          </div>

          {contacts.length === 0 && (
            <p className="meta">No trusted contacts yet — add your first one below.</p>
          )}

          {contacts.length > 0 && (
            <div className="stack">
              {contacts.map((c) => (
                <div key={c.id} className="list-item row">
                  <div className="avatar">{c.name.charAt(0).toUpperCase()}</div>
                  <div className="list-item-content">
                    <div>
                      <strong>{c.name}</strong>
                      {c.relationship_label && (
                        <span className="meta"> &middot; {c.relationship_label}</span>
                      )}
                    </div>
                    <p className="meta">{c.phone_number}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={() => handleDelete(c.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <hr className="divider" />

          {atLimit ? (
            <p className="meta">
              You&apos;ve reached the {MAX_CONTACTS}-contact limit — remove one to add another.
            </p>
          ) : (
            <form onSubmit={handleAdd} className="stack">
              <label>
                Name
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label>
                Phone number
                <input
                  className="input"
                  type="tel"
                  placeholder="+91XXXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </label>
              <label>
                Relationship (optional)
                <input
                  className="input"
                  placeholder="Mother, Friend, ..."
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Adding..." : "Add contact"}
              </button>
            </form>
          )}
        </div>
      </main>

      <BottomNav />
    </>
  );
}
