from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from .llm_client import query_llm

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Chatbot backend is running"}

@app.post("/chat")
async def chat(request: Request):
    data = await request.json()
    prompt = data.get("prompt", "")
    if not prompt:
        return {"error": "Prompt is required"}, 400

    def llm_stream():
        result = query_llm(prompt)
        if not isinstance(result, str):
            result = ''.join(result)  # Join generator output into a string
        yield result

    return StreamingResponse(llm_stream(), media_type="text/plain; charset=utf-8")
