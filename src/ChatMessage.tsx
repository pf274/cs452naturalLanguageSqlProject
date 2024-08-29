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
  update: number;
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

export function ChatMessageComponent({ loading, date, message, isUser, update }: ChatMessageProps) {
  function isJustNow() {
    const now = new Date();
    return now.getTime() - date.getTime() < 1000 * 5;
  }
  function howLongAgo() {
    const now = new Date();
    const secondsElapsed = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (secondsElapsed < 60) {
      return `${secondsElapsed} seconds`;
    } else {
      return `${Math.floor(secondsElapsed / 60)} minutes`;
    }
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
          background: isUser ? "linear-gradient(to bottom, #8BC34A, #4CAF50)" : "linear-gradient(to bottom, #2196F3, #3F51B5)",
          color: "white",
          maxWidth: "50%",
          textWrap: "balance",
        }}
        className="chatMessage"
      >
        {loading ? (
          <BouncingLoader />
        ) : (
          <Typography style={{ textAlign: "left" }} dangerouslySetInnerHTML={{ __html: message.replace(/\n/g, "<br />") }} />
        )}
      </div>
      {!loading && <Typography variant="caption">{update > 0 && isJustNow() ? "Just Now" : howLongAgo()}</Typography>}
    </div>
  );
}
