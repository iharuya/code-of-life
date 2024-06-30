import { load } from "jsr:@std/dotenv"
import { readProject } from "./read-project.ts"

const main = async () => {
    await load({ export: true })
    const GEMINI_KEY = Deno.env.get("GEMINI_KEY")
    if (!GEMINI_KEY) {
        console.error("エラー: 環境変数にGEMINI_KEYをセットしてください")
        Deno.exit(1)
    }

    console.log(await readProject())

}

main()