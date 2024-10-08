import { useEffect, useRef, useState } from "react";
import "./App.css";
import { Button, CircularProgress, Snackbar, TextField, ThemeProvider, Typography, createTheme } from "@mui/material";
import { Search, Send } from "@mui/icons-material";
import { isValidApiKey, getResponse, getQueries, runQueries } from "./logic";
import { ChatMessage, ChatMessageComponent, LoadingMessage } from "./ChatMessage";

function formatChatMessages() {
  const chatMessages = [...document.querySelectorAll(".chatMessage")] as HTMLElement[];
  let w: number;
  let width: number;
  let height: number;

  for (const message of chatMessages) {
    width = message.offsetWidth;
    height = message.offsetHeight;
    if (height < 50) {
      continue;
    }

    for (w = width; w; w--) {
      message.style.width = w + "px";
      if (message.offsetHeight !== height) break;
    }

    if (w < message.scrollWidth) {
      message.style.width = message.style.maxWidth = `${message.scrollWidth}px`;
    } else {
      message.style.width = `${w + 1}px`;
    }
  }
}

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  const [apiKey, setApiKey] = useState<string>("");
  const [keyVerified, setKeyVerified] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorShown, setErrorShown] = useState<boolean>(false);
  const [snackError, setSnackError] = useState<string>("");
  const [snackNotification, setSnackNotification] = useState<string>("");
  const [notificationShown, setNotificationShown] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [update, setUpdate] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const messagesEndRef = useRef<any>(null);

  useEffect(() => {
    const updateInterval = setInterval(() => setUpdate((prev) => prev + 1), 1000 * 1);
    window.addEventListener("resize", formatChatMessages);
    return () => {
      clearInterval(updateInterval);
      window.removeEventListener("resize", formatChatMessages);
    };
  }, []);

  useEffect(() => {
    formatChatMessages();
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, loading]);

  async function verifyKey() {
    setLoading(true);
    const error = await isValidApiKey(apiKey);
    if (error) {
      setSnackError(error);
      setErrorShown(true);
      setKeyVerified(false);
      setLoading(false);
      return;
    }
    setTimeout(() => {
      const introductionMessage = new ChatMessage(
        new Date(),
        "Hello! I'm here to help you find a great restaurant. What would you like to know?",
        false
      );
      setChatMessages((prev) => [...prev, introductionMessage]);
      setLoading(false);
    }, 100);
    setKeyVerified(true);
  }

  async function submitPrompt() {
    if (loading || waiting) {
      return;
    }
    setWaiting(true);
    const waitPromise = new Promise((resolve) =>
      setTimeout(() => {
        setWaiting(false), resolve(true);
      }, Math.random() * 1000 + 500)
    );
    setPrompt("");
    try {
      console.log(`------------------\n---New Question---\n------------------\n${prompt}`);
      const userChatMessage = new ChatMessage(new Date(), prompt, true);
      setChatMessages((prev) => [...prev, userChatMessage]);
      await waitPromise;
      setLoading(true);
      const queries = await getQueries(apiKey, prompt, chatMessages);
      const queryResponses = await runQueries(queries);
      const response = await getResponse(apiKey, prompt, queryResponses, chatMessages);
      const assistantChatMessage = new ChatMessage(new Date(), response!, false, queries, queryResponses);
      setChatMessages((prev) => [...prev, assistantChatMessage]);
    } catch (err) {
      setSnackError((err as Error).message);
      setErrorShown(true);
    }
    setLoading(false);
  }

  function handleCopyChatHistory() {
    const chatHistory = chatMessages.map((chatMessage) => {
      if (chatMessage.isUser) {
        return `User: ${chatMessage.message}`;
      }
      return `Assistant: ${chatMessage.message}`;
    });
    navigator.clipboard.writeText(chatHistory.join("\n\n"));
    setSnackNotification("Chat history copied to clipboard");
    setNotificationShown(true);
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <div
        style={{
          display: "flex",
          height: "100vh",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <div
          style={{
            padding: "1.5em",
            width: "calc(100vw - 3em)",
            height: "calc(100vh - 3em)",
            display: "flex",
            flexDirection: "column",
            gap: "1em",
            backgroundColor: "#181818",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
            <Typography variant="h4">Restaurant AI</Typography>
            {chatMessages.length > 0 && (
              <Button variant="contained" onClick={handleCopyChatHistory}>
                Copy Chat History
              </Button>
            )}
          </div>
          <div style={{ flex: 1 }} />
          <div id="scrollableMessages" style={{ display: "block", flexDirection: "column", justifyContent: "flex-end", overflowY: "auto" }}>
            {chatMessages.map((chatMessage, index) => (
              <ChatMessageComponent
                key={index}
                date={chatMessage.date}
                message={chatMessage.message}
                isUser={chatMessage.isUser}
                queryResponses={chatMessage.queryResponses}
                loading={false}
                update={update}
              />
            ))}
            {loading && keyVerified && !waiting && <LoadingMessage />}
            <div ref={messagesEndRef} />
          </div>
          {!keyVerified && (
            <form
              onSubmit={(e) => {
                e.preventDefault(); // Prevent the default form submission action
                verifyKey();
              }}
            >
              <div style={{ display: "flex", flexDirection: "row", flexWrap: "nowrap", gap: "1em" }}>
                <TextField
                  id="keyInput"
                  label="OpenAI API Key"
                  variant="outlined"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setKeyVerified(false);
                  }}
                  style={{ flex: 1 }}
                />
                <Button variant="contained" disabled={loading} endIcon={loading ? <CircularProgress size="1em" /> : <Search />} onClick={verifyKey}>
                  Verify
                </Button>
              </div>
            </form>
          )}
          {keyVerified && (
            <form
              onSubmit={(e) => {
                e.preventDefault(); // Prevent the default form submission action
                submitPrompt();
              }}
            >
              <div style={{ display: "flex", flexDirection: "row", flexWrap: "nowrap", gap: "1em" }}>
                <TextField
                  id="promptInput"
                  label={keyVerified ? "Ask a question" : "Verify your key first"}
                  variant="outlined"
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                  }}
                  autoComplete="off"
                  style={{ flex: 1 }}
                />
                <Button
                  variant="contained"
                  disabled={loading || waiting}
                  endIcon={loading || waiting ? <CircularProgress size="1em" /> : <Send />}
                  onClick={submitPrompt}
                  onSubmit={submitPrompt}
                >
                  Send
                </Button>
              </div>
            </form>
          )}
          <Snackbar
            open={errorShown}
            autoHideDuration={6000}
            onClose={() => setErrorShown(false)}
            message={snackError}
            ContentProps={{
              style: { backgroundColor: "red" },
            }}
          />
          <Snackbar open={notificationShown} autoHideDuration={6000} onClose={() => setNotificationShown(false)} message={snackNotification} />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
