import React, { MouseEventHandler } from "react";
import { Editor } from "slate";
import { useSlate } from "slate-react";
import { Button as BaseButton, IconButton, Box } from "@mui/material";
import {
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatUnderlined as FormatUnderlinedIcon,
  Code as CodeIcon,
  FormatQuote as QuoteIcon,
  FormatListNumbered as FormatListNumberedIcon,
  FormatListBulleted as FormatListBulletedIcon,
  Link as AnchorIcon,
} from "@mui/icons-material";
import {
  toggleBlock,
  toggleMark,
  isBlockActive,
  isMarkActive,
  insertLink,
  hasActiveLinkAtSelection,
  removeLink
} from "./helpers";
import { CustomElementType } from "./CustomElement";
import { CustomText } from "./CustomLeaf";

interface ButtonProps {
  active: boolean;
  onMouseDown?: MouseEventHandler<HTMLButtonElement>;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

const Button: React.FC<ButtonProps> = ({
  active,
  children,
  onMouseDown,
  onClick,
}) => (
  <BaseButton
    onMouseDown={onMouseDown}
    onClick={onClick}
    style={{
      backgroundColor: active ? "#333" : "white",
      color: active ? "white" : "#333",
      border: "1px solid #eee",
    }}
  >
    {children}
  </BaseButton>
);

const Icon: React.FC = ({ children }) => <span>{children}</span>;

interface BlockButtonProps {
  format: CustomElementType;
  icon: string | any;
}

const BlockButton: React.FC<BlockButtonProps> = ({ format, icon }) => {
  const editor = useSlate();
  return (
    <Button
      active={isBlockActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
    >
      {icon}
    </Button>
  );
};

interface MarkButtonProps {
  format: keyof CustomText;
  icon: string | any;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

const MarkButton: React.FC<MarkButtonProps> = ({ format, icon, onClick }) => {
  const editor = useSlate();
  return (
    <Button
      active={isMarkActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
      onClick={onClick}
    >
      {icon}
    </Button>
  );
};

const LinkButton: React.FC<MarkButtonProps> = ({ format, icon, onClick }) => {
  const editor = useSlate();
  return (
    <Button
      active={hasActiveLinkAtSelection(editor)}
      onClick={onClick}
    >
      {icon}
    </Button>
  );
};

const handleLinkClick = (editor: Editor) => {
  
  if (hasActiveLinkAtSelection(editor)) {
    removeLink(editor);
  } else {
    insertLink(editor);
  }
};

export const EditorToolbar: React.FC = () => {
  const editor = useSlate();
  return (
    <Box>
      <MarkButton format="bold" icon={<FormatBoldIcon />} />
      <MarkButton format="italic" icon={<FormatItalicIcon />} />
      <MarkButton format="underline" icon={<FormatUnderlinedIcon />} />
      <MarkButton format="code" icon={<CodeIcon />} />
      <BlockButton format={CustomElementType.headingOne} icon="h1" />
      <BlockButton format={CustomElementType.headingTwo} icon="h2" />
      <BlockButton format={CustomElementType.blockQuote} icon={<QuoteIcon />} />
      <BlockButton
        format={CustomElementType.numberedList}
        icon={<FormatListNumberedIcon />}
      />
      <BlockButton
        format={CustomElementType.bulletedList}
        icon={<FormatListBulletedIcon />}
      />
      <LinkButton
        format={CustomElementType.anchor}
        icon={<AnchorIcon />}
        onClick={() => handleLinkClick(editor)}
      />
    </Box>
  );
};
