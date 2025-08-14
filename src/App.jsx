import { Outlet } from "react-router-dom";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import { NAVIGATOR } from "./_navigator";

const BRANDING = {
  title: "DEV-SPACE",
};

export default function App() {
  return (
    <ReactRouterAppProvider navigation={NAVIGATOR} branding={BRANDING}>
      <Outlet />
    </ReactRouterAppProvider>
  );
}
