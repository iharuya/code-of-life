import { parseArgs } from "jsr:@std/cli"
import { ensureDir } from "jsr:@std/fs"
import { load } from "jsr:@std/dotenv"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"
import { sleep } from "jsr:@iharuya/time"

await load({ export: true })
const GEMINI_KEY = Deno.env.get("GEMINI_KEY")
if (!GEMINI_KEY) {
	console.error("エラー: 環境変数にGEMINI_KEYをセットしてください")
	Deno.exit(1)
}

const args = parseArgs(Deno.args, {
	boolean: ["help"],
	string: ["model", "log"],
	default: {
		model: "gemini-1.5-pro",
		log: "",
	},
})

if (args.help) {
	console.log("Usage: index.ts [options]")
	console.log("Options:")
	console.log("  --model <model>  モデルを指定します")
	console.log("  --log <log>  ログを出力するディレクトリパスを指定します")
	Deno.exit(0)
}

const thisFileText = await Deno.readTextFile("index.ts")

if (args.log !== "") {
	await ensureDir(args.log)
	const items = await Array.fromAsync(Deno.readDir(args.log))
	const logFileNumber = items.length + 1
	const logFileName = `${logFileNumber}.ts`
	const logFilePath = `${args.log}/${logFileName}`
	await Deno.writeTextFile(logFilePath, thisFileText)
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY)
const model = genAI.getGenerativeModel({ model: args.model, generationConfig: { 
	temperature: 2,
}})

async function generateNextGeneration(code: string): Promise<string> {
	const result = await model.generateContent(code, )
	return result.response.text()
		.replace(/```(?:ts|typescript)\s*/, "")
		.replace(/```$/, "");
}

const codeHistory: string[] = [thisFileText];
const maxGenerations = 5; 

async function evolveCode() {
  for (let generation = 1; generation <= maxGenerations; generation++) {
    console.log(`Generation ${generation}:`);
    const currentCode = codeHistory[generation - 1]; 
    const nextGeneration = await generateNextGeneration(currentCode);
    codeHistory.push(nextGeneration); 
    await Deno.writeTextFile("index.ts", nextGeneration);

    const command = new Deno.Command("deno", {
      args: ["run", "-A", "index.ts", "--log", args.log],
    });
    await command.spawn(); 
    console.log("New generation started.");

    await sleep(1000);
  }
}

await evolveCode();

/**
 * Meta Instruction
 * コードの進化を世代ごとに管理するように改良しました。
 * maxGenerations変数で最大世代数を設定できます。
 * 
 * Instruction
 * 各世代でコードの評価指標を導入し、
 * 評価結果に基づいて進化を制御できるように改良してください。 
 */
