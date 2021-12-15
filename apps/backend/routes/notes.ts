import express, { RequestHandler, Response } from "express";
import { WebsocketRequestHandler } from "express-ws";
import { Descendant } from "slate";
import { INote } from "../../../interfaces";
import { NOTE_1, NOTE_2 } from "../fixtures/notes";
import { getNotes, getNote, saveNote } from "../functions";
import { slateNodesToInsertDelta } from "@slate-yjs/core";
import * as Y from "yjs";
import { syncedStore, getYjsValue } from "@syncedstore/core";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getYDoc } = require("y-websocket/bin/utils");

// Patch `express.Router` to support `.ws()` without needing to pass around a `ws`-ified app.
// https://github.com/HenningM/express-ws/issues/86
// eslint-disable-next-line @typescript-eslint/no-var-requires
const patch = require("express-ws/lib/add-ws-method");
patch.default(express.Router);

const router = express.Router();

export interface NotesResponse {
  notes: Array<{
    id: string;
    title: string;
  }>;
}

export interface NoteResponse {
  id: string;
  title: string;
  content: Array<Descendant>;
}

const notesHandler: RequestHandler = async (
  _req,
  res: Response<NotesResponse>
) => {
  res.json({
    notes: await getNotes(),
  } as NotesResponse);
};

const noteHandler: WebsocketRequestHandler = (ws, req) => {

  ws.on("message", async function (msg) {
    ws.send(JSON.stringify(await getNote(req.params.id)));
  });
};

const saveNoteHandler: RequestHandler = async (
  req,
  res: Response<NotesResponse>
) => {
  res.json(await saveNote(req.params.id, req.body as INote));
};

router.get("/", notesHandler);
router.put("/:id", saveNoteHandler);
router.ws("/:id", noteHandler);

export default router;

// const notesHandler = async () => {
//   return {
//     notes: await getNotes(),
//   };
// };

// const noteHandler: WebsocketRequestHandler = async (ws, req) => {
//   return await getNote(req.params.id);
// };

// export default {
//   getNote: noteHandler,
//   getNotes: notesHandler,
// };
