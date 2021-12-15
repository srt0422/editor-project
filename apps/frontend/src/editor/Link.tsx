import React, { useCallback, useRef, useEffect, useState } from "react";
import { Transforms, Editor } from "slate";
import {
  useSelected,
  useFocused,
  useSlateStatic,
  ReactEditor,
} from "slate-react";
import { Link as LinkIcon, LinkOff as UnlinkIcon } from "@mui/icons-material";
import { Popover, Link as Anchor, Input, Box } from "@mui/material";
import { removeLink } from "./helpers";
import { CustomElementType } from "./CustomElement";

// import "./styles.css";

const Link: React.FC<any> = ({
  attributes,
  element,
  children,
  selectionForLink,
}) => {
  let node, path;
  const editor = useSlateStatic();

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [closedOnce, setClosedOnce] = useState<any>(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setClosedOnce(true);
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open || !closedOnce ? "simple-popover" : undefined;

  const above = Editor.above(editor, {
    at: selectionForLink,
    match: (n: any) => n.type === CustomElementType.anchor,
  });

  if (above) {
    [node, path] = above;
  }

  const [linkURL, setLinkURL] = useState(node?.href || "");

  useEffect(() => {
    if (node?.href) {
      setLinkURL(node?.href);
    }
  }, [node]);

  const onLinkURLChange = useCallback(
    (event) => {
      if (event.target.value) {
        setLinkURL(event.target.value);
      }
    },
    [setLinkURL]
  );

  useEffect(() => {
    if (linkURL) {
      Transforms.setNodes(editor, { href: linkURL } as any, { at: path });
    }
  }, [editor, linkURL, path]);

  return (
    <>
      <Anchor
        aria-describedby={id}
        {...attributes}
        href={linkURL}
        onClick={handleClick}
        target="_blank"
      >
        {children}
      </Anchor>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        style={{ padding: 15 }}
      >
        <LinkIcon />
        <Box>
          <Anchor href={linkURL} rel="noreferrer" target="_blank">
            navigate to url
          </Anchor>
        </Box>
        <Box>
          <Input defaultValue={linkURL} onChange={onLinkURLChange} />
          <button onClick={() => removeLink(editor)}>
            <UnlinkIcon />
          </button>
        </Box>
      </Popover>
    </>
  );
};

export default Link;
