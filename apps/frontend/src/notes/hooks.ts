import { useEffect, useState } from "react";
import useSWR from "swr";
import { NotesResponse, NoteResponse } from "../../../backend/routes/notes";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { NextRouter } from "next/router";
import { Descendant } from "slate";
import deepEqual from "deep-equal";
import { stringifyForDisplay } from "@apollo/client/utilities";
import {
  syncedStore,
  getYjsValue,
  observeDeep,
  areSame,
} from "@syncedstore/core";
import { useSyncedStore } from "@syncedstore/react";
import { WebsocketProvider } from "y-websocket";
import * as awarenessProtocol from "y-protocols/awareness";
import * as Y from "yjs";
import { parse } from "graphql";

export const yDoc = new Y.Doc();
export const store = syncedStore({ notes: {} }, yDoc);
// If you want to use GraphQL API or libs like Axios, you can create your own fetcher function.
// Check here for more examples: https://swr.vercel.app/docs/data-fetching
const fetcher = async (input: RequestInfo, init: RequestInit) => {
  const res = await fetch(input, init);

  return res.json();
};

export const useNotesList = (
  notesResults: any,
  updateResults: any,
  activeNoteId: string,
  activeNoteTitle: string,
  updateTitle: any
): any => {
  const state = useSyncedStore(store);
  useEffect(() => {
    if (notesResults.activeNote) {
      notesResults.activeNote.title = activeNoteTitle;

      updateResults(notesResults);
    }
  }, [activeNoteTitle]);

  useEffect(() => {
    async function loadNotes() {
      const response = await fetch(`http://localhost:3001/api/notes`);

      const data = await response.json();

      state.notes.list = data.notes;
      console.log("use list: ", data.notes);
      const results = {
        notesList: data.notes ?? [],
        activeNote: data.notes.find((it: any) => it.id === activeNoteId),
        isLoading: !response.ok && !data,
        isError: !response.ok,
      };

      updateResults(results);

      if (results.activeNote) {
        updateTitle(results.activeNote.title);
      }
    }

    loadNotes();
  }, [activeNoteId, activeNoteTitle]);

  return state;
};

export const useSync = (id, clientState, updateClientState) => {
  const state = useSyncedStore(store);
  let wsProvider: WebsocketProvider;

  useEffect(() => {
    // Start a y-websocket server, e.g.: HOST=localhost PORT=1234 npx y-websocket-server
    if (id && typeof id !== "undefined") {
      wsProvider = new WebsocketProvider("ws://localhost:1234", id, yDoc, {
        connect: true,
      });

      wsProvider.on("sync", async () => {
        console.log("start sync");
        if (isValidNoteList(id, state)) {
          const noteState = state.notes.list.find((it) => it.id === id);

          if (noteState) {
            const noteStringified = JSON.stringify(noteState);
            const currentNoteState = JSON.parse(noteStringified);

            if (!deepEqual(currentNoteState.content, clientState.content)) {
              updateClientState(currentNoteState);
              console.log("new client state: ", currentNoteState);
            }

            await fetch(`http://localhost:3001/api/notes/${id}`, {
              method: "PUT",
              body: noteStringified,
              headers: {
                "Content-type": "application/json; charset=UTF-8", // Indicates the content
              },
            });
          }
        }
      });
    }

    return () => wsProvider.disconnect();
  });
};

export const useNote = (
  id: string,
  router: NextRouter,
  updateClientState: any
): { note: any; readyState: ReadyState; updateNote: any } => {
  const state = useSyncedStore(store);
  let note: any = null;

  if (isValidNoteList(id, state)) {
    note = state.notes.list.find((it) => it.id === id);
  }

  const { readyState, lastMessage, sendMessage, getWebSocket } = useWebSocket(
    `ws://localhost:3001/api/notes/${id}`,
    {
      onMessage: async (e) => {
        let updatedNote;

        if (e.data && typeof e.data === "string") {
          updatedNote = JSON.parse(e.data);
        }

        if (id === "new") {
          const result = await fetch(`http://localhost:3001/api/notes/${id}`, {
            method: "PUT",
            body: "{}",
          });

          const newNote = await result.json();
          router.push(`http://localhost:3000/notes/${newNote.id}`);

          return;
        }

        if (stringIsNotEmptyOrNull(e.data)) {
          const noteResult = JSON.parse(e.data);

          if (state?.notes?.list) {
            let index = state.notes.list.findIndex((it) => it.id === id);

            state.notes.list.splice(index, 1, noteResult);
          }

          updateClientState(noteResult);
        }
      },
    }
  );

  // Send a message when ready on first load
  useEffect(() => {
    if (readyState === ReadyState.OPEN && lastMessage === null) {
      sendMessage("");
    }
  }, [readyState, lastMessage]);

  return {
    note:
      lastMessage && typeof lastMessage.data === "string"
        ? (JSON.parse(lastMessage.data) as NoteResponse)
        : note && JSON.parse(JSON.stringify(note)),
    readyState,
    updateNote(newNote: any) {
      if (state?.notes?.list) {
        const index = state.notes.list.indexOf(note);
        state.notes.list.splice(index, 1, { ...note, ...newNote });
      }
    },
  };
};

function isValidNoteList(id, state) {
  return Boolean(state?.notes?.list);
}

function getNoteState(id, state) {
  if (state?.notes?.list) {
    return state.notes.list.find((it) => it.id === id);
  }

  return null;
}

export const useTitleUpdate = (updateTitle: any, router: NextRouter) => {
  const id = router.query.id;

  const { readyState, lastMessage, sendMessage } = useWebSocket(
    `ws://localhost:3001/api/notes/${id}`
  );

  return async function persistTitleChanges(title: string) {
    updateTitle(title);
    if (stringIsNotEmptyOrNull(id)) {
      await fetch(`http://localhost:3001/api/notes/${id}`, {
        method: "PUT",
        body: JSON.stringify({ id, title }),
        headers: {
          "Content-type": "application/json; charset=UTF-8", // Indicates the content
        },
      });

      sendMessage(" ");
    }
  };
};

function stringIsNotEmptyOrNull(value: unknown) {
  return value && typeof value === "string" && value.length > 0;
}
