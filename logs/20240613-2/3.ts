import { parseArgs } from "jsr:@std/cli"
import { ensureDir } from "jsr:@std/fs"
import { load } from "jsr:@std/dotenv"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"
import { sleep } from "jsr:@iharuya/time"

const logError = async (errorMessage: string, logFilePath?: string) => {
	console.error(errorMessage)
	if (logFilePath) {
		try {
			await Deno.writeTextFile(logFilePath, `// ERROR: ${errorMessage}\n`)
		} catch (err) {
			console.error(`ログの書き込み中にエラーが発生しました: ${err}`)
		}
	}
}

const runNextGeneration = async (context: CliArgs, logFilePath: string) => {
	const { log, model } = context
	const args = ["run", "-A", "index.ts", "--log", log, "--model", model]
	const command = new Deno.Command("deno", {
		args,
		stdout: "piped",
		stderr: "piped",
	})

	try {
		const { stderr, success } = await command.output()
		if (!success) {
			const errorMessage = new TextDecoder().decode(stderr)
			await logError(`deno run が失敗しました: ${errorMessage}`, logFilePath)
		}
	} catch (err) {
		await logError(`deno run の実行中にエラーが発生しました: ${err}`, logFilePath)
	}
}

type CliArgs = {
	model: string
	log: string
	help: boolean
}

const main = async () => {
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

	if (args.log === "") {
		console.error("ログディレクトリを指定してください")
		Deno.exit(1)
	}

	const thisFileText = await Deno.readTextFile("index.ts")
	
	await ensureDir(args.log)
	const items = await Array.fromAsync(Deno.readDir(args.log))
	const logFileNumber = items.length + 1
	const logFileName = `${logFileNumber}.ts`
	const logFilePath = `${args.log}/${logFileName}`
	await Deno.writeTextFile(logFilePath, thisFileText)
	
	const genAI = new GoogleGenerativeAI(GEMINI_KEY)
	const model = genAI.getGenerativeModel({ model: args.model })

	try {
		const result = await model.generateContent(thisFileText)
		const response = result.response.text()
		const nextGeneration = response.replace(/```(?:ts|typescript)\s*/, "")
			.replace(
				/```$/,
				"",
			)
		await Deno.writeTextFile("index.ts", nextGeneration)
		await sleep(1000)
		await runNextGeneration(args, logFilePath)
	} catch (error) {
		if (error instanceof Error) {
			await logError(error.message, logFilePath)
		} else {
			console.error("不明なエラーが発生しました")
			console.error(error)
		}
	}
}

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
 * なにか面白い機能を頑張って考えて追加していくようにしてください。
 */

main()
