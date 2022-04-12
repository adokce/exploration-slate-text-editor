import Linkify from "linkify-it";

const linkify = Linkify();

export const hasLinks = (value) =>
  value.inlines.some((inline) => inline.type === "link");
function Link(options) {
  let cache = "";
  return {
    onKeyDown(event, editor, next) {
      const { key } = event;
      const { value } = editor;
      const { selection, focusText } = value;
      const { focus } = selection;
      // 如果当前操作即为 link, 若为空格，则跳转到 inline 最末（吃掉 Hack 时的空格字符）
      if (hasLinks(value)) {
        switch (key) {
          case " ": {
            event.preventDefault();
            editor.moveToEndOfInline();
            return;
          }
          default:
            return next();
        }
      } else {
        // TODO: 如果缓存为空，而向前匹配到了 url 特征，则更新缓存
        if (!cache.length) {
          // 最多前项匹配 8 个字符（https://）
          let j = 0;
          while (j < 8) {
            const previous = focusText.text.substring(
              focus.offset - j,
              focus.offset
            );
            if (
              "https://".startsWith(previous + key) ||
              "http://".startsWith(previous + key)
            ) {
              cache = previous;
              break;
            }
            j++;
          }
        }
        if (/^[-a-zA-Z0-9@:%._+~#=/]{1}$/.test(key)) {
          // 输入
          const nextInput = cache + key;
          if (
            linkify.test(nextInput) ||
            "https://".startsWith(nextInput) ||
            "http://".startsWith(nextInput)
          ) {
            cache = nextInput;
          } else {
            // 不满足输入时，清空缓存
            cache = "";
          }
        }
        // 达到条件，回退游标，插入链接，清空缓存
        if (linkify.test(cache)) {
          event.preventDefault();
          editor
            // .insertText(key)
            .moveAnchorBackward(cache.length - 1)
            .insertInline({
              type: "link",
              data: {
                href: cache
              },
              nodes: [
                {
                  object: "text",
                  // 追加一个空格，否则无法继续在 inline 中输入
                  //
                  text: cache + " "
                }
              ]
            })
            .moveBackward(1);
          // .moveToEndOfInline();
          cache = "";
        } else {
          return next();
        }
      }
    }
  };
}

export default Link;
