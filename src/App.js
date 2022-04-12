import React, { forwardRef, useCallback, useMemo, useState } from "react";
import { Editable, withReact, useSlate, Slate } from "slate-react";
import {
  Editor,
  Transforms,
  createEditor,
  Element as SlateElement,
  Range,
  Text,
  Point
} from "slate";
import { withHistory } from "slate-history";
import isHotkey from "is-hotkey";
import styles from "./app.module.scss";
import cn from "classnames";
import isUrl from "is-url";
import { jsx } from "slate-hyperscript";

export default function App() {
  return <MyEditor />;
}

const MyEditor = () => {
  const [isEditing, setIsEditing] = useState(false);
  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const editor = useMemo(
    () => withHtml(withHistory(withReact(createEditor()))),
    []
  );
  editor.isInline = (element) => ["link"].includes(element.type);

  const handleChange = useCallback(
    (document) => {
      console.log({ document: JSON.stringify(document) });
      identifyLinksInTextIfAny(editor);
    },
    [editor]
  );

  return (
    <Slate editor={editor} value={initialValue} onChange={handleChange}>
      <MyToolbar />

      <Editable
        readOnly={!isEditing}
        className={styles.editable}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        placeholder="Enter a note…"
        spellCheck
        // autoFocus
        onKeyDown={(event) => {
          for (const hotkey in HOTKEYS) {
            if (isHotkey(hotkey, event)) {
              event.preventDefault();
              const mark = HOTKEYS[hotkey];
              toggleMark(editor, mark);
            }
          }
        }}
      />

      <button
        type="button"
        onClick={() => {
          setIsEditing((value) => !value);
        }}
      >
        Toggle edit
      </button>
    </Slate>
  );
};

const MyToolbar = () => {
  return (
    <Toolbar>
      <MarkButton format="bold" icon="format_bold" />
      <MarkButton format="italic" icon="format_italic" />
      <MarkButton format="underline" icon="format_underlined" />
      {/* <MarkButton format="code" icon="code" /> */}
      {/* <BlockButton format="heading-one" icon="looks_one" /> */}
      {/* <BlockButton format="heading-two" icon="looks_two" /> */}
      {/* <BlockButton format="block-quote" icon="format_quote" /> */}
      <BlockButton format="numbered-list" icon="format_list_numbered" />
      <BlockButton format="bulleted-list" icon="format_list_bulleted" />
      {/* <BlockButton format="left" icon="format_align_left" /> */}
      {/* <BlockButton format="center" icon="format_align_center" /> */}
      {/* <BlockButton format="right" icon="format_align_right" /> */}
      {/* <BlockButton format="justify" icon="format_align_justify" /> */}
    </Toolbar>
  );
};

export const Button = React.forwardRef(
  ({ className, active, reversed, ...props }, ref) => (
    <span
      {...props}
      ref={ref}
      className={cn(className, styles.button, {
        reversed,
        active
      })}
    />
  )
);

const BlockButton = ({ format, icon }) => {
  const editor = useSlate();
  return (
    <Button
      active={isBlockActive(
        editor,
        format
        // TEXT_ALIGN_TYPES.includes(format) ? "align" : "type"
      )}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};

// This has something extra
const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(
    editor,
    format
    // TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type'
  );
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type),
    // && !TEXT_ALIGN_TYPES.includes(format),
    split: true
  });
  let newProperties;
  if (
    false
    // TEXT_ALIGN_TYPES.includes(format)
  ) {
    newProperties = {
      align: isActive ? undefined : format
    };
  } else {
    newProperties = {
      type: isActive ? "paragraph" : isList ? "list-item" : format
    };
  }
  Transforms.setNodes(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

// This has something extra
const isBlockActive = (editor, format, blockType = "type") => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n[blockType] === format
    })
  );

  return !!match;
};

const MarkButton = ({ format, icon }) => {
  const editor = useSlate();
  return (
    <Button
      active={isMarkActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};

export const Menu = forwardRef(({ className, ...props }, ref) => (
  <div {...props} ref={ref} className={cn(className, styles.menu)} />
));

export const Toolbar = forwardRef(({ className, ...props }, ref) => (
  <Menu {...props} ref={ref} className={cn(className, styles.toolbar)} />
));

export const Icon = React.forwardRef(({ className, ...props }, ref) => (
  <span
    {...props}
    ref={ref}
    className={cn(
      "material-icons", // ?
      className,
      styles.icon
    )}
  />
));

const Element = ({ attributes, children, element }) => {
  // const editor = useSlateStatic();
  const style = { textAlign: element.align };

  switch (element.type) {
    // case "link":
    //   return editor.linkElementType({ attributes, children, element });
    case "link":
      return (
        <a
          //
          {...attributes}
          href={element.url}
          style={{ color: "red" }}
          target="_blank"
          rel="noreferrer"
        >
          {children}
        </a>
      );
    case "block-quote":
      return (
        <blockquote style={style} {...attributes}>
          {children}
        </blockquote>
      );
    case "bulleted-list":
      return (
        <ul style={style} {...attributes}>
          {children}
        </ul>
      );
    case "list-item":
      return (
        <li style={style} {...attributes}>
          {children}
        </li>
      );
    case "numbered-list":
      return (
        <ol style={style} {...attributes}>
          {children}
        </ol>
      );
    default:
      return (
        <p style={style} {...attributes}>
          {children}
        </p>
      );
  }
};

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const initialValue1 = [
  {
    type: "paragraph",
    children: [{ text: "" }]
  }
];

const initialValue2 = [
  {
    type: "paragraph",
    children: [
      { text: "This is editable text where you can type links in " },
      { text: "something something haha", bold: true },
      { text: " and more something yeah, " },
      { text: "lalallalalala joj joj", italic: true },
      { text: " super je ovo " }
    ]
  },
  {
    type: "paragraph",
    children: [
      {
        text: "Soomething is here also  "
      },
      { text: "bold", bold: true },
      {
        text: ", oooo aaa eee aaeoeaoao"
      }
    ]
  },
  {
    type: "paragraph",
    children: [
      { text: "Try it out for yourself! " },
      {
        type: "link",

        url: "https://google.com",
        text: "https://google.com "
      }
    ]
  }
];

const initialValue = [
  {
    type: "paragraph",
    children: [
      { text: "This is editable text where you can type links in " },
      { text: "something something haha", bold: true },
      { text: " and more something yeah, " },
      { text: "lalallalalala joj joj", italic: true },
      { text: " super je ovo " }
    ]
  },
  {
    type: "paragraph",
    children: [
      { text: "Soomething is here also  " },
      { text: "bold", bold: true },
      { text: ", oooo aaa eee aaeoeaoao" }
    ]
  },
  {
    type: "paragraph",
    children: [
      { text: "Try it out for yourself! " },
      {
        type: "link",
        url: "https://google.com",
        children: [
          {
            type: "link",
            url: "https://google.com",
            text: "https://google.com"
          }
        ]
      },
      { type: "link", url: "https://google.com", text: " " }
    ]
  }
];

const HOTKEYS = {
  "mod+b": "bold",
  "mod+i": "italic",
  "mod+u": "underline",
  "mod+`": "code"
};

const LIST_TYPES = ["numbered-list", "bulleted-list"];

export function identifyLinksInTextIfAny(editor) {
  // if selection is not collapsed, we do not proceed with the link
  // detection
  if (editor.selection == null || !Range.isCollapsed(editor.selection)) {
    return;
  }

  const [node, _] = Editor.parent(editor, editor.selection);

  // if we are already inside a link, exit early.
  if (node.type === "link") {
    return;
  }

  const [currentNode, currentNodePath] = Editor.node(editor, editor.selection);

  // if we are not inside a text node, exit early.
  if (!Text.isText(currentNode)) {
    return;
  }

  let [start] = Range.edges(editor.selection);
  const cursorPoint = start;

  const startPointOfLastCharacter = Editor.before(editor, editor.selection, {
    unit: "character"
  });

  // if (!startPointOfLastCharacter) {
  //   return;
  // }
  let lastCharacter = null;
  try {
    lastCharacter = Editor.string(
      editor,
      Editor.range(editor, startPointOfLastCharacter, cursorPoint)
    );
  } catch (e) {}

  if (lastCharacter !== " ") {
    return;
  }

  let end = startPointOfLastCharacter;
  start = Editor.before(editor, end, {
    unit: "character"
  });

  const startOfTextNode = Editor.point(editor, currentNodePath, {
    edge: "start"
  });

  while (
    Editor.string(editor, Editor.range(editor, start, end)) !== " " &&
    !Point.isBefore(start, startOfTextNode)
  ) {
    end = start;

    const lala = Editor.before(editor, end, { unit: "character" });

    if (!lala) {
      continue;
    }

    start = lala;
  }

  const lastWordRange = Editor.range(editor, end, startPointOfLastCharacter);
  const lastWord = Editor.string(editor, lastWordRange);

  if (isUrl(lastWord)) {
    Promise.resolve().then(() => {
      Transforms.wrapNodes(
        editor,
        { type: "link", url: lastWord, children: [{ text: lastWord }] },
        { split: true, at: lastWordRange }
      );
    });
  }
}

const withHtml = (editor) => {
  const { insertData, isInline, isVoid } = editor;

  editor.isInline = (element) => {
    return element.type === "link" ? true : isInline(element);
  };

  editor.isVoid = (element) => {
    return element.type === "image" ? true : isVoid(element);
  };

  editor.insertData = (data) => {
    const html = data.getData("text/html");

    if (html) {
      const parsed = new DOMParser().parseFromString(html, "text/html");
      const fragment = deserialize(parsed.body);
      Transforms.insertFragment(editor, fragment);
      return;
    }

    insertData(data);
  };

  return editor;
};

export const deserialize = (el) => {
  if (el.nodeType === 3) {
    return el.textContent;
  } else if (el.nodeType !== 1) {
    return null;
  } else if (el.nodeName === "BR") {
    return "\n";
  }

  const { nodeName } = el;
  let parent = el;

  if (
    nodeName === "PRE" &&
    el.childNodes[0] &&
    el.childNodes[0].nodeName === "CODE"
  ) {
    parent = el.childNodes[0];
  }
  let children = Array.from(parent.childNodes).map(deserialize).flat();

  if (children.length === 0) {
    children = [{ text: "" }];
  }

  if (el.nodeName === "BODY") {
    return jsx("fragment", {}, children);
  }

  if (ELEMENT_TAGS[nodeName]) {
    const attrs = ELEMENT_TAGS[nodeName](el);
    return jsx("element", attrs, children);
  }

  if (TEXT_TAGS[nodeName]) {
    const attrs = TEXT_TAGS[nodeName](el);
    return children.map((child) => jsx("text", attrs, child));
  }

  return children;
};

const ELEMENT_TAGS = {
  A: (el) => ({ type: "link", url: el.getAttribute("href") }),
  // BLOCKQUOTE: () => ({ type: "quote" }),
  // H1: () => ({ type: "heading-one" }),
  // H2: () => ({ type: "heading-two" }),
  // H3: () => ({ type: "heading-three" }),
  // H4: () => ({ type: "heading-four" }),
  // H5: () => ({ type: "heading-five" }),
  // H6: () => ({ type: "heading-six" }),
  // IMG: (el) => ({ type: "image", url: el.getAttribute("src") }),
  LI: () => ({ type: "list-item" }),
  OL: () => ({ type: "numbered-list" }),
  P: () => ({ type: "paragraph" }),
  // PRE: () => ({ type: "code" }),
  UL: () => ({ type: "bulleted-list" })
};

const TEXT_TAGS = {
  // CODE: () => ({ code: true }),
  // DEL: () => ({ strikethrough: true }),
  EM: () => ({ italic: true }),
  I: () => ({ italic: true }),
  S: () => ({ strikethrough: true }),
  STRONG: () => ({ bold: true }),
  U: () => ({ underline: true })
};
