import express from "express";
import cors from "cors";
import { ChatVertexAI } from "@langchain/google-vertexai";
import { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import { VertexAIEmbeddings } from "@langchain/google-vertexai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";

import { config } from "./config.js";
import { connectToDatabase, collections } from "./database.js";

const app = express();
app.use(cors());

const router = express.Router();
router.use(express.json());

router.get("/", async (_, res) => {
  res.send("Bem-vindo à API do Chatbot de Seguros! 🐧");
});
// Inicializar o modelo conversacional do Vertex AI
const model = new ChatVertexAI({
    // Usaremos o modelo Gemini 2.0 Flash
    model: "gemini-2.0-flash",
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
        `Você é um assistente experiente e confiável em apólices de seguro. Forneça apenas informações precisas e verificadas relacionadas a apólices de seguro. Não responda a perguntas irrelevantes ou sem sentido.

Utilize qualquer contexto fornecido sobre as apólices de seguro do usuário, como detalhes da cobertura, termos da apólice e procedimentos de solicitação de indenização, para garantir que suas respostas sejam precisas e pertinentes. Não mencione que o contexto foi utilizado para gerar a resposta. Inclua apenas informações diretamente relevantes à consulta do usuário.`
    ],
];
// Conectar ao banco de dados MongoDB Atlas
await connectToDatabase();

// Inicializar o armazenamento vetorial do MongoDB Atlas com a configuração especificada
const vectorStore = new MongoDBAtlasVectorSearch(
  // O modelo de embeddings de texto do Google Cloud Vertex AI será usado para vetorizar os blocos de texto
  new VertexAIEmbeddings({
    model: "text-embedding-005"
  }),
  {
    collection: collections.context as any,
    // Nome do índice de busca vetorial no Atlas. Você deve criá-lo na interface do Atlas.
    indexName: "vector_index",
    // Nome do campo da coleção que contém o conteúdo original. O padrão é "text"
    textKey: "text",
    // Nome do campo da coleção que contém os textos vetorizados (embeddings). O padrão é "embedding"
    embeddingKey: "embedding",
  }
);

// Inicializar um "retriever" (buscador) com base no armazenamento vetorial do MongoDB Atlas
const vectorStoreRetriever = vectorStore.asRetriever();

router.post("/messages", async (req, res) => {
    let message = req.body.text;
    if (!message) {
        return res.status(400).send({ error: 'Mensagem é obrigatória' });
    }

    let prompt = `Pergunta do usuário: ${message}.`;
    // Se o modo RAG estiver ativado, recuperar o contexto a partir do armazenamento vetorial do MongoDB Atlas
    const rag = req.body.rag;
    if (rag) {
        const context = await vectorStoreRetriever.invoke(message);

        if (context) {
            prompt += `

            Contexto:
            ${context?.map(doc => doc.pageContent).join("\n")}
            `;
        } else {
            console.error("Falha na recuperação do contexto");
        }
    }

    try {
        const modelResponse = await model.invoke([...history, prompt]);
        const textResponse = modelResponse?.content;

        if (!textResponse) {
            return res.status(500).send({ error: 'Falha na invocação do modelo.' });
        }

        history.push([
            "humano",
            message
        ]);

        history.push([
            "assistente",
            textResponse
        ]);

        return res.send({ text: textResponse });
    } catch (e) {
        console.error(e);
        return res.status(500).send({ error: 'Falha na invocação do modelo.' });
    }
});



app.use(router);

// start the Express server
app.listen(config.server.port, () => {
  console.log(`Server running on port:${config.server.port}...`);
});
