import { Typography } from "@mui/material";

export class ChatMessage {
  public date: Date;
  public message: string;
  public isUser: boolean;
  public queries: string[];
  constructor(date: Date, message: string, isUser: boolean, queries: string[] = []) {
    this.date = date;
    this.message = message;
    this.isUser = isUser;
    this.queries = queries;
  }
}

interface ChatMessageProps {
  date: Date;
  message: string;
  isUser: boolean;
  loading: boolean;
}

function BouncingLoader() {
  return (
    <div className="bouncing-loader">
      <div />
      <div />
      <div />
    </div>
  );
}

export function ChatMessageComponent({ loading, date, message, isUser }: ChatMessageProps) {
  function isJustNow() {
    const now = new Date();
    return now.getTime() - date.getTime() < 1000 * 60;
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        padding: "0.5em",
        gap: "0.25em",
      }}
    >
      <div
        style={{
          padding: "0.75em",
          borderRadius: "1em",
          borderBottomLeftRadius: isUser ? "1em" : "0",
          borderBottomRightRadius: isUser ? "0" : "1em",
          backgroundColor: isUser ? "#4CAF50" : "#2196F3",
          color: "white",
          maxWidth: "50%",
          wordWrap: "break-word",
        }}
      >
        {loading ? (
          <BouncingLoader />
        ) : (
          <Typography style={{ textAlign: "left" }} dangerouslySetInnerHTML={{ __html: message.replace(/\n/g, "<br />") }} />
        )}
      </div>
      {!loading && <Typography variant="caption">{isJustNow() ? "Just Now" : date.toLocaleTimeString()}</Typography>}
    </div>
  );
}
