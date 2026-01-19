export function isAuthed() {
  const t = localStorage.getItem("token");
  const id = localStorage.getItem("userId");
  return Boolean(t && id);
}
