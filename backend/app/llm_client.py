import ollama

def query_llm(prompt: str):
    stream = ollama.chat(
        model="gemma3:1b-it-qat",
        messages=[{"role": "user", "content": prompt}],
        stream=True
    )
    for chunk in stream:
        yield chunk['message']['content']
