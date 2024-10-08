import { useState } from "react";

function App() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [{ isModelLoading, isGenerating }, setLoadingState] = useState({
    isModelLoading: false,
    isGenerating: false,
  });

  const handlePromptInputChange = (e) => setPrompt(e.target.value);
  const submitPrompt = () => {
    // TODO: Implement the submitPrompt function
  };
  const shouldDisableSubmit = prompt.trim().length === 0;
  const loadingStateClass = isModelLoading ? "loading" : "";

  return (
    <div className="container">
      <div className="content">
        <div>
          <pre>{output}</pre>
        </div>
        <h1>Hi, How may I help you?</h1>
        <div className="prompt-container">
          <input type="text" value={prompt} onChange={handlePromptInputChange} placeholder="Enter your prompt here" />
          <button type="button" onClick={submitPrompt} disabled={shouldDisableSubmit}>
            <div className={loadingStateClass}>→</div>
          </button>
        </div>
        <p className="disclaimer">☉ Models can make mistakes, always double-check responses</p>
      </div>
    </div>
  );
}

export default App;
