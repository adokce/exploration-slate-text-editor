import React, { forwardRef, useCallback, useMemo } from "react";
import {
  Editable,
  withReact,
  useSlate,
  Slate,
  useSlateStatic
} from "slate-react";
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
// import {
//   onKeyDown as linkifyOnKeyDown,
//   withLinkify
// } from "@mercuriya/slate-linkify";
// import Link from "./Link";
import isUrl from "is-url";

// const plugins = [Link()];

export default function App() {
  return <MyEditor />;
}

const MyEditor = () => {
  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const editor = useMemo(
    () =>
      withHistory(
        //
        // withLinkify(
        withReact(createEditor())
        //
        //   {
        //     // slate-linkify options
        //     renderComponent: (props) => (
        //       <a style={{ color: "red" }} {...props} />
        //     )
        //   }
        // )
      ),
    []
  );
  editor.isInline = (element) => ["link"].includes(element.type);

  const handleChange = useCallback(
    (document) => {
      console.log({ document });
      identifyLinksInTextIfAny(editor);
    },
    [editor]
  );

  return (
    <Slate editor={editor} value={initialValue} onChange={handleChange}>
      <MyToolbar />

      <Editable
        // readOnly={true}
        className={styles.editable}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        placeholder="Enter a note…"
        spellCheck
        // autoFocus
        onKeyDown={(event) => {
          // linkifyOnKeyDown(event, editor);

          for (const hotkey in HOTKEYS) {
            if (isHotkey(hotkey, event)) {
              event.preventDefault();
              const mark = HOTKEYS[hotkey];
              toggleMark(editor, mark);
            }
          }
        }}
      />
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

const initialValue = [
  {
    type: "paragraph",
    children: [
      { text: "Some text before a link." },
      {
        type: "link",
        url: "https://www.google.com",
        children: [{ text: "https://www.google.com" }]
        // children: [{ text: "Link text" }]
      }
    ]
  },
  {
    type: "paragraph",
    children: [{ text: "" }]
  }
];

const initialValue2 = [
  {
    type: "paragraph",
    children: [
      { text: "This is editable " },
      { text: "rich", bold: true },
      { text: " text, " },
      { text: "much", italic: true },
      { text: " better than a " },
      { text: "<textarea>", code: true },
      { text: "!" }
    ]
  },
  {
    type: "paragraph",
    children: [
      {
        text:
          "Since it's rich text, you can do things like turn a selection of text "
      },
      { text: "bold", bold: true },
      {
        text:
          ", or add a semantically rendered block quote in the middle of the page, like this:"
      }
    ]
  },
  {
    type: "block-quote",
    children: [{ text: "A wise quote." }]
  },
  {
    type: "paragraph",
    align: "center",
    children: [{ text: "Try it out for yourself!" }]
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

  const lastCharacter = Editor.string(
    editor,
    Editor.range(editor, startPointOfLastCharacter, cursorPoint)
  );

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

  if (!startPointOfLastCharacter) {
    return;
  }

  while (
    Editor.string(editor, Editor.range(editor, start, end)) !== " " &&
    !Point.isBefore(start, startOfTextNode)
  ) {
    end = start;
    start = Editor.before(editor, end, { unit: "character" });
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
