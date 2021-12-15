import React from "react";
import Link from "next/link";
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Assignment as AssignmentIcon } from "@mui/icons-material";
import { useNotesList } from "./hooks";

interface NotesListProps {
  notesList: any;
  activeNoteId?: string;
  updateTitle?: React.Dispatch<React.SetStateAction<unknown>>;
  activeNoteTitle?: string;
}

const NotesList: React.FC<NotesListProps> = ({
  notesList,
  activeNoteId,
  activeNoteTitle,
  updateTitle,
}) => {
 
  return (
    <List>
      {notesList?.map((note: any) => (
        <Link href={`/notes/${note.id}`} key={note.id}>
          <ListItemButton
            selected={note.id === activeNoteId}
            onClick={() => {
              return updateTitle && updateTitle(note.title as unknown)
            }}
          >
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            <ListItemText
              primary={note.id === activeNoteId ? activeNoteTitle : note.title}
            />
          </ListItemButton>
        </Link>
      ))}
    </List>
  );
};

export default NotesList;
