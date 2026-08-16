async function main() {
  const response = await fetch("http://127.0.0.1:11434/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen2.5vl:7b",
      stream: false,
      format: "json",
      messages: [
        {
          role: "user",
          content: 'Return JSON exactly: {"ok":true}',
        },
      ],
      options: {
        temperature: 0.2,
        num_predict: 50,
      },
    }),
  });

  console.log("STATUS:", response.status);
  console.log("BODY:", await response.text());
}

main().catch((error) => {
  console.error("ERROR:", error);
  process.exitCode = 1;
});
