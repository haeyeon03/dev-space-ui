import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/user-slice";
import route from "./router/route";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <Provider store={store}>
      <RouterProvider router={route} />
    </Provider>
  );
}
