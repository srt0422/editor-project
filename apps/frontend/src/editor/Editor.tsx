// @refresh reset // Fixes hot refresh errors in development https://github.com/ianstormtaylor/slate/issues/3477
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createEditor, Descendant, BaseEditor, Transforms } from "slate";
import { withHistory, HistoryEditor } from "slate-history";
import {
  handleHotkeys,
  identifyLinksInTextIfAny,
  isLinkNodeAtSelection,
} from "./helpers";
import withLinks from "./plugins/withLinks";
import { Editable, withReact, Slate, ReactEditor } from "slate-react";
import { EditorToolbar } from "./EditorToolbar";
import { CustomElement } from "./CustomElement";
import { CustomLeaf, CustomText } from "./CustomLeaf";
import { useSelection } from "./hooks";

// Slate suggests overwriting the module to include the ReactEditor, Custom Elements & Text
// https://docs.slatejs.org/concepts/12-typescript
declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

interface EditorProps {
  placeholder?: string;
  setValue: any;
  value: any;
  externalSelection?: any;
}

export const Editor: React.FC<EditorProps> = ({
  placeholder,
  setValue,
  value = [],
  // externalSelection = null,
}) => {
  const renderLeaf = useCallback((props) => <CustomLeaf {...props} />, []);
  const editor: BaseEditor & ReactEditor & HistoryEditor = useMemo(
    () => withHistory(withReact(withLinks(createEditor()))),
    []
  );

  const [previousSelection, selection, setSelection] = useSelection(editor);

  // we update selection here because Slate fires an onChange even on pure selection change.
  // const onChangeLocal = useCallback(
  //   (value) => {
  //     setSelection(editor.selection);
  //     setValue({ content: value, selection: editor.selection });
  //     identifyLinksInTextIfAny(editor);
  //   },
  //   [setSelection, editor]
  // );

  let selectionForLink: any = null;

  try {
    if (isLinkNodeAtSelection(editor, selection)) {
      selectionForLink = selection;
    } else if (
      selection == null &&
      isLinkNodeAtSelection(editor, previousSelection)
    ) {
      selectionForLink = previousSelection;
    }
  } catch (e) {
    console.log("selection error: ", e.message);
  }

  const renderElement = useCallback(
    (props) => <CustomElement {...props} selectionForLink={selectionForLink} />,
    []
  );

  // useMemo(() => {
  //   if (externalSelection) {
  //     console.log("set selection");
  //     // editor.selection

  //     Transforms.setSelection(editor, externalSelection);
  //   }
  // }, [externalSelection?.focus?.offset, externalSelection?.anchor?.offset]);

  const [content, setContent] = useState(value);

  useEffect(() => {
    setValue({ content, selection: editor.selection });
  }, [content]);

  useEffect(() => {
    setContent(value);
  }, [value]);

  return (
    <Slate
      editor={editor}
      value={content}
      onChange={(value) => {
        setSelection(editor.selection);
        setContent(value);
        identifyLinksInTextIfAny(editor);
      }}
    >
      <EditorToolbar />
      <Editable
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        placeholder={placeholder}
        onKeyDown={handleHotkeys(editor)}
        // The dev server injects extra values to the editr and the console complains
        // so we override them here to remove the message
        autoCapitalize="false"
        autoCorrect="false"
        spellCheck="false"
        autoFocus={false}
      />
    </Slate>
  );
};
