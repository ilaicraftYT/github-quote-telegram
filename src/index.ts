import { Bot, type Context, InlineQueryResultBuilder } from "grammy";

const bot = new Bot(process.env.TOKEN as string);

bot.command("start", (ctx) => {
  ctx.reply(
    `Hi! I quote from your GitHub repository.
    Type @githubquotebot in any chat and then type a GitHub link.
    Found a bug? Report it on our GitHub.
    See https://github.com/ilaicraftYT/github-quote-telegram for more information.`,
  );
});

bot.on("inline_query", async (ctx) => {
  const query = ctx.inlineQuery.query;

  // If it's a link...
  if (/https:\/\/github.com\//g.test(query)) {
    const split = query.split("/");
    const repoOwner = split[3];
    const repoName = split[4];
    const path = split.slice(6)?.join("/");
    const lines = split[split.length - 1]
      ?.split("#")[1]
      ?.replace(/L/g, "")
      ?.split("-");

    if (!repoOwner || ((!lines || !lines[0]) && repoOwner != repoName)) return; // malformed URL
    const code = await fetchCode(
      repoOwner,
      repoName,
      repoOwner == repoName ? "main/README.md" : path
    );

    if (!code) return; // didn't found repo

    const styled = styleCode(
      code,
      repoOwner != repoName ? parseInt(lines[0]) : 0,
      repoOwner != repoName ? parseInt(lines[1]) : undefined
    );

    const result = composeResponse(
      repoName == repoOwner && !!code,
      !lines?.[1],
      {
        repoOwner,
        repoName,
        path,
        lines,
        styled,
      }
    );
    ctx.answerInlineQuery(result, { cache_time: 60 });
  }
});

bot.start();
bot.catch((err) => {
  console.log("Error: ", err);
}); // ignore errors, but silently log them

async function fetchCode(repoOwner: string, repo: string, path: string) {
  const res = await fetch(
    `https://raw.githubusercontent.com/${repoOwner}/${repo}/${path}`
  );
  return res.ok ? (await res.text()).replace(/\\/g, "\\").replace("`", "\\`") : null;
}

function styleCode(code: string, start: number, end?: number) {
  let lines = code.split("\n");
  let cut = [];

  const cutter = (lineNumbers: boolean) => {
    if (lineNumbers) {
      lines = lines.map((line, i) => {
        const maxLines = lines.length.toString().length;
        const currentLine = i + 1;
        const spaces = Array(maxLines - currentLine.toString().length)
          .fill(" ")
          .join("");
        return `  [${spaces}${currentLine}]  ${line}`;
      });
    }

    if (!end && start != 0) {
      // Single line
      return lines.slice(
        Math.max(0, start - 10),
        Math.min(lines.length, start + 11)
      );
    } else {
      return lines.slice(Math.max(0, start - 1), end);
    }
  };

  const final = [
    `\`\`\`\n${cutter(false).join("\n")}\n\`\`\``,
    `\`\`\`\n${cutter(true).join("\n")}\n\`\`\``,
  ];

  return final;
}

function composeResponse(
  fromProfile: boolean,
  singleLine: boolean,
  data: {
    repoOwner: string;
    repoName: string;
    path: string;
    lines: Array<string>;
    styled: Array<string>;
  }
) {
  const source = fromProfile
    ? `From ${data.repoOwner}'s profile`
    : `From \`${data.repoOwner}/${data.repoName}\`\\. Tree \`${
        data.path.split("/")[0]
      }\` at \`${data.path.split("#")[0].split("/").slice(1).join("/")}\``;

  const lines = fromProfile
    ? ""
    : `, lines **${data.lines[0]}** ${
        !singleLine ? "to **" + data.lines[1] + "**" : "and 10 adjacent"
      }`;

  return [
    InlineQueryResultBuilder.article(
      data.repoName + data.lines?.[0] + data.lines?.[1],
      `${data.repoOwner}/${data.repoName}`
    ).text(`${source} ${lines}\n${data.styled[0]}`, {
      parse_mode: "MarkdownV2",
    }),
    InlineQueryResultBuilder.article(
      data.repoName + data.lines?.[0] + data.lines?.[1] + "wl",
      `${data.repoOwner}/${data.repoName} (with lines)`
    ).text(`${source} ${lines}\n${data.styled[1]}`, {
      parse_mode: "MarkdownV2",
    }),
  ];
}
