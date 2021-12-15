import { INote } from "../../interfaces";
import db, { counter } from "./firebase";
import { v4 as uuid } from "uuid";
import { Descendant } from "slate";

export async function getNotes(): Promise<INote[]> {
  const notes: INote[] = [];

  const notesRef = db.collection("notes");
  const snapshot = await notesRef.get();
  snapshot.forEach((doc) => {
    notes.push(doc.data() as INote);
  });

  return notes;
}

export async function getNote(id: string): Promise<INote> {
  const noteRef = db.collection("notes").doc(id);
  const doc = await noteRef.get();

  return doc.data() as INote;
}

export async function saveNote(id: string, note: INote): Promise<any> {
  console.log("id: ", id);
  if (id === "new") {
    id = uuid();

    note = {
      ...note,
      id,
      title: "",
      content: [
        {
          type: "paragraph",
          children: [{ text: "" }],
        },
      ] as unknown as Array<Descendant>,
    };
  }
  
  await db.collection("notes").doc(id).set(note, { merge: true });

  const res = await db.collection("notes").doc(id).get();

  console.log("note: ", JSON.stringify( res.data()?.content));
  
  return res.exists ? (res.data() as INote) : {};
}
