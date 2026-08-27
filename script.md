# EcoPlan — 10-Minute Presentation Script

**Speaker cues:** 🎬 = action / demo on screen · 💬 = spoken lines · ⏱ = time marker

---

## 1. Hook — the hidden cost in every factory (0:00 – 1:30)

⏱ 0:00 · 💬
> Good morning, everyone. Quick question for you: how much energy does it take to make one sneaker? About 3 kilowatt-hours. How much water for one aluminium can? Roughly 40 liters. And every one of those steps emits CO₂.
>
> Manufacturing is responsible for about a fifth of global emissions — and most of it comes down to *decisions on the factory floor*. Which material we use. How much water a line needs. Whether the electricity is recycled-friendly.
>
> The catch? These smarter, greener ways of producing exist — but they're scattered across factories, PDFs, and people's heads. Nobody shares them.

🎬 Show Feed screen (or screenshot)

⏱ 0:45 · 💬
> Today I'm going to show you **EcoPlan** — a social platform where engineers and factory owners share, discuss, and *generate* optimized production plans. Plans that use less carbon, less water, less electricity, and more recycled material.

---

## 2. The idea — a social network for greener factories (1:30 – 3:00)

🎬 Slide: "Post a plan → it gets adopted → less footprint"

⏱ 1:30 · 💬
> Here's the core idea: treat production plans like posts on a social feed. One factory posts *"I cut tyre curing energy 54% with solar heat"* — and another factory halfway across the world finds it, learns from it, and adopts it.
>
> Every plan on EcoPlan shows **four numbers** compared against a conventional baseline:
> - CO₂ emissions per unit
> - Water usage per unit
> - Electricity per unit
> - Recycled-material content

⏱ 2:15 · 💬
> And because this is a social platform, people can **save** plans they like, **comment** on them — even start threaded conversations — and **search** the whole feed by product or keyword.

🎬 Slide: Feature list — Share · Search · Save · Comment · AI Assistant

---

## 3. Live demo (3:00 – 7:00)

🎬 Open the app at localhost:5173, logged in as demo account

### 3a. The Feed (3:00 – 3:40)

⏱ 3:00 · 💬
> Let me show you the real thing. This is the feed — seeded with real-looking plans for tyres, sneakers, and beverage cans. Each card shows the product type, the savings as percentages, and how many comments it has.
>
> Notice the search box and the product filter up top. Let's filter to just "shoes"… and here's our mono-material recycled sneaker.

🎬 Click into the sneaker plan

### 3b. Plan detail + metrics (3:40 – 4:30)

⏱ 3:40 · 💬
> This is a full plan. We see the summary, the materials list, and the step-by-step production process. But the heart of it is this comparison chart — conventional versus optimized. CO₂ down 60%, water down 88%, energy down two-thirds, and 90% recycled content.
>
> Anyone can **save** this plan, and logged-in users can **edit or delete** their own.

### 3c. Threaded comments (4:30 – 5:10)

⏱ 4:30 · 💬
> Under every plan there's a live discussion. Let me reply to an existing comment — and you'll see replies can nest as deep as the conversation wants, with @mentions and a green reply rail so it stays readable.
>
> That's real-time conversation between engineers about a production process.

### 3d. The AI Assistant (5:10 – 7:00)

⏱ 5:10 · 💬
> Here's the part I'm most excited about. EcoPlan has a built-in **AI assistant**, powered by an LLM through the OpenRouter API.
>
> Two things it does. First — **ask about any plan**. I can open the sneaker plan and ask *"how would this scale to 10,000 units a day?"* and the AI answers in context, streaming in live.

🎬 Click "Ask AI about this plan", watch the stream

⏱ 5:50 · 💬
> Second — **generate a brand-new optimized plan**. Watch this: I'll ask it for a production plan for… beverage cans, with a hard constraint of no virgin plastic. The AI drafts the whole thing — title, materials, 5–6 concrete steps, and a full baseline-versus-optimized metric table. One click and it's published to the community.

🎬 Generate plan for "beverage cans" → publish

---

## 4. How it's built (7:00 – 8:30)

🎬 Slide: Architecture diagram

⏱ 7:00 · 💬
> Under the hood it's a clean three-layer stack:
> - **React** frontend with Vite, Tailwind CSS, and React Router — fully responsive, with a neumorphic design language.
> - **Express + MongoDB** backend, with Mongoose schemas for users, plans, and comments.
> - **JWT authentication** — register, log in, and every mutation is protected.

⏱ 7:30 · 💬
> The AI layer is a thin integration with **OpenRouter**: one endpoint generates structured plan JSON, and a second streams chat responses over SSE so the answers feel instant. Context-aware questions inject the plan's data straight into the prompt.

⏱ 8:00 · 💬
> Comments use a self-referencing `parent` field on the comment model, so threading is unlimited-depth with zero special casing on the backend.

---

## 5. Impact & why it matters (8:30 – 9:30)

🎬 Slide: "Share once → adopt everywhere"

⏱ 8:30 · 💬
> What makes EcoPlan powerful is the **compounding effect**. One optimized plan doesn't just help one factory — it gets saved, discussed, and copied by a hundred. The AI lowers the barrier so even a factory with no sustainability team can get a credible, metrics-driven starting point in under a minute.
>
> The four metrics are the same language every plant manager already speaks: kilograms of CO₂, liters of water, kilowatt-hours, percent recycled.

---

## 6. Closing (9:30 – 10:00)

⏱ 9:30 · 💬
> EcoPlan turns sustainability from a corporate report into a *social, shareable, everyday habit*. Share the win, learn from the community, or just ask the AI.
>
> Thank you — happy to take questions. The demo account is on the screen for you to try it yourself.

🎬 Show login screen / hand the laptop over