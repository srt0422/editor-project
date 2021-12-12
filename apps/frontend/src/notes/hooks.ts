import { useEffect, useState } from "react";
import useSWR from "swr";
import { NotesResponse, NoteResponse } from "../../../backend/routes/notes";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { NextRouter } from "next/router";
import { Descendant } from "slate";
import { stringifyForDisplay } from "@apollo/client/utilities";

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
): void => {
  useEffect(() => {
    if (notesResults.activeNote) {
      notesResults.activeNote.title = activeNoteTitle;

      updateResults(notesResults);
    }
  }, [activeNoteTitle]);
  // console.log("useNotesList: ", activeNoteId, activeNoteTitle);
  useEffect(() => {
    async function loadNotes() {
      const response = await fetch(`http://localhost:3001/api/notes`);

      const data = await response.json();

      const results = {
        notesList: data?.notes ?? [],
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

  // const { data, error } = useSWR<NotesResponse>(
  //   "http://localhost:3001/api/notes",
  //   fetcher
  // );
};

export const useNote = (
  id: string,
  router: NextRouter
): { note: INote; readyState: ReadyState } => {
  const [note, updateNote] = useState();

  const { readyState, lastMessage, sendMessage } = useWebSocket(
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
          updateNote(JSON.parse(e.data));
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
    note, //: (lastMessage && typeof lastMessage.data === "string") ? (JSON.parse(lastMessage.data) as NoteResponse) : note,
    readyState,
  };
};

export const useContentUpdate = (content: Descendant[], router: NextRouter) => {
  const id = router.query.id;

  useEffect(() => {
    // console.log("id: ", id);
    // console.log("content: ", content);
    if (stringIsNotEmptyOrNull(id)) {
      fetch(`http://localhost:3001/api/notes/${id}`, {
        method: "PUT",
        body: JSON.stringify({ id, content }),
        headers: {
          "Content-type": "application/json; charset=UTF-8", // Indicates the content
        },
      });
    }
  }, [content, id]);
};

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