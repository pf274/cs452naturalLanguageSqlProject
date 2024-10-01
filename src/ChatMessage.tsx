import { ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Modal,
  Typography,
} from "@mui/material";
import { useState } from "react";

export class ChatMessage {
  public date: Date;
  public message: string;
  public isUser: boolean;
  public queries: string[];
  public queryResponses: { success: Record<string, Record<string, any>[]>; fail: string[] };
  constructor(
    date: Date,
    message: string,
    isUser: boolean,
    queries: string[] = [],
    queryResponses: { success: Record<string, Record<string, any>[]>; fail: string[] } = { success: {}, fail: [] }
  ) {
    this.date = date;
    this.message = message;
    this.isUser = isUser;
    this.queries = queries;
    this.queryResponses = queryResponses;
  }
}

interface ChatMessageProps {
  date: Date;
  message: string;
  isUser: boolean;
  loading: boolean;
  update: number;
  queryResponses?: { success: Record<string, Record<string, any>[]>; fail: string[] };
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

export function ChatMessageComponent({ loading, date, message, isUser, update, queryResponses }: ChatMessageProps) {
  const [open, setOpen] = useState(false);
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
  function openQueries() {
    setOpen(true);
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
          position: "relative",
        }}
        className="chatMessage"
      >
        {loading ? (
          <BouncingLoader />
        ) : (
          <Typography style={{ textAlign: "left" }} dangerouslySetInnerHTML={{ __html: message.replace(/\n/g, "<br />") }} />
        )}

        {!loading && !isUser && queryResponses && Object.keys(queryResponses.success).length + queryResponses.fail.length > 0 && (
          <Chip
            sx={{ position: "absolute", top: "-0.5em", left: "-0.5em" }}
            variant="filled"
            color="primary"
            size="small"
            label={String(Object.keys(queryResponses.success).length + queryResponses.fail.length)}
            onClick={openQueries}
          />
        )}
        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle>Query Responses</DialogTitle>
          <DialogContent>
            <Divider />
            {queryResponses && Object.keys(queryResponses.success).length > 0 && (
              <div>
                <DialogContentText>Successful Responses</DialogContentText>
                {queryResponses &&
                  Object.keys(queryResponses.success).map((key) => (
                    <Accordion key={key}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="caption">Request: {key}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <p
                          style={{ whiteSpace: "pre-wrap" }}
                          dangerouslySetInnerHTML={{ __html: JSON.stringify(queryResponses.success[key], null, 2) }}
                        />
                      </AccordionDetails>
                    </Accordion>
                  ))}
              </div>
            )}
            <Divider />
            {queryResponses && queryResponses.fail.length > 0 && (
              <div>
                <DialogContentText>Failed Responses</DialogContentText>
                {queryResponses && queryResponses.fail.map((key) => <DialogContentText key={key}>{key}</DialogContentText>)}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      {!loading && <Typography variant="caption">{update > 0 && isJustNow() ? "Just Now" : howLongAgo()}</Typography>}
    </div>
  );
}

export function LoadingMessage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "0.5em",
        gap: "0.25em",
      }}
    >
      <div
        style={{
          padding: "0.75em",
          borderRadius: "1em",
          borderBottomLeftRadius: "0",
          borderBottomRightRadius: "1em",
          background: "linear-gradient(to bottom, #2196F3, #3F51B5)",
          color: "white",
          maxWidth: "50%",
          textWrap: "balance",
        }}
      >
        <BouncingLoader />
      </div>
    </div>
  );
}
