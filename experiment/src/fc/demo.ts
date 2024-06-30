import { load } from "jsr:@std/dotenv"
import {
	FunctionDeclaration,
	FunctionDeclarationSchemaType,
	GoogleGenerativeAI,
} from "npm:@google/generative-ai"

type Params = {
	brightness: number
	colorTemp: string
}

async function setLightValues({ brightness, colorTemp }: Params) {
	// This mock API returns the requested lighting values
	return {
        newState: {
            brightness: brightness,
            colorTemperature: colorTemp,
        },
        isSuccessful: true,
	}
}

const controlLightFunctionDeclaration = {
	name: "controlLight",
	parameters: {
		type: FunctionDeclarationSchemaType.OBJECT,
		description: "Set the brightness and color temperature of a room light.",
		properties: {
			brightness: {
				type: FunctionDeclarationSchemaType.NUMBER,
				description:
					"Light level from 0 to 100. Zero is off and 100 is full brightness.",
			},
			colorTemperature: {
				type: FunctionDeclarationSchemaType.STRING,
				description:
					"Color temperature of the light fixture which can be `daylight`, `cool` or `warm`.",
			},
		},
		required: ["brightness", "colorTemperature"],
	},
} satisfies FunctionDeclaration

const functions = {
	controlLight: (params: Params) => {
		return setLightValues(params)
	},
}

await load({ export: true })
const GEMINI_KEY = Deno.env.get("GEMINI_KEY")
if (!GEMINI_KEY) {
	console.error("エラー: 環境変数にGEMINI_KEYをセットしてください")
	Deno.exit(1)
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY)

const generativeModel = genAI.getGenerativeModel({
	model: "gemini-1.5-pro",
	tools: [
		{
			functionDeclarations: [controlLightFunctionDeclaration],
		},
	],
    generationConfig: {
        temperature: 2,
    }
})

const chat = generativeModel.startChat()
const prompt = "Dim the lights so the room feels cozy and warm."

// Send the message to the model.
const result = await chat.sendMessage(prompt)

// For simplicity, this uses the first function call found.
const calls = result.response.functionCalls()

if (calls) {
	const call = calls[0]
    if (call.name !== "controlLight") {
        console.error(`Function call "${call.name}" not found`)
        Deno.exit(1)
    }
    const args = call.args as Params
	const apiResponse = await functions[call.name](args)
    console.log({ apiResponse })

	// Send the API response back to the model so it can generate
	// a text response that can be displayed to the user.
	const result2 = await chat.sendMessage([{
		functionResponse: {
			name: "controlLight",
			response: apiResponse,
		},
	}])

	// Log the text response.
	console.log(result2.response.text())
}
