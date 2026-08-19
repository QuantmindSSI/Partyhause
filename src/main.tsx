import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initWebMCP } from "./mcp";

// Register WebMCP monitoring tools and error capture before first render so
// connected agents can observe the app from the earliest possible moment.
initWebMCP();

createRoot(document.getElementById("root")!).render(<App />);
