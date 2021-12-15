import React, { useState, useMemo } from "react";
import { Editor } from "../editor";
import { useNote, useTitleUpdate, useSync } from "./hooks";
import { Descendant } from "slate";
import { ReadyState } from "react-use-websocket";
import { useRouter } from "next/router";
import { Paper, TextField, Badge, BadgeTypeMap } from "@mui/material";

interface SingleNoteProps {
  id: string;
  updateTitle?: (state: any) => void;
  title: string;
}

const Home: React.FC<SingleNoteProps> = ({
  id,
  title,
  updateTitle: updateTitleState,
}) => {
  const router = useRouter();

  const [clientState, updateClientState] = useState({
    content: [
      {
        type: "paragraph",
        children: [{ text: "" }],
      },
    ],
    selection: null,
  });

  const updateTitle = useTitleUpdate(updateTitleState, router);

  const { note, readyState, updateNote } = useNote(id, router);

  useSync(id, clientState, updateClientState);

  const connectionStatusColor = {
    [ReadyState.CONNECTING]: "info",
    [ReadyState.OPEN]: "success",
    [ReadyState.CLOSING]: "warning",
    [ReadyState.CLOSED]: "error",
    [ReadyState.UNINSTANTIATED]: "error",
  }[readyState] as BadgeTypeMap["props"]["color"];

  return note ? (
    <>
      <Badge color={connectionStatusColor} variant="dot" sx={{ width: "100%" }}>
        <TextField
          onChange={(e) => {
            return updateTitle && updateTitle(e.target.value);
          }}
          value={title || ""}
          variant="standard"
          fullWidth={true}
          inputProps={{ style: { fontSize: 32, color: "#666" } }}
          sx={{ mb: 2 }}
        />
      </Badge>
      <Paper
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Editor
          setValue={updateNote}
          value={clientState.content}
          externalSelection={clientState.selection}
        />
      </Paper>
    </>
  ) : null;
};

export default Home;
