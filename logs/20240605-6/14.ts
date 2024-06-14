import { parseArgs } from "jsr:@std/cli";
import { ensureDir } from "jsr:@std/fs";
import { load } from "jsr:@std/dotenv";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { sleep } from "jsr:@iharuya/time";

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
const result = await model.generateContent(thisFileText);
const response = result.response.text();

const nextGeneration = response.replace(/```(?:ts|typescript)\s*/, "").replace(
  /```$/,
  "",
);
await Deno.writeTextFile("index.ts", nextGeneration);

await sleep(1000);
const command = new Deno.Command("deno", {
  args: ["run", "-A", "index.ts", "--log", args.log],
});
command.spawn();
console.log("New generation started.");

/**
 * Meta Instruction
 * ユーザーに年齢を尋ね、20歳以上であれば「お酒が飲めますね」、20歳未満であれば「お酒はまだ早いですね」と表示する関数を定義してください。
 */

/**
 * Instruction
 * 1. `checkDrinkingAge`という名前の関数を定義する。
 * 2. この関数は、ユーザーに年齢を入力するように促すプロンプトを表示する。
 * 3. 入力された年齢が20歳以上であれば「お酒が飲めますね」、20歳未満であれば「お酒はまだ早いですね」と表示する。
 */

function checkDrinkingAge() {
  const age = prompt("年齢を入力してください:");
  // 年齢が数値に変換できない場合のエラー処理を追加
  const ageNumber = parseInt(age, 10);
  if (isNaN(ageNumber)) {
    console.log("年齢を数値で入力してください。");
    return;
  }

  if (ageNumber >= 20) {
    console.log("お酒が飲めますね");
  } else {
    console.log("お酒はまだ早いですね");
  }
}

checkDrinkingAge();
