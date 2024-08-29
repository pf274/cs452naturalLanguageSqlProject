import { useState } from "react";
import "./App.css";
import { Button, CircularProgress, Snackbar, TextField, ThemeProvider, Typography, createTheme } from "@mui/material";
import { Search, Send } from "@mui/icons-material";
import { isValidApiKey, getQuery, validateQuery, getResponse, runQuery } from "./logic";
import { ChatMessage, ChatMessageComponent } from "./ChatMessage";

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
  const [queries, setQueries] = useState<ChatMessage[]>([]);

  async function verifyKey() {
    setLoading(true);
    const error = await isValidApiKey(apiKey);
    if (error) {
      setSnackError(error);
      setErrorShown(true);
      setKeyVerified(false);
    } else {
      const introductionMessage = new ChatMessage(
        new Date(),
        "Hello! I'm here to help you find a great restaurant. What would you like to know?",
        false
      );
      setChatMessages((prev) => [...prev, introductionMessage]);
      setKeyVerified(true);
    }
    setLoading(false);
  }

  async function submitPrompt() {
    setLoading(true);
    setPrompt("");
    try {
      const usersChatMessage = new ChatMessage(new Date(), prompt, true);
      setChatMessages((prev) => [...prev, usersChatMessage]);
      setQueries((prev) => [...prev, usersChatMessage]);
      const failedQueries = [];
      let attempts = 0;
      let valid;
      let query;
      do {
        query = await getQuery(apiKey, prompt, failedQueries, queries);
        valid = await validateQuery(query);
        if (!valid) {
          failedQueries.push(query);
          attempts++;
        }
      } while (!valid && attempts < 3);
      let queryResponse;
      let response;
      try {
        queryResponse = await runQuery(query);
        setQueries((prev) => [...prev, new ChatMessage(new Date(), query, false)]);
    	} catch (error) {
				response = `I failed to run this query: ${query}`;
      }
      if (queryResponse && !response) {
        response = await getResponse(apiKey, prompt, query, queryResponse, chatMessages);
      }
      const assistantsChatMessage = new ChatMessage(new Date(), response!, false);
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
          height: "100%",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <div
          style={{
            padding: "3em",
            maxWidth: "800px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "1em",
            backgroundColor: "#181818",
          }}
        >
          <Typography variant="h3">Restaurant AI</Typography>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "auto" }}>
            {chatMessages.map((chatMessage, index) => (
              <ChatMessageComponent key={index} date={chatMessage.date} message={chatMessage.message} isUser={chatMessage.isUser} loading={false} />
            ))}
            {loading && keyVerified && <ChatMessageComponent date={new Date()} message="Thinking..." isUser={false} loading={true} />}
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
