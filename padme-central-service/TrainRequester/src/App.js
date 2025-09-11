import TrainRequester from "./pages/train-requester";
import { useAlert } from "./hooks/useAlert";

function App() {
  useAlert();
  return (
    <div className="App">
      <TrainRequester />
    </div>
  );
}

export default App;
