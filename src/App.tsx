import { useEffect, useRef, useState } from "react";
import "./App.css";
import { Button, CircularProgress, Snackbar, TextField, ThemeProvider, Typography, createTheme } from "@mui/material";
import { Search, Send } from "@mui/icons-material";
import { isValidApiKey, getResponse, getQueries, runQueries } from "./logic";
import { ChatMessage, ChatMessageComponent } from "./ChatMessage";

function formatChatMessages() {
  const chatMessages = [...document.querySelectorAll(".chatMessage")] as HTMLElement[];
  let w: number;
  let width: number;
  let height: number;

  for (const message of chatMessages) {
    width = message.offsetWidth;
    height = message.offsetHeight;

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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [update, setUpdate] = useState(0);
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
    }, 1000);
    setKeyVerified(true);
  }

  async function submitPrompt() {
    setLoading(true);
    setPrompt("");
    try {
      console.log(`------------------\n------------------\n------------------\n${prompt}`);
      const usersChatMessage = new ChatMessage(new Date(), prompt, true);
      setChatMessages((prev) => [...prev, usersChatMessage]);
      const queries = await getQueries(apiKey, prompt, chatMessages);
      const queryResponses = await runQueries(queries);
      const response = await getResponse(apiKey, prompt, queryResponses, chatMessages);
      const assistantsChatMessage = new ChatMessage(new Date(), response!, false, queries);
      setChatMessages((prev) => [...prev, assistantsChatMessage]);
    } catch (err) {
      setSnackError((err as Error).message);
      setErrorShown(true);
    }
    setLoading(false);
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
          <Typography variant="h4">Restaurant AI</Typography>
          <div style={{ flex: 1 }} />
          <div id="scrollableMessages" style={{ display: "block", flexDirection: "column", justifyContent: "flex-end", overflow: "auto" }}>
            {chatMessages.map((chatMessage, index) => (
              <ChatMessageComponent
                key={index}
                date={chatMessage.date}
                message={chatMessage.message}
                isUser={chatMessage.isUser}
                loading={false}
                update={update}
              />
            ))}
            {loading && keyVerified && <ChatMessageComponent date={new Date()} message="Thinking..." isUser={false} loading={true} update={update} />}
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
                  label="API Key"
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
                  disabled={loading}
                  endIcon={loading ? <CircularProgress size="1em" /> : <Send />}
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
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
