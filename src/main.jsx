import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import route from "./router/route";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<RouterProvider router={route} />);
}
