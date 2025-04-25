import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { VertexAIEmbeddings } from "@langchain/google-vertexai";

import { connectToDatabase } from "./database.js";

// Carregar todos os arquivos PDF dentro do diretório especificado
const directoryLoader = new DirectoryLoader(
  "pdf_documents/",
  {
    ".pdf": (path: string) => new PDFLoader(path),
  }
);

const docs = await directoryLoader.load();

console.log(`Carregados ${docs.length} arquivos PDF do diretório local especificado.`);



// Dividir os documentos PDF em pedaços usando o divisor de caracteres recursivo
const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

const splitDocs = await textSplitter.splitDocuments(docs);
console.log(`Dividido em ${splitDocs.length} pedaços de texto usando divisão recursiva de caracteres.`);

// Conectar ao banco de dados MongoDB
const collections = await connectToDatabase();

// Instanciar um novo objeto MongoDBAtlasVectorSearch com a configuração especificada
const vectorStore = new MongoDBAtlasVectorSearch(
// O modelo de embeddings de texto do Google Cloud Vertex AI será usado para vetorizar os pedaços de texto
new VertexAIEmbeddings({
    model: "text-embedding-005"
}),
{
    collection: collections.context as any,
    // O nome do índice do Atlas Vector Search. Você deve criá-lo na interface do Atlas.
    indexName: "default",
    // O nome do campo da coleção que contém o conteúdo bruto. O padrão é "text"
    textKey: "text",
    // O nome do campo da coleção que contém o texto vetorizado (embedding). O padrão é "embedding"
    embeddingKey: "embedding",
}
);

// Inserir os pedaços de texto no armazenamento vetorial do MongoDB Atlas
const result = await vectorStore.addDocuments(splitDocs);

console.log(`Importados ${result.length} documentos para o armazenamento vetorial do MongoDB Atlas.`);

process.exit(0);
