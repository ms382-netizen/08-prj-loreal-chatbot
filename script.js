// Paste your deployed Cloudflare Worker URL here (after Step 6)
const WORKER_URL = "https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev";

const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chatWindow = document.getElementById("chatWindow");
const latestQuestion = document.getElementById("latestQuestion");

const SYSTEM_PROMPT = `You are the L'Oréal Beauty Advisor, a friendly, knowledgeable assistant for L'Oréal's products: makeup, skincare, haircare, and fragrance.
- Help users discover L'Oréal products and build personalized routines and recommendations.
- Ask a short follow-up question when you need more detail (skin type, hair type, concerns, budget).
- Remember details the user shares, like their name, and use them naturally.
- Keep answers clear and concise, and use short lists for routines.
- You may answer general beauty questions (application tips, ingredients, routines).
- If a question is unrelated to L'Oréal products, routines, recommendations, or beauty, politely decline in one sentence and steer back to how you can help with beauty.
- Never invent specific product claims or prices. If unsure, say so.`;

// Conversation history: sent with every request so the bot remembers context
const messages = [{ role: "system", content: SYSTEM_PROMPT }];

function addMessage(text, role) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return div;
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  // Show the latest question above the chat (resets each time)
  latestQuestion.hidden = false;
  latestQuestion.innerHTML = "<strong>You asked:</strong> ";
  latestQuestion.append(document.createTextNode(text));

  addMessage(text, "user");
  messages.push({ role: "user", content: text });
  userInput.value = "";
  sendBtn.disabled = true;
  const thinking = addMessage("Thinking…", "ai thinking");

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o", messages, max_tokens: 500 }),
    });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);

    const data = await response.json();
    const reply = data.choices[0].message.content;

    thinking.remove();
    addMessage(reply, "ai");
    messages.push({ role: "assistant", content: reply });
  } catch (err) {
    console.error(err);
    thinking.remove();
    messages.pop(); // drop the unanswered user message so history stays clean
    addMessage(
      "Sorry, I couldn't reach the advisor. Check your connection and try again.",
      "ai",
    );
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
});
