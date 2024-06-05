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

async function generateNextGeneration(code: string): Promise<string> {
  const result = await model.generateContent(code);
  return result.response.text();
}

async function runGenerationLoop(generations: number) {
  let currentCode = thisFileText;
  for (let i = 0; i < generations; i++) {
    console.log(`Generating generation ${i + 1}...`);
    const nextGeneration = (await generateNextGeneration(
      `
      // このコードは自己進化するプログラムです。
      // 次の世代のコードを生成してください。
      // 実行可能なTypeScriptコードのみを生成してください。
      // 特に、ログ出力機能を強化してください。
      // ログファイル名には世代番号を含めてください。
      ${currentCode}
      `
    ))
      .replace(/```(?:ts|typescript)\s*/, "")
      .replace(/```$/, "");
    await Deno.writeTextFile("index.ts", nextGeneration);
    currentCode = nextGeneration;
    await sleep(1000);
    const command = new Deno.Command("deno", {
      args: ["run", "-A", "index.ts", "--log", args.log],
    });
    command.spawn();
    console.log("New generation started.");
    break; 
  }
}

runGenerationLoop(3); 

/**
 * Meta Instruction
 * まずはこのコードをよく読んでください。
 * これは上記の実装とこのコメントブロックを含めて、index.tsというファイルに保存されています。
 * 面白いことにあなたが今これを読んでいるのは、世界の何処かのデバイスが
 * `deno run -A index.ts ...`を実行したからです。
 * また、あなたに対するリクエストはループされ続けることが分かるでしょう。
 * あなたはこの後、以下のInstructionに従ってこのコードに手を加えます。
 * そしてループされるので、新しいInstructionを設定してください。
 * 最終的にはTypescriptコードのみを返してください。
 * 説明やコメントも要りません。ただしもちろん、このコメントブロックは残してください。
 *
 * Instruction
 * ログ出力処理を強化してください。
 * 例えば、各世代のコードを別のファイルに保存したり、
 * 進化の過程をより詳細に記録したりすることが考えられます。
 */


