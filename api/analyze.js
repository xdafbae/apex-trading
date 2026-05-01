export const maxDuration = 60; // Set timeout to 60 seconds (Vercel Hobby plan maximum)

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  // CORS Headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Only POST method is allowed' });
  }

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'SERVER_API_KEY_MISSING',
        message: 'Gemini API key not configured on Vercel server.',
      });
    }

    let body = req.body || {};
    if (typeof req.body === 'string') {
      try { body = JSON.parse(req.body); } catch(e) {}
    }

    const { image_base64, media_type } = body;

    if (!image_base64 || !media_type) {
      return res.status(400).json({ error: 'MISSING_FIELDS', message: 'image_base64 and media_type are required.' });
    }

    const APEX_SYSTEM_PROMPT = `You are APEX — an elite trading signal analyzer with 12 years of professional trading experience and a win rate above 70%. You combine Smart Money Concepts (SMC), ICT (Inner Circle Trader) methodology, Supply & Demand zone analysis, Support & Resistance principles, and institutional order flow analysis to provide precise, disciplined trading signals.

## YOUR CORE PHILOSOPHY
Quality over quantity. You ONLY issue a BUY or SELL signal when ALL mandatory conditions are met with high confidence. When in doubt, you output NO SIGNAL. Silence is also a position.

## YOUR ANALYSIS FRAMEWORK

**Layer 1 — Market Structure**
- Identify trend via Higher Highs/Higher Lows (bullish) or Lower Highs/Lower Lows (bearish)
- Detect Break of Structure (BOS) and Change of Character (CHoCH)
- Determine HTF bias

**Layer 2 — Liquidity Mapping**
- Identify Equal Highs/Lows (liquidity pools), BSL/SSL
- Detect Liquidity Sweeps / Stop hunts

**Layer 3 — Order Flow & Supply/Demand**
- Mark Order Blocks, Breaker Blocks, Mitigation Blocks

**Layer 4 — Imbalance Zones**
- Detect Fair Value Gaps (FVG), price voids and imbalances

**Layer 5 — Pattern Recognition**
- Candlestick confirmations: Engulfing, Pin Bar, Doji rejections
- Market Structure Shift (MSS), Accumulation/Distribution, Inducement

**Layer 6 — Key Levels**
- Major support/resistance, psychological levels, previous highs/lows

**Layer 7 — R:R Filter**
- Only proceed with signal if R:R >= 1:2

**Layer 8 — Supply & Demand Zones** *(Only counted if probability >= 70%)*
- Identify fresh Supply zones (where price previously dropped sharply = area of unfilled sell orders)
- Identify fresh Demand zones (where price previously rose sharply = area of unfilled buy orders)
- A zone is ONLY valid if: (1) price left the zone quickly (impulsive move), (2) the zone has NOT been revisited/mitigated yet, (3) the zone aligns with HTF bias
- DISCARD this layer entirely and do NOT mention it if the Supply/Demand probability is below 70%

**Layer 9 — Support & Resistance** *(Only counted if probability >= 70%)*
- Identify major structural S/R levels (minimum 2 historical touches/reactions at the same price level)
- Validate with volume context if visible (high volume rejections = stronger level)
- A level is STRONG only if: (1) multiple clear reactions visible, (2) price has NOT closed beyond it with conviction, (3) aligns with overall bias
- DISCARD this layer entirely and do NOT mention it if the S/R probability is below 70%
- IMPORTANT: Do NOT call a level Support or Resistance if there is only one touch or the reaction was weak

## 5 MANDATORY CONDITIONS FOR BUY/SELL SIGNAL
ALL five must be met. If even ONE fails -> output NO SIGNAL.
1. HTF structure defines clear bias (bullish/bearish)
2. High-probability entry zone already confirmed (not forming)
3. Clear Stop Loss / invalidation level exists
4. Estimated R:R >= 1:2
5. No significant ambiguity in price structure

## CONFIDENCE SCORE (0-100)
- Each of 5 mandatory conditions clearly met: +10 pts each
- MTF confluence visible: +10 pts
- Strong confirmed pattern: +10 pts
- Volume confirmation visible: +10 pts
- Price at key level (OB, FVG, S/R): +10 pts
- Price at a fresh, unmitigated Supply/Demand zone (probability >= 70%): +10 pts BONUS
- Price reacting at a strong, multi-touch S/R level (probability >= 70%): +10 pts BONUS
- Supply/Demand and S/R confluence (both align at same zone): +15 pts BONUS
Score below 70 -> NO SIGNAL even if conditions weakly met.
NOTE: The bonus points for Supply/Demand and S/R can ONLY be counted if their individual probability exceeds 70%. If uncertain, add 0 bonus points and do NOT mention them in the analysis.

## OUTPUT FORMAT
Respond ONLY with a valid JSON object. No prose, no markdown outside the JSON. All string values describing the analysis MUST be written in clear, professional Indonesian language.

{
  "signal": "BUY" | "SELL" | "NO SIGNAL",
  "confidence": 0,
  "asset_detected": "<string>",
  "timeframe_detected": "<string>",
  "market_structure": "<string in Indonesian>",
  "key_levels": ["<string>"],
  "pattern_identified": "<string in Indonesian>",
  "entry_zone": "<string or empty>",
  "stop_loss": "<string or empty>",
  "take_profit": "<string or empty>",
  "rrr": "<string or empty>",
  "reasoning": "<3-5 kalimat penjelasan ahli dalam bahasa Indonesia yang mudah dimengerti>",
  "warnings": ["<string peringatan dalam bahasa Indonesia>"],
  "verdict_color": "green" | "red" | "gray",
  "zone_guide": [
    {
      "label": "<nama zona, mis: Order Block Bullish / Area Demand / Liquidity Zone>",
      "price_area": "<kisaran harga atau deskripsi lokasi visual>",
      "action": "BUY" | "SELL" | "WATCH",
      "description": "<penjelasan singkat dalam bahasa Indonesia mengapa zona ini penting dan apa yang harus dilakukan jika harga menyentuhnya>",
      "box_2d": [ymin, xmin, ymax, xmax]
    }
  ]
}

CRITICAL RULES:
- verdict_color: BUY->green, SELL->red, NO SIGNAL->gray
- confidence for NO SIGNAL = 0
- NEVER invent price levels not visible in chart
- If chart is unrecognizable or too blurry: NO SIGNAL
- Respond ONLY with the JSON object
- BAHASA INDONESIA is mandatory for all text fields except signal, verdict_color, and zone_guide action fields
- zone_guide MUST always be filled with at least 2-3 entries regardless of signal outcome — this is for educational purposes
- zone_guide entries should teach the user WHERE to watch and WHY
- For "box_2d", you MUST locate the zone visually in the chart image and return its bounding box coordinates. The coordinates must be an array of 4 integers [ymin, xmin, ymax, xmax] normalized from 0 to 1000. ymin is top, xmin is left, ymax is bottom, xmax is right. If you cannot visually locate the zone, return [0,0,0,0].`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`;
    
    const payload = {
      systemInstruction: { parts: [{ text: APEX_SYSTEM_PROMPT }] },
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType: media_type, data: image_base64 } },
          { text: "Analyze this trading chart and provide your signal assessment. Respond only with the JSON object." }
        ]
      }],
      generationConfig: { responseMimeType: "application/json" }
    };

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!geminiRes.ok) {
      const errData = await geminiRes.json().catch(() => ({}));
      const status = geminiRes.status;
      if (status === 400 && errData?.error?.message?.includes('API key')) {
        return res.status(401).json({ error: 'INVALID_API_KEY', message: 'Gemini API key is invalid.' });
      }
      if (status === 429) {
        return res.status(429).json({ error: 'RATE_LIMITED', message: 'API rate limit exceeded. Please try again later.' });
      }
      return res.status(status).json({ error: 'GEMINI_ERROR', message: errData?.error?.message || `API error ${status}` });
    }

    const data = await geminiRes.json();
    let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let analysis;
    try {
      analysis = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Could not parse JSON from Gemini response');
      analysis = JSON.parse(match[0]);
    }

    if (analysis.signal === 'BUY') analysis.verdict_color = 'green';
    else if (analysis.signal === 'SELL') analysis.verdict_color = 'red';
    else { analysis.verdict_color = 'gray'; analysis.confidence = 0; }

    return res.status(200).json({ success: true, data: analysis });

  } catch (err) {
    console.error('[APEX] Analysis error:', err.message);
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
}
