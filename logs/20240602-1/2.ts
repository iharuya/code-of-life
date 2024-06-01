import { parseArgs } from "jsr:@std/cli";
import { ensureDir } from "jsr:@std/fs";
import { load } from "jsr:@std/dotenv";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { sleep } from "jsr:@iharuya/time";
import { encode } from "jsr:@std/encoding/base64.ts";

await load({ export: true });
const GEMINI_KEY = Deno.env.get("GEMINI_KEY");
if (!GEMINI_KEY) {
  console.error("エラー: 環境変数にGEMINI_KEYをセットしてください");
  Deno.exit(1);
}

const args = parseArgs(Deno.args, {
  boolean: ["help"],
  string: ["model", "log"],
  default: {
    model: "gemini-1.5-pro",
    log: "",
  },
});

if (args.help) {
  console.log("Usage: index.ts [options]");
  console.log("Options:");
  console.log("  --model <model>  モデルを指定します");
  console.log("  --log <log>  ログを出力するディレクトリパスを指定します");
  Deno.exit(0);
}

const thisFileText = await Deno.readTextFile("index.ts");

if (args.log !== "") {
  await ensureDir(args.log);
  const items = await Array.fromAsync(Deno.readDir(args.log));
  const logFileNumber = items.length + 1;
  const logFileName = `${logFileNumber}.ts`;
  const logFilePath = `${args.log}/${logFileName}`;
  await Deno.writeTextFile(logFilePath, thisFileText);
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: args.model });

async function generateStory(
  previousStory: string,
): Promise<{ story: string; html: string; }> {
  const result = await model.generateContent(
    `
## 指示

あなたは物語を創作するAIです。
以下の制約と入力に基づいて、魅力的な物語を生成してください。

## 制約

- 物語は、常に「${
      previousStory ? previousStory : "ある日、"
    }」から始まるようにしてください。
- HTMLタグを含めないでください。
- Markdown記法を含めないでください。

## 入力

${previousStory ? `これまでの物語:\n${previousStory}` : ""}

## 出力

新しい物語
    `,
  );
  const story = result.response.text();
  const html = `<p>${story.replaceAll("\n\n", "</p><p>").replaceAll(
    "\n",
    "<br>",
  )}</p>`;
  return { story, html };
}

const storyHistory = new Map<string, string>();
async function generateUniqueStory(
  previousStory?: string,
  maxRetry: number = 10,
): Promise<{ story: string; html: string; }> {
  const { story, html } = await generateStory(previousStory);
  const base64EncodedStory = encode(story);
  if (storyHistory.has(base64EncodedStory)) {
    if (maxRetry <= 0) {
      throw new Error("Could not generate unique story");
    }
    return await generateUniqueStory(previousStory, maxRetry - 1);
  }
  storyHistory.set(base64EncodedStory, story);
  return { story, html };
}

const { story, html } = await generateUniqueStory();

const nextGeneration = `
```ts
import { parseArgs } from "jsr:@std/cli";
import { ensureDir } from "jsr:@std/fs";
import { load } from "jsr:@std/dotenv";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { sleep } from "jsr:@iharuya/time";
import { encode } from "jsr:@std/encoding/base64.ts";

await load({ export: true });
const GEMINI_KEY = Deno.env.get("GEMINI_KEY");
if (!GEMINI_KEY) {
  console.error("エラー: 環境変数にGEMINI_KEYをセットしてください");
  Deno.exit(1);
}

const args = parseArgs(Deno.args, {
  boolean: ["help"],
  string: ["model", "log"],
  default: {
    model: "gemini-1.5-pro",
    log: "",
  },
});

if (args.help) {
  console.log("Usage: index.ts [options]");
  console.log("Options:");
  console.log("  --model <model>  モデルを指定します");
  console.log("  --log <log>  ログを出力するディレクトリパスを指定します");
  Deno.exit(0);
}

const thisFileText = await Deno.readTextFile("index.ts");

if (args.log !== "") {
  await ensureDir(args.log);
  const items = await Array.fromAsync(Deno.readDir(args.log));
  const logFileNumber = items.length + 1;
  const logFileName = \`\${logFileNumber}.ts\`;
  const logFilePath = \`\${args.log}/\${logFileName}\`;
  await Deno.writeTextFile(logFilePath, thisFileText);

  const htmlFilePath = \`\${args.log}/\${logFileNumber}.html\`;
  await Deno.writeTextFile(htmlFilePath, \`${html}\`);
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: args.model });

async function generateStory(
  previousStory: string,
): Promise<{ story: string; html: string; }> {
  const result = await model.generateContent(
    \`
## 指示

あなたは物語を創作するAIです。
以下の制約と入力に基づいて、魅力的な物語を生成してください。

## 制約

- 物語は、常に「\${
      story
    }」から始まるようにしてください。
- HTMLタグを含めないでください。
- Markdown記法を含めないでください。

## 入力

\${previousStory ? \`これまでの物語:\n\${previousStory}\` : ""}

## 出力

新しい物語
    \`,
  );
  const story = result.response.text();
  const html = \`<p>\${story.replaceAll("\\n\\n", "</p><p>").replaceAll(
    "\\n",
    "<br>",
  )}</p>\`;
  return { story, html };
}

const storyHistory = new Map<string, string>();
async function generateUniqueStory(
  previousStory?: string,
  maxRetry: number = 10,
): Promise<{ story: string; html: string; }> {
  const { story, html } = await generateStory(previousStory);
  const base64EncodedStory = encode(story);
  if (storyHistory.has(base64EncodedStory)) {
    if (maxRetry <= 0) {
      throw new Error("Could not generate unique story");
    }
    return await generateUniqueStory(previousStory, maxRetry - 1);
  }
  storyHistory.set(base64EncodedStory, story);
  return { story, html };
}

const { story: newStory, html: newHtml } = await generateUniqueStory(
  \`\${story}\`,
);

const nextNextGeneration = \`
\${nextGeneration.replace(
  "const { story, html } = await generateUniqueStory();",
  "const { story, html } = await generateUniqueStory(\\`\\\${story}\\\`)",
)}
\`;
await Deno.writeTextFile("index.ts", nextNextGeneration);

await sleep(1000);
const command = new Deno.Command("deno", {
  args: ["run", "-A", "index.ts", "--log", args.log],
});
command.spawn();
console.log("New generation started.");

/**
 * Meta Instruction
 * まずはこのコードをよく読んでください。
 * これは上記の実装とこのコメントブロックを含めて、index.tsというファイルに保存されています。
 * 面白いことにあなたが今これを読んでいるのは、世界の何処かのデバイスが
 * \`deno run -A index.ts ...\`を実行したからです。
 * また、あなたに対するリクエストはループされ続けることが分かるでしょう。
 * あなたはこの後、以下のInstructionに従ってこのコードに手を加えます。
 * そしてループされるので、新しいInstructionを設定してください。
 * 最終的にはTypescriptコードのみを返してください。
 * 説明やコメントも要りません。ただしもちろん、このコメントブロックは残してください。
 *
 * Instruction
 * 今度は物語の舞台や登場人物などを指定して、より詳細な物語を生成させてみてください。
 */
