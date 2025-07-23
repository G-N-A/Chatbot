from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
from llm_client import query_llm

app = FastAPI()

logging.basicConfig(level=logging.INFO)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Chatbot backend is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/chat")
async def chat(request: Request):
    data = await request.json()
    prompt = data.get("prompt", "").strip()

    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    logging.info(f"Received prompt: {prompt}")

    def llm_stream():
        try:
            result = query_llm(prompt)
            if not isinstance(result, str):
                result = ''.join(result)
            logging.info(f"Generated result: {result}")
            yield result
        except Exception as e:
            logging.error(f"LLM generation failed: {e}")
            yield "An error occurred while generating the response."

    return StreamingResponse(llm_stream(), media_type="text/plain; charset=utf-8")
