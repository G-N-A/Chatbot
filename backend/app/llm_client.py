import ollama

def query_llm(prompt: str):
    stream = ollama.chat(
        model="deepseek-r1:1.5b-qwen-distill-fp16",
        messages=[{"role": "user", "content": prompt}],
        stream=True
    )
    for chunk in stream:
        yield chunk['message']['content']
