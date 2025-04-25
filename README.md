# 🛡️ Assistente de Chat RAG com MongoDB Atlas, Google Cloud e Langchain

Esta é uma demonstração de um assistente de chatbot utilizando **RAG** (Geração Aumentada por Recuperação).

## 🛠️ Tecnologias

- O cliente é desenvolvido com **Angular** e **Angular Material**.
- O servidor é construído com **Express.js** e usa **MongoDB Atlas** para armazenar os dados vetoriais.
- As embeddings são geradas com o modelo de embeddings do **Google Cloud**.
- O modelo de conversa utiliza o **Gemini 1.0 Pro**.
- A aplicação também faz uso da **Langchain**.

## ✅ Pré-requisitos

1. [Node.js](https://nodejs.org/) versão LTS instalada.
2. Conta no **Google Cloud** com as APIs do **Vertex AI** habilitadas.

## ⚙️ Configuração

Siga os passos abaixo para configurar o assistente de chat para desenvolvimento local.

### 🗄️ Configurar o Armazenamento Vetorial no MongoDB Atlas

1. Crie uma conta no [MongoDB Atlas](https://mongodb.com/try?utm_campaign=devrel&utm_source=cross-post&utm_medium=cta&utm_content=google-cloud-rag&utm_term=stanimira.vlaeva) e implemente um banco de dados gratuito. Complete o guia rápido — crie um usuário de banco de dados e permita o acesso do seu IP.

2. Clone o repositório:

    ```bash
    git clone https://github.com/RayBasilio123/LangchainMongoDB.git
    cd LangchainMongoDB
    ```

3. Crie um arquivo `.env` com o seguinte conteúdo:

    ```env
    ATLAS_URI=<sua-string-de-conexão-do-atlas>
    ```

4. Execute o script de embeddings para vetorizar os dados dos PDFs e armazená-los no MongoDB Atlas:

    ```bash
    npm run embed-documents
    ```

5. No MongoDB Atlas, verifique se os dados foram armazenados na coleção `context`.

6. Vá para a aba **Atlas Search** e clique em **Create Search Index**. Escolha **JSON Editor** na seção **Atlas Vector Search** (última opção da lista).

7. Na barra lateral, selecione o banco de dados `chat-rag` e a coleção `context`.

8. Adicione o seguinte esquema JSON:

    ```json
    {
        "fields": [
            {
                "numDimensions": 768,
                "path": "embedding",
                "similarity": "euclidean",
                "type": "vector"
            }
        ]
    }
    ```

9. Aguarde até o status mudar para **Active**.

### 🚀 Executar a Aplicação

1. Inicie a aplicação com o comando:

    ```bash
    npm start
    ```

2. Abra o navegador e vá para `http://localhost:4200`.

3. Tente fazer perguntas ao chatbot, como:
   - "Qual é a cobertura da minha apólice de seguro?"
   - "Quais são as especificações do meu seguro de carro?"

   Use a opção de alternância `RAG` para mudar entre geração aumentada por recuperação e apenas recuperação.

## 👨‍💻 Contribuidores ✨

Esta demonstração foi inspirada no projeto [Chat Application with RAG Feature Toggle and Backend Server](https://github.com/voxic/GCP_RAG_Chatbot/tree/main).

<table>
  <tr>
    <td align="center">
        <a href="https://github.com/RayBasilio123">
            <img src="https://avatars.githubusercontent.com/u/58826286?s=96&v=4" width="100px;" alt="Foto do Ray"/><br />
            <sub><b>Ray Basilio</b></sub>
        </a><br />
    </td>
  </tr>
</table>

## ⚠️ Aviso

Use por sua conta e risco; este não é um produto oficial da MongoDB.
