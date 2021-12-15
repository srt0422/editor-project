// @refresh reset // Fixes hot refresh errors in development https://github.com/ianstormtaylor/slate/issues/3477
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createEditor, Descendant, BaseEditor, Transforms } from "slate";
import { withHistory, HistoryEditor } from "slate-history";
import {
  handleHotkeys,
  identifyLinksInTextIfAny,
  isLinkNodeAtSelection,
  withHtml
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
  externalSelection = null,
}) => {
  const renderLeaf = useCallback((props) => <CustomLeaf {...props} />, []);
  const editor: BaseEditor & ReactEditor & HistoryEditor = useMemo(
    () => withHtml(withHistory(withReact(withLinks(createEditor())))),
    []
  );

  const [previousSelection, selection, setSelection] = useSelection(editor);

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

  const [content, setContent] = useState(value);

  useEffect(() => {
    setValue({ content, selection });
  }, [content]);

  useEffect(() => {
    if (externalSelection) {
      Transforms.setSelection(editor, externalSelection);
      setSelection(externalSelection);

      console.log("value: ", value);
      console.log("externalSelection: ", externalSelection);
    }
    setContent(value);
  }, [value]);

  const onChange = useCallback(
    (value) => {
      console.log("changed: ", value);
      setSelection(editor.selection);
      setContent(value);
      identifyLinksInTextIfAny(editor);
    },
    [setSelection, editor]
  );

  return (
    <Slate editor={editor} value={content} onChange={onChange}>
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
      />
    </Slate>
  );
};

const Element = props => {
  const { attributes, children, element } = props

  switch (element.type) {
    default:
      return <p {...attributes}>{children}</p>
    case 'quote':
      return <blockquote {...attributes}>{children}</blockquote>
    case 'code':
      return (
        <pre>
          <code {...attributes}>{children}</code>
        </pre>
      )
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>
    case 'heading-one':
      return <h1 {...attributes}>{children}</h1>
    case 'heading-two':
      return <h2 {...attributes}>{children}</h2>
    case 'heading-three':
      return <h3 {...attributes}>{children}</h3>
    case 'heading-four':
      return <h4 {...attributes}>{children}</h4>
    case 'heading-five':
      return <h5 {...attributes}>{children}</h5>
    case 'heading-six':
      return <h6 {...attributes}>{children}</h6>
    case 'list-item':
      return <li {...attributes}>{children}</li>
    case 'numbered-list':
      return <ol {...attributes}>{children}</ol>
    case 'link':
      return (
        <a href={element.url} {...attributes}>
          {children}
        </a>
      )
    case 'image':
      return <ImageElement {...props} />
  }
}

const ImageElement = ({ attributes, children, element }) => {
  const selected = useSelected()
  const focused = useFocused()
  return (
    <div {...attributes}>
      {children}
      <img
        src={element.url}
        className={css`
          display: block;
          max-width: 100%;
          max-height: 20em;
          box-shadow: ${selected && focused ? '0 0 0 2px blue;' : 'none'};
        `}
      />
    </div>
  )
}

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.code) {
    children = <code>{children}</code>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underlined) {
    children = <u>{children}</u>
  }

  if (leaf.strikethrough) {
    children = <del>{children}</del>
  }

  return <span {...attributes}>{children}</span>
}


// const PasteHtmlExample = () => {
//   const [value, setValue] = useState(initialValue)
//   const renderElement = useCallback(props => <Element {...props} />, [])
//   const renderLeaf = useCallback(props => <Leaf {...props} />, [])
//   const editor = useMemo(
//     () => withHtml(withReact(withHistory(createEditor()))),
//     []
//   )
//   console.log('editor.children', JSON.stringify(editor.children))
//   return (
//     <Slate editor={editor} value={value} onChange={value => setValue(value)}>
//       <Editable
//         renderElement={renderElement}
//         renderLeaf={renderLeaf}
//         placeholder="Paste in some HTML..."
//       />
//     </Slate>
//   )
// }
