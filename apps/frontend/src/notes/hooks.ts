import { useEffect, useMemo, useState } from "react";
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
export const store = syncedStore({ notes: {} } as any, yDoc);
// If you want to use GraphQL API or libs like Axios, you can create your own fetcher function.
// Check here for more examples: https://swr.vercel.app/docs/data-fetching
const fetcher = async (input: RequestInfo, init: RequestInit) => {
  const res = await fetch(input, init);

  return res.json();
};

export const useNotesList = (activeNoteId: string): any => {
  const state = useSyncedStore(store);

  const [activeNoteTitle, updateTitle] = useState();
  const [notesList, updateNotesList] = useState([]);
  
  useEffect(() => {
    loadNotes(activeNoteId, state, updateNotesList, updateTitle);
  }, [activeNoteId]);

  useEffect(() => {
    syncNoteTitle(activeNoteId, activeNoteTitle, state, updateTitle);
  }, [activeNoteId, activeNoteTitle]);

  return { title: activeNoteTitle, updateTitle, notesList };
};

function stateAndObjectAreEqual(state: any, object: any) {
  if (state && object) {
    const noteStringified = JSON.stringify(state);
    const currentNoteState = JSON.parse(noteStringified);
    
    return deepEqual(currentNoteState, object);
  }

  return Boolean(state) === Boolean(object);
}

async function loadNotes(
  activeNoteId: any,
  state: any,
  updateNotesList: any,
  updateTitle: any
) {
  const response = await fetch(`http://localhost:3001/api/notes`);

  const data = await response.json();

  if (state?.notes) {
    if (!stateAndObjectAreEqual(state.notes.list, data.notes)) {
      state.notes.list = data.notes;
    }
  }

  syncNoteTitle(activeNoteId, null, state, updateTitle);
  updateNotesList(data.notes);
}

function syncNoteTitle(activeNoteId, activeNoteTitle, state, updateTitle) {
  if (isValidNoteList(state)) {
    const activeNote = state?.notes?.list.find(
      (it: any) => it.id === activeNoteId
    );

    if (activeNote) {
      if (activeNoteTitle && typeof activeNoteTitle !== "undefined") {
        if (activeNote.title != activeNoteTitle) {
          activeNote.title = activeNoteTitle;
        }
      }

      updateTitle(activeNote.title);
    }
  }
}

export const useSync = (id, clientState, updateClientState) => {
  const state = useSyncedStore(store);
  let wsProvider: WebsocketProvider;

  useEffect(() => {
    if (id && typeof id !== "undefined") {
      wsProvider = new WebsocketProvider("ws://localhost:1234", id, yDoc, {
        connect: true
      });

      wsProvider.on("sync", async () => {
        if (isValidNoteList(state)) {
          const noteState = state.notes.list.find((it) => it.id === id);

          if (noteState) {
            const noteStringified = JSON.stringify(noteState);
            const currentNoteState = JSON.parse(noteStringified);

            if (!deepEqual(currentNoteState, clientState, true)) {
              updateClientState(currentNoteState);
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
  router: NextRouter
): { note: any; readyState: ReadyState; updateNote: any } => {
  const state = useSyncedStore(store);
  let note: any = null;

  if (isValidNoteList(state)) {
    note = state.notes.list.find((it) => it.id === id);
  }

  useEffect(() => {
    (async () => {
      if (id === "new") {
        const result = await fetch(`http://localhost:3001/api/notes/${id}`, {
          method: "PUT",
          body: "{}",
        });

        const newNote = await result.json();
        router.push(`http://localhost:3000/notes/${newNote.id}`);

        return;
      }
    })();
  }, [id]);

  return {
    note: note && JSON.parse(JSON.stringify(note)),
    readyState: 1,
    updateNote(newNote: any) {
      if (isValidNoteList(state) && note) {
        const currentNote = state.notes.list.find(
          (it: any) => it.id == note.id
        );

        const combinedNote = {
          ...currentNote,
          ...newNote,
        };

        //trigger a sync operation only if there's a difference
        if (!stateAndObjectAreEqual(currentNote, combinedNote)) {
          for (const key in combinedNote) {
            try {
              if (
                combinedNote[key] !== null &&
                typeof combinedNote[key] !== "undefined"
              ) {
                currentNote[key] = combinedNote[key];
              }
            } catch (e) {
              console.log("error key: ", key);
              console.log("error value: ", currentNote[key]);
              console.log("error client-state value: ", combinedNote[key]);
              console.log("error message: ", e.message);
              continue;
            }
          }
        }
      }
    },
  };
};

function isValidNoteList(state) {
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