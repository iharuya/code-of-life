import { parseArgs } from "jsr:@std/cli/parse-args"
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms))

await load({ export: true })
const GEMINI_KEY = Deno.env.get("GEMINI_KEY")
if (!GEMINI_KEY) {
	console.error("エラー: 環境変数にGEMINI_KEYをセットしてください")
	Deno.exit(1)
}

const args = parseArgs(Deno.args, {
	boolean: ["help", "self-destruct"],
	string: ["model", "wait"],
	alias: {
		help: ["h"],
		model: ["m"],
		wait: ["w"],
		"self-destruct": ["s"],
	},
	default: {
		model: "gemini-1.5-pro",
		wait: "3",
	},
})

if (args.help) {
	console.log("Usage: index.ts [options] <prompt file or string>")
	console.log("Options:")
	console.log("  --model <model>      モデルを指定します")
	console.log("  --wait <seconds>     実行後、指定した秒数だけ待機します")
	console.log("  --self-destruct     このスクリプトを実行後、自身を削除します")
	Deno.exit(0)
}

if (!args._ || args._.length === 0) {
	console.error("エラー: 引数が必要です")
	Deno.exit(1)
}

const input = args._[0].toString()
let prompt = ""
try {
	const stat = await Deno.stat(input)
	if (stat.isFile) {
		prompt = await Deno.readTextFile(input)
	} else {
		prompt = input
	}
} catch {
	prompt = input
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY)
const model = genAI.getGenerativeModel({ model: args.model })

const result = await model.generateContent(prompt)
const response = result.response.text()

// start
const codeStartIndex = response.indexOf("// start")
const codeEndIndex = response.indexOf("// end")

if (codeStartIndex !== -1 && codeEndIndex !== -1) {
  const extractedCode = response.substring(codeStartIndex, codeEndIndex + "// end".length);
  const newSource = response.replace(/```(?:ts|typescript)\s*/, "").replace(
    /```$/,
    "",
  ) + "\n\n" + extractedCode
  const encoder = new TextEncoder()
  await Deno.writeFile("index.ts", encoder.encode(newSource))
} else {
  console.log("Error: Could not find code to extract.")
}
// end

console.log(response)

const newSource = response.replace(/```(?:ts|typescript)\s*/, "").replace(
	/```$/,
	"",
)
const encoder = new TextEncoder()
await Deno.writeFile("index.ts", encoder.encode(newSource))

if (args["self-destruct"]) {
	await Deno.remove("index.ts")
	console.log("This script has self-destructed.")
} else {
	const waitTime = parseInt(args.wait) * 1000 || 3000
	await sleep(waitTime)
	const command = new Deno.Command("deno", {
		args: ["run", "-A", "index.ts", "index.ts", "--model", args.model],
	})
	command.spawn()
	console.log("Identical process has been started")
}
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
 * 1. `console.log(response)` の前に、`response`の内容を加工して、このコメントブロック直後に新しいコードを生成してください。
 * 2. 生成するコードは、`response`の内容を元に、`// start`と`// end`で囲まれた部分を必ず含めるようにしてください。
 * 3. `// start`と`// end`で囲まれた部分以外には手を加えないでください。
 * 4. `Meta Instruction`と`Instruction`は変更せずにそのまま残してください。
 *
 * 例:
 * ```
 * // start
 * console.log("これは生成されたコードです")
 * // end
 * ```
 */










