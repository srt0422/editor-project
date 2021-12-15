import {
  Editor,
  Transforms,
  Element as SlateElement,
  EditorInterface,
  Path,
  Range,
  Text,
  Point,
} from "slate";
import { ReactEditor } from "slate-react";
import isHotkey from "is-hotkey";
import { KeyboardEvent } from "react";
import { CustomElementType } from "./CustomElement";
import { CustomText } from "./CustomLeaf";
import isUrl from "is-url";

const LIST_TYPES = ["numbered-list", "bulleted-list"];

export const toggleBlock = (
  editor: Editor,
  format: CustomElementType
): void => {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      LIST_TYPES.includes(
        !Editor.isEditor(n) && SlateElement.isElement(n) && (n.type as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      ),
    split: true,
  });
  const newProperties: Partial<SlateElement> = {
    type: isActive
      ? CustomElementType.paragraph
      : isList
      ? CustomElementType.listItem
      : format,
  };
  Transforms.setNodes(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

export const toggleMark = (editor: Editor, format: keyof CustomText): void => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

export const isBlockActive = (
  editor: Editor,
  format: CustomElementType
): boolean => {
  let match;

  try {
    [match] = Editor.nodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    });
  } catch (e) {
    match = false;
  }

  return !!match;
};

export const isMarkActive = (
  editor: Editor,
  format: keyof CustomText
): boolean => {
  let marks;

  try {
    marks = Editor.marks(editor);
  } catch (e) {
    return false;
  }

  return marks ? format in marks === true : false;
};

const HOTKEYS: Record<string, keyof CustomText> = {
  "mod+b": "bold",
  "mod+i": "italic",
  "mod+u": "underline",
  "mod+`": "code",
};

export const handleHotkeys =
  (editor: Editor) =>
  (event: KeyboardEvent<HTMLDivElement>): void => {
    for (const hotkey in HOTKEYS) {
      if (isHotkey(hotkey, event)) {
        event.preventDefault();
        const mark = HOTKEYS[hotkey];
        toggleMark(editor, mark);
      }
    }
  };

// link helpers
// source: https://dev.to/koralarts/slatejs-adding-images-and-links-2g93
export const createLinkNode = (href: string, text: string) => ({
  type: CustomElementType.anchor,
  href,
  children: [{ text }],
});

export const removeLink = (editor: Editor, opts = {}) => {
  Transforms.unwrapNodes(editor, {
    ...opts,
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      n.type === CustomElementType.anchor,
  });
};

export const insertLink = (editor: Editor) => {
  const { selection } = editor;
  const link = createLinkNode(null, "New Link");

  ReactEditor.focus(editor);

  if (selection) {
    const [parentNode, parentPath] = Editor.parent(
      editor,
      selection.focus?.path
    );

    // Remove the Link node if we're inserting a new link node inside of another
    // link.
    if ((<any>parentNode).type === CustomElementType.anchor) {
      removeLink(editor);
    }

    if (editor.isVoid(<any>parentNode)) {
      // Insert the new link after the void node
      Transforms.insertNodes(editor, createParagraphNode([link]), {
        at: Path.next(parentPath),
        select: true,
      });
    } else if (Range.isCollapsed(selection)) {
      // Insert the new link in our last known location
      Transforms.insertNodes(editor, <any>link, { select: true });
    } else {
      // Wrap the currently selected range of text into a Link
      Transforms.wrapNodes(editor, <any>link, { split: true });
      // Remove the highlight and move the cursor to the end of the highlight
      Transforms.collapse(editor, { edge: "end" });
    }
  } else {
    // Insert the new link node at the bottom of the Editor when selection
    // is falsey
    Transforms.insertNodes(editor, createParagraphNode([link]));
  }
};

export const createParagraphNode = (children: any = [{ text: "" }]): any => ({
  type: "paragraph",
  children,
});

export function hasActiveLinkAtSelection(editor) {
  return isLinkNodeAtSelection(editor, editor.selection);
}

// export function toggleLinkAtSelection(editor) {
//   if(editor.selection == null) {
//     return;
//   }

//   if (hasActiveLinkAtSelection(editor)) {
//     Transforms.unwrapNodes(editor, {
//       match: (n) => SlateElement.isElement(n) && n.type === "link",
//     });
//   } else {
//     const isSelectionCollapsed =
//       editor.selection == null || Range.isCollapsed(editor.selection);
//     if (isSelectionCollapsed) {
//       createLinkForRange(editor, null, "link", "", true /*isInsertion*/);
//     } else {
//       createLinkForRange(editor, editor.selection, "", "", false);
//     }
//   }
// }

export function isLinkNodeAtSelection(editor: any, selection: any): any {
  if (selection == null) {
    return false;
  }

  try {
    return (
      Editor.above(editor, {
        at: selection,
        match: (n) => n.type === CustomElementType.anchor,
      }) != null
    );
  } catch (e) {
    return false;
  }
}

export function identifyLinksInTextIfAny(editor: any): any {
  // if selection is not collapsed, we do not proceed with the link detection.
  if (editor.selection == null || !Range.isCollapsed(editor.selection)) {
    return;
  }

  const [node] = Editor.parent(editor, editor.selection);
  // if we are already inside a link, exit early.
  if (node.type === "link") {
    return;
  }

  const [currentNode, currentNodePath] = Editor.node(editor, editor.selection);
  if (!Text.isText(currentNode)) {
    return;
  }

  let [start] = Range.edges(editor.selection);
  const cursorPoint = start;

  const startPointOfLastCharacter = Editor.before(editor, editor.selection, {
    unit: "character",
  });

  if (!startPointOfLastCharacter) return;

  let lastCharacter = startPointOfLastCharacter
    ? Editor.string(
        editor,
        Editor.range(editor, <any>startPointOfLastCharacter, cursorPoint)
      )
    : " ";

  if (lastCharacter !== " ") {
    return;
  }

  let end = startPointOfLastCharacter;
  start = <any>Editor.before(editor, <any>end, {
    unit: "character",
  });

  const startOfTextNode = Editor.point(editor, currentNodePath, {
    edge: "start",
  });

  if (
    !editor ||
    !start ||
    !end ||
    typeof start === "undefined" ||
    typeof end === "undefined"
  ) {
    return;
  }

  console.log("editor: ", editor, start, end);

  lastCharacter = Editor.string(editor, Editor.range(editor, start, end));
  //TODO: add some error handling around this for the sake of edge cases
  while (
    lastCharacter != " " &&
    !Point.isBefore(start, startOfTextNode) &&
    editor &&
    start &&
    end &&
    typeof start !== "undefined" &&
    typeof end !== "undefined"
  ) {
    try {
      end = start;
      start = Editor.before(editor, end, { unit: "character" }) as any;
      lastCharacter = Editor.string(editor, Editor.range(editor, start, end));
    } catch (e) {
      break;
    }
  }

  const lastWordRange = Editor.range(editor, end, startPointOfLastCharacter);
  const lastWord = Editor.string(editor, lastWordRange);

  if (isUrl(lastWord)) {
    Promise.resolve().then(() =>
      createLinkForRange(editor, lastWordRange, lastWord, lastWord)
    );
  }
}

function createLinkForRange(editor, range, linkText, linkURL, isInsertion) {
  isInsertion
    ? Transforms.insertNodes(
        editor,
        {
          type: CustomElementType.anchor,
          url: linkURL,
          children: [{ text: linkText }],
        },
        range != null ? { at: range } : undefined
      )
    : Transforms.wrapNodes(
        editor,
        {
          type: CustomElementType.anchor,
          url: linkURL,
          children: [{ text: linkText }],
        },
        { split: true, at: range }
      );
}
