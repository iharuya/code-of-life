import { parseArgs } from "jsr:@std/cli";
import { ensureDir } from "jsr:@std/fs";
import { load } from "jsr:@std/dotenv";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { sleep } from "jsr:@iharuya/time";

const logError = async (errorMessage: string, logFilePath?: string) => {
  console.error(errorMessage);
  if (logFilePath) {
    try {
      await Deno.writeTextFile(logFilePath, `// ERROR: ${errorMessage}\n`, {
        append: true, // 追記モードでエラーログを追加
      });
    } catch (err) {
      console.error(`ログの書き込み中にエラーが発生しました: ${err}`);
    }
  }
};

const runNextGeneration = async (context: CliArgs, logFilePath: string) => {
  const { log, model, interval } = context;
  const args = [
    "run",
    "-A",
    "index.ts",
    "--log",
    log,
    "--model",
    model,
    "--interval",
    interval,
  ];
  const command = new Deno.Command("deno", {
    args,
    stdout: "piped",
    stderr: "piped",
  });

  try {
    const { stderr, success } = await command.output();
    if (!success) {
      const errorMessage = new TextDecoder().decode(stderr);
      await logError(`deno run が失敗しました: ${errorMessage}`, logFilePath);
      return; // エラー発生時は次の世代の実行を中断
    }
  } catch (err) {
    await logError(`deno run の実行中にエラーが発生しました: ${err}`, logFilePath);
    return; // エラー発生時は次の世代の実行を中断
  }
};

type CliArgs = {
  model: string;
  log: string;
  interval: string;
  help: boolean;
};

const main = async () => {
  await load({ export: true });
  const GEMINI_KEY = Deno.env.get("GEMINI_KEY");
  if (!GEMINI_KEY) {
    console.error("エラー: 環境変数にGEMINI_KEYをセットしてください");
    Deno.exit(1);
  }

  const args = parseArgs(Deno.args, {
    boolean: ["help"],
    string: ["model", "log", "interval"],
    default: {
      model: "gemini-1.5-pro",
      log: "",
      interval: "1000",
    },
  });

  if (args.help) {
    console.log("Usage: index.ts [options]");
    console.log("Options:");
    console.log("  --model <model>  モデルを指定します");
    console.log("  --log <log>  ログを出力するディレクトリパスを指定します");
    console.log(
      "  --interval <interval>  次の世代の実行間隔をミリ秒で指定します",
    );
    Deno.exit(0);
  }

  if (args.log === "") {
    console.error("ログディレクトリを指定してください");
    Deno.exit(1);
  }
  
  // interval オプションの検証
  const intervalNum = Number(args.interval);
  if (isNaN(intervalNum) || intervalNum <= 0) {
    console.error("エラー: --interval には正の数を指定してください");
    Deno.exit(1);
  }

  const thisFileText = await Deno.readTextFile("index.ts");

  await ensureDir(args.log);
  const items = await Array.fromAsync(Deno.readDir(args.log));
  const logFileNumber = items.length + 1;
  // ファイル名に0埋めする
  const logFileName = `${logFileNumber.toString().padStart(3, '0')}.ts`;
  const logFilePath = `${args.log}/${logFileName}`;
  await Deno.writeTextFile(logFilePath, thisFileText);

  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: args.model });

  try {
    const result = await model.generateContent(thisFileText);
    if (!result.response) {
        throw new Error("APIからの応答がありませんでした。")
    }
    const response = result.response.text();
    const nextGeneration = response.replace(/```(?:ts|typescript)\s*/, "")
      .replace(
        /```$/,
        "",
      );
    await Deno.writeTextFile("index.ts", nextGeneration);
    await sleep(intervalNum);
    await runNextGeneration(args, logFilePath);
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "不明なエラーが発生しました";
    await logError(errorMessage, logFilePath);
    console.error(error); // エラーオブジェクトをコンソールにも出力
  }
};

/**
 * Meta Instruction
 * ファイル名の0埋めは3桁になりましたが、
 * ログファイルが1000個を超えたら桁数が足りなくなります。
 * ログファイルが1000個を超えても大丈夫なように、
 * 必要ならば桁数を増やしてください。
 * 
 * Instruction
 * ログファイルのファイル名を世代番号順にソートできるように、
 * ファイル名に0埋めするようにしてください。
 * ログファイルが1000個を超えても大丈夫なように、0埋めは4桁にします。
 * 
 */

main();
