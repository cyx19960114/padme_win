import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import useNotifier from "./hooks/useNotifier";
import Header from "./core-ui/header";
import { InstallationWizard } from "./pages";

function App() {
  useNotifier();
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<InstallationWizard />} />
      </Routes>
    </Router>
  );
}

export default App;
