const express = require('express');
const { Readable } = require('stream');
const Plan = require('../models/Plan');
const { complete, streamChat } = require('../lib/openrouter');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

const SYSTEM_PROMPT =
  'You are EcoPlan, an expert in sustainable manufacturing and circular production. ' +
  'You help factory owners and product designers optimize production plans to reduce carbon emissions, ' +
  'water usage, electricity consumption, and increase the use of recycled materials. ' +
  'Always be concrete, practical, and specific to the product in question.';

function parseJson(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    return null;
  }
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function sanitizePlan(raw) {
  const r = raw || {};
  const baseline = r.baseline || {};
  const optimized = r.optimized || {};
  return {
    title: String(r.title || 'Optimized production plan').slice(0, 140),
    productType: String(r.productType || 'generic').slice(0, 60),
    description: String(r.description || '').slice(0, 3000),
    materials: Array.isArray(r.materials) ? r.materials.map((m) => String(m).slice(0, 80)) : [],
    steps: Array.isArray(r.steps) ? r.steps.map((s) => String(s).slice(0, 300)) : [],
    baseline: {
      co2: toNumber(baseline.co2),
      water: toNumber(baseline.water),
      electricity: toNumber(baseline.electricity),
      material: toNumber(baseline.material),
    },
    optimized: {
      co2: toNumber(optimized.co2),
      water: toNumber(optimized.water),
      electricity: toNumber(optimized.electricity),
      material: toNumber(optimized.material),
    },
  };
}

// POST /api/ai/optimize  { productType, materials?, constraints? }
router.post('/optimize', async (req, res, next) => {
  try {
    const { productType, materials, constraints } = req.body || {};
    if (!productType) return res.status(400).json({ error: 'productType is required' });

    const constraintText = constraints ? `\nHard constraints from the user:\n${constraints}` : '';
    const materialText = materials?.length ? `\nPreferred/recycled materials: ${materials.join(', ')}` : '';

    const prompt =
      `Create a detailed, optimized production plan for: "${productType}".` +
      materialText +
      constraintText +
      '\n\nReturn ONLY a JSON object (no markdown fences) with this exact shape:\n' +
      '{\n' +
      '  "title": "short catchy title",\n' +
      '  "productType": "shoes | tyres | cans | ...",\n' +
      '  "description": "2-4 sentence summary of the optimized approach",\n' +
      '  "materials": ["recycled material list"],\n' +
      '  "steps": ["step 1", "step 2", ... 4-8 concrete manufacturing steps],\n' +
      '  "baseline": { "co2": <kg CO2e per unit for conventional process>, "water": <liters per unit>, "electricity": <kWh per unit>, "material": <percent virgin material, 0-100> },\n' +
      '  "optimized": { "co2": <kg CO2e per unit optimized>, "water": <liters per unit>, "electricity": <kWh per unit>, "material": <percent recycled material, 0-100> }\n' +
      '}\n' +
      'Make the optimized values clearly better than baseline (lower co2/water/electricity, higher recycled %). ' +
      'Keep numbers realistic for the product.';

    const content = await complete({ messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }], json: true });
    const parsed = parseJson(content);
    if (!parsed) return res.status(502).json({ error: 'Could not parse LLM response', raw: content });

    const plan = sanitizePlan(parsed);
    if (plan.baseline.co2 === 0 && plan.optimized.co2 === 0 && plan.baseline.water === 0) {
      return res.status(502).json({ error: 'LLM returned unusable metrics', raw: content });
    }
    res.json({ plan });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/chat  { messages: [{role, content}], planId? }  -> SSE stream
router.post('/chat', async (req, res, next) => {
  try {
    const { messages, planId } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    let context = [];
    if (planId) {
      const plan = await Plan.findById(planId).populate('author', 'name');
      if (plan) {
        context = [
          {
            role: 'system',
            content:
              'The user is asking about this specific production plan (from user ' +
              (plan.author?.name || 'unknown') + '):\n' +
              JSON.stringify(
                {
                  title: plan.title,
                  productType: plan.productType,
                  description: plan.description,
                  materials: plan.materials,
                  steps: plan.steps,
                  baseline: plan.baseline,
                  optimized: plan.optimized,
                },
                null,
                2
              ) +
              '\nAnswer questions about this plan specifically, and feel free to suggest improvements.',
          },
        ];
      }
    }

    const upstream = await streamChat({ messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...context, ...messages] });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    Readable.fromWeb(upstream).pipe(res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;