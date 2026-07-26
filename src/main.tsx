import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force remove dark class unless user has explicitly saved dark preference
const savedTheme = localStorage.getItem('jb_theme_v2');
if (savedTheme !== 'dark') {
  document.documentElement.classList.remove('dark');
}

createRoot(document.getElementById("root")!).render(<App />);
