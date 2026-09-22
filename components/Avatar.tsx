interface AvatarProps {
  name: string | null | undefined;
  url?: string | null;
  size?: "lg";
}

/** A circular avatar: the uploaded photo if one exists, otherwise the
 * name's first initial — same `.avatar` box used everywhere in the app
 * (Topbar, contact rows), so this just adds the image on top of it. */
export default function Avatar({ name, url, size }: AvatarProps) {
  const initial = (name ?? "?").charAt(0).toUpperCase();
  const className = size === "lg" ? "avatar avatar-lg" : "avatar";

  if (url) {
    return (
      <div className={className}>
        {/* eslint-disable-next-line @next/next/no-img-element -- external,
            per-user Supabase Storage URLs; not part of the build's static set */}
        <img src={url} alt={name ?? "Profile photo"} />
      </div>
    );
  }

  return <div className={className}>{initial}</div>;
}
