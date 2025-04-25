import express from "express";
import cors from "cors";
import { ChatVertexAI } from "@langchain/google-vertexai";
import { BaseMessage } from "@langchain/core/messages";
import { VertexAIEmbeddings } from "@langchain/google-vertexai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";

import { config } from "./config.js";
import { connectToDatabase, collections } from "./database.js";
import { BaseLanguageModelInput } from "@langchain/core/language_models/base.js";

const app = express();
app.use(cors());

const router = express.Router();
router.use(express.json());

router.get("/", async (_, res) => {
  res.send("Bem-vindo à API do Chatbot de Seguros! 🐧");
});

// Inicializar o modelo conversacional do Vertex AI
const model = new ChatVertexAI({
   
    model: "gemini-2.0-flash",
    // Número máximo de tokens a serem gerados na resposta
  
    // Número máximo de tokens a serem gerados na resposta
    maxOutputTokens: 2048,
    // O parâmetro "temperature" controla a aleatoriedade da resposta — quanto maior o valor, mais aleatória será a saída
    temperature: 0.5,
    // O parâmetro "topP" controla a diversidade da resposta — quanto maior o valor, mais diversa será a saída
    topP: 0.9,
    // O parâmetro "topK" também controla a diversidade da resposta — quanto maior o valor, mais diversa será a saída
    topK: 20,
});

// Armazenar o histórico de chat, começando com a mensagem do sistema informando que o assistente é especializado em apólices de seguro
const history: BaseLanguageModelInput = [
    [
      "system",
      `Você é um assistente de seguros experiente e confiável. Forneça apenas informações precisas e verificadas relacionadas a apólices de seguro. Não responda a perguntas irrelevantes ou sem sentido.
  
  Utilize qualquer contexto fornecido sobre as apólices de seguro do usuário, como detalhes da cobertura, termos da apólice e procedimentos de solicitação de indenização, para garantir que suas respostas sejam precisas e pertinentes.`
    ],
  ];
  

// Conectar ao banco de dados MongoDB Atlas
await connectToDatabase();

router.post("/messages", async (req, res) => {
  const message = req.body.text;
  if (!message) {
    return res.status(400).send({ error: 'Mensagem é obrigatória' });
  }

  try {
    const modelResponse = await model.invoke([
      ...history,
      { type: "human", content: message }
    ]);
    const textResponse = modelResponse?.content;

    if (!textResponse) {
      return res.status(500).send({ error: 'Falha na invocação do modelo.' });
    }

    // Atualiza o histórico de conversa
    history.push({ type: "human", content: message });
    history.push({ type: "ai", content: textResponse });

    return res.send({ text: textResponse });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: 'Falha na invocação do modelo.' });
  }
});

app.use(router);

// Iniciar o servidor Express na porta 3000
const PORT = 3000;

app.listen(config.server.port, () => {
    console.log(`Server running on port:${config.server.port}...`);
  });
  
