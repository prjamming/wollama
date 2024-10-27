/**
 * The approach used in this code is to consolidate all the logic in a single component.
 * This was done to focus on more on demonstration of the concept. Its is wise and welcome to refactor
 * the code to suit your needs.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { CHAT_ROLE as ROLE, formatChat, getWllamaInstance, PRESET_MODELS } from "./lib/wllama";

const ELLIPSIS = "...";
const initialModelId = Object.keys(PRESET_MODELS)[0];
const copyToClipboard = (text) => navigator.clipboard.writeText(text).catch((e) => console.error(e));

const modelStateDefaults = {
  isLoading: false,
  isReady: false,
  modelId: initialModelId,
  loadingProgress: 0,
};

function App() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [{ isLoading, isReady, modelId, loadingProgress }, setModelState] = useState(modelStateDefaults);
  const [localModelFiles, setLocalModelFiles] = useState([]);
  const selectedModel = localModelFiles.length
    ? { name: localModelFiles[0].name, url: "file", license: "" }
    : PRESET_MODELS[modelId];

  const wllama = useMemo(() => getWllamaInstance(), [selectedModel.name]);

  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadModel = async () => {
    setModelState((current) => ({ ...current, isLoading: true }));
    const options = {
      n_threads: 1,
      useCache: true,
      allowOffline: true,
      progressCallback: (progress) =>
        setModelState((current) => ({
          ...current,
          loadingProgress: progress,
        })),
    };
    await wllama.exit();
    if (localModelFiles.length) {
      await wllama.loadModel(localModelFiles, options);
    } else {
      await wllama.loadModelFromUrl(selectedModel.url, options);
    }
    setModelState((current) => ({
      ...modelStateDefaults,
      isReady: true,
      modelId: current.modelId,
    }));
  };

  useEffect(
    function scrollChatToBottom() {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    },
    [messages]
  );
  useEffect(() => () => wllama.exit(), []);

  const streamMessages = (prompt) => {
    setMessages((current) => [
      ...current,
      { role: ROLE.user, content: prompt.trim() },
      { role: ROLE.assistant, content: ELLIPSIS },
    ]);
    return (token, piece, text) =>
      setMessages((current) => {
        const updatedMessages = [...current];
        updatedMessages[updatedMessages.length - 1].content = text;
        return updatedMessages;
      });
  };

  const submitPrompt = async () => {
    const onNewToken = streamMessages(prompt);
    setIsGenerating(true);
    if (!isReady) await loadModel();
    const latestMessages = [...messages].slice(-3);
    const formattedChat = await formatChat(wllama, [...latestMessages, { role: ROLE.user, content: prompt.trim() }]);
    await wllama.createCompletion(formattedChat, {
      nPredict: 512,
      sampling: { temp: 0.5, penalty_repeat: 1.3 },
      onNewToken,
    });
    setIsGenerating(false);
    setPrompt("");
  };

  const handleOnPressEnter = (e) => (e.key === "Enter" ? submitPrompt() : null);

  const handlePromptInputChange = (e) => setPrompt(e.target.value);

  const handleFileInputChange = (event) => {
    const files = event.target.files;
    if (!files.length) {
      return;
    }
    setLocalModelFiles(files);
    setModelState({ ...modelStateDefaults, modelId: "file" });
  };
  const handleOnNewChatClick = () => setMessages([]);
  const getMenuOptionHandler = (modelId) => () => {
    setLocalModelFiles([]);
    setModelState({ ...modelStateDefaults, modelId });
  };

  const isBusy = isLoading || isGenerating;
  const shouldDisableSubmit = isBusy || prompt.trim().length === 0;
  const loadedSize = loadingProgress.loaded || 0;
  const totalSize = loadingProgress.total || 100;
  const loadingProgressDisplayString = `${Math.floor((loadedSize / totalSize) * 100)}%`;
  const modelSizeDisplayString = totalSize ? `(${Math.ceil(totalSize / 1024 / 1024)}MB)` : "";

  return (
    <div>
      <header>
        <div>
          <button aria-labelledby="newChatLabel" onClick={handleOnNewChatClick} disabled={isBusy}>
            &#8853;
            <span id="newChatLabel" className="tooltip">
              New chat
            </span>
          </button>
          <div className="dropdown" key={selectedModel.name}>
            <button className="dropbtn" title={selectedModel.name}>{selectedModel.name}</button>
            <ul className="dropdown-content">
              {Object.values(PRESET_MODELS).map(({ name, description }) => (
                <li key={name}>
                  <label role="button" title={description} onClick={getMenuOptionHandler(name)}>
                    {name}
                  </label>
                </li>
              ))}
              {localModelFiles.length > 0 && <label role="button">{selectedModel.name}</label>}
              <li>
                <label title="Select your own local GGUF file">
                  Select GGUF file (2GB Max)...
                  <input
                    type="file"
                    accept=".gguf"
                    disabled={isBusy}
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    hidden
                  />
                </label>
              </li>
            </ul>
          </div>
        </div>
        <div>
          <a href="https://huggingface.co/models?library=gguf&pipeline_tag=text-generation" target="_blank" rel="noopener">
            Download Models
          </a>
          &nbsp;&bull;&nbsp;
          <a href="https://github.com/nadchif/in-browser-llm-inference" target="_blank" rel="noopener">
            Github
          </a>
        </div>
      </header>
      <div className="container">
        <div className="content">
          <div className="output-container">
            {messages.length ? (
              <div className="messages" ref={messagesContainerRef}>
                {messages.map(({ content, role }, index) => (
                  <div key={index} className={`message-${role}`}>
                    <pre>{content !== ELLIPSIS && content}</pre>
                    {!isGenerating && role === ROLE.assistant && (
                      <div>
                        <button aria-labelledby="copyLabel" onClick={() => copyToClipboard(content)}>
                          &#10064;
                          <span className="tooltip" id="copyLabel">
                            Copy
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {isGenerating && <div className="chat-loader"></div>}
              </div>
            ) : (
              <h1 className="welcome-message scale-up-center">Hi, how may I help you?</h1>
            )}
            {isLoading && loadedSize > 0 && (
              <div className="download-message">
                <b>{loadingProgressDisplayString}</b> Downloading model file {modelSizeDisplayString} to your computer.
                This happens only the first time you load the model.
              </div>
            )}
          </div>
          <div className="prompt-container">
            <input
              type="text"
              value={prompt}
              onKeyDown={handleOnPressEnter}
              onChange={handlePromptInputChange}
              placeholder="Enter your prompt here"
              maxLength={512}
              readOnly={isBusy}
            />
            <button type="button" title="submit" onClick={submitPrompt} disabled={shouldDisableSubmit}>
              <div>&#10132;</div>
            </button>
          </div>
          <div className="disclaimer">
            &#9888; Models can make mistakes, always double-check responses. &bull;&nbsp;
            <a href={selectedModel.url} target="_blank" rel="noopener" download>
              Model
            </a>&nbsp;&bull;&nbsp;
            <a href={selectedModel.license} target="_blank" rel="noopener">
              License
            </a>
          </div>
          <footer>
            Did you know? This chatbot runs entirely in your browser. No data is sent to any server.&nbsp;
            <a href="https://github.com/nadchif/in-browser-llm-inference/blob/main/HOWTO.md" target="_blank">
              Learn more.
            </a>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;
