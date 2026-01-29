import { createMemoryStore } from "./_memory";
type State = { isAuthed: boolean; userName?: string };
const store = createMemoryStore<State>({ isAuthed: true, userName: "You" });
export const authStore = {
  ...store,
  login(name: string) { store.setState(() => ({ isAuthed: true, userName: name || "You" })); },
  logout() { store.setState(() => ({ isAuthed: false })); },
};
