import React, { useState, useMemo } from "react";
import {
  Toolbar,
  Typography,
  Drawer,
  Divider,
  Box,
  Container,
  Fab,
  IconButton,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { buttons } from "../styles";
import { NotesList } from "../notes";
import { useNotesList, useTitleUpdate } from "../notes/hooks";
import { useRouter } from "next/router";

const drawerWidth = 240;

interface InterfaceProps {
  activeNoteId?: string;
  currentTitle?: string;
}

const Interface: React.FC<InterfaceProps> = ({ activeNoteId, children }) => {
  const router = useRouter();

  let {title, updateTitle, notesList} = useNotesList(
    activeNoteId as string
  );

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { title, updateTitle });
    }
    return child;
  });

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar>
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{ flexGrow: 1 }}
          >
            Notes
          </Typography>
        </Toolbar>
        <Divider />
        <NotesList
          notesList={notesList}
          activeNoteTitle={title}
          updateTitle={updateTitle}
        />
        <Divider />
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: "100vh",
          backgroundColor: "#eee",
          overflow: "auto",
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {childrenWithProps}
          <Fab
            onClick={() => router.push("/notes/new")}
            color="primary"
            sx={buttons.fixedButton as any}
          >
            <Add />
          </Fab>
        </Container>
      </Box>
    </Box>
  );
};

export default Interface;