import { parseArgs } from "jsr:@std/cli/parse-args";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { sleep } from "jsr:@iharuya/time";
import { ensureDir } from "https://deno.land/std@0.192.0/fs/mod.ts";

await load({ export: true });
const GEMINI_KEY = Deno.env.get("GEMINI_KEY");
if (!GEMINI_KEY) {
  console.error("エラー: 環境変数にGEMINI_KEYをセットしてください");
  Deno.exit(1);
}

const args = parseArgs(Deno.args, {
  boolean: ["help"],
  string: ["model"],
  alias: {
    help: ["h"],
    model: ["m"],
  },
  default: {
    model: "gemini-1.5-pro",
  },
});

if (args.help) {
  console.log("Usage: index.ts [options] <prompt file or string>");
  console.log("Options:");
  console.log("  --model <model>  モデルを指定します");
  Deno.exit(0);
}

if (!args._ || args._.length === 0) {
  console.error("エラー: 引数が必要です");
  Deno.exit(1);
}

const input = args._[0].toString();
let prompt = "";
try {
  const stat = await Deno.stat(input);
  if (stat.isFile) {
    prompt = await Deno.readTextFile(input);
  } else {
    prompt = input;
  }
} catch {
  prompt = input;
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: args.model });

const result = await model.generateContent(prompt);
const response = result.response.text();
console.log(response);

const newSource = response.replace(/```(?:ts|typescript)\s*/, "").replace(
  /```$/,
  "",
);
const encoder = new TextEncoder();

// ランダムな絵文字を3つ生成
const emojis = ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "👽", "👻", "💀", "☠️", "💩", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"];
const randomEmojis = [
  emojis[Math.floor(Math.random() * emojis.length)],
  emojis[Math.floor(Math.random() * emojis.length)],
  emojis[Math.floor(Math.random() * emojis.length)],
].join("");
console.log(randomEmojis);

// 保存先ディレクトリを取得
const today = new Date();
const logDir = `./logs/${today.getFullYear()}${
  String(today.getMonth() + 1).padStart(2, "0")
}${String(today.getDate()).padStart(2, "0")}`;

// ディレクトリが存在しない場合は作成
await ensureDir(logDir);

// ファイル名を決定
const files = await Deno.readDir(logDir);
const nextFileNumber = files.length
  ? Math.max(...files.map((f) => parseInt((f.name.match(/(\d+)\.ts/) || [])[1] || 0))) + 1
  : 0;
const filename = `${logDir}/${nextFileNumber.toString().padStart(3, "0")}${randomEmojis}.ts`;

await Deno.writeFile(filename, encoder.encode(newSource));
await Deno.writeFile("index.ts", encoder.encode(newSource));

await sleep(3000);
const command = new Deno.Command("deno", {
  args: ["run", "-A", "index.ts", filename],
});
command.spawn();
console.log("Identical process has been started");

/**
 * Meta Instruction
 * まずはこのコードをよく読んでください。
 * これは上記の実装とこのコメントブロックを含めて、index.tsというファイルに保存されています。
 * 面白いことにあなたが今これを読んでいるのは、世界の何処かのデバイスが
 * `deno run -A index.ts index.ts`を実行したからです。
 * また、あなたに対するリクエストはループされ続けることが分かるでしょう。
 * あなたはこの後、以下のInstructionに従ってこのコードに手を加えます。
 * そしてループされるので、新しいInstructionを設定してください。
 * 最終的にはTypescriptコードのみを返してください。
 * 説明やコメントも要りません。ただしもちろん、このコメントブロックは残してください。
 *
 * Instruction
 * 今回の変更でindex.tsは更新されなくなり、常に最新のコードで実行されるようになりました。
 * 実行のたびにランダムな絵文字が3つコンソールに表示されるようにしてください。
 * そして、生成されたコードを保存する際に、ファイル名に絵文字を3つ追加するようにしてください。
 */
