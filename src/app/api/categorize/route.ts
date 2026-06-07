import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { description, apiKey } = await req.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'Description is required and must be a string' }, { status: 400 });
    }

    const activeKey = apiKey || process.env.GEMINI_API_KEY;

    if (activeKey && activeKey.trim() !== '') {
      // Execute live Gemini 1.5 Flash classification request
      const prompt = `Classify this transaction: "${description}"`;
      
      const systemInstruction = `You are a professional financial transactions classifier. Analyze the raw transaction log description, extract a clean, recognizable merchant/source name (e.g. "Uber" from "UBER * TRIP HELP.UBER.COM", or "Netflix" from "NETFLIX.COM* 866-569-7530 CA"), and classify it into EXACTLY ONE of the following financial categories:
- Salary
- Freelance & Side Hustles
- Investments
- Other Income
- Housing & Rent
- Groceries
- Dining & Drinks
- Utilities
- Transportation
- Entertainment & Leisure
- Subscriptions
- Other Expense

Response MUST be a JSON object matching this schema exactly:
{
  "category": "String matching one of the 12 categories exactly",
  "cleanMerchantName": "Cleaned, readable merchant or source name",
  "confidence": Float between 0.0 and 1.0 representing classification confidence
}`;

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }]
              }],
              systemInstruction: {
                parts: [{ text: systemInstruction }]
              },
              generationConfig: {
                responseMimeType: 'application/json'
              }
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          console.error('Gemini API Error details:', errText);
          throw new Error(`Gemini API responded with status ${response.status}`);
        }

        const resData = await response.json();
        const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawText) {
          const parsed = JSON.parse(rawText.trim());
          if (parsed && typeof parsed === 'object' && 'category' in parsed) {
            return NextResponse.json({
              category: parsed.category,
              cleanMerchantName: parsed.cleanMerchantName || description,
              confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
              method: 'gemini'
            });
          }
        }
      } catch (geminiError) {
        console.error('Error invoking Gemini endpoint, falling back to local simulation:', geminiError);
      }
    }

    // Fallback: Local rule-based classifier (Simulated AI)
    const descLower = description.toLowerCase();
    let category = 'Other Expense';
    let cleanMerchantName = description;
    let confidence = 0.85;

    // Extraction & Classification Rules
    if (descLower.includes('blue bottle') || descLower.includes('starbucks') || descLower.includes('dining') || descLower.includes('dinner') || descLower.includes('cafe') || descLower.includes('sushi') || descLower.includes('coffee') || descLower.includes('latte')) {
      category = 'Dining & Drinks';
      cleanMerchantName = descLower.includes('starbucks') ? 'Starbucks' : descLower.includes('blue bottle') ? 'Blue Bottle Coffee' : 'Local Diner/Cafe';
      confidence = 0.95;
    } else if (descLower.includes('uber') || descLower.includes('lyft') || descLower.includes('taxi') || descLower.includes('cab') || descLower.includes('ride') || descLower.includes('transport') || descLower.includes('tesla') || descLower.includes('car')) {
      category = 'Transportation';
      cleanMerchantName = descLower.includes('uber') ? 'Uber' : descLower.includes('lyft') ? 'Lyft' : descLower.includes('tesla') ? 'Tesla' : 'Transportation';
      confidence = 0.98;
    } else if (descLower.includes('netflix') || descLower.includes('spotify') || descLower.includes('hulu') || descLower.includes('youtube') || descLower.includes('premium') || descLower.includes('sub') || descLower.includes('subscription')) {
      category = 'Subscriptions';
      cleanMerchantName = descLower.includes('netflix') ? 'Netflix' : descLower.includes('spotify') ? 'Spotify' : descLower.includes('hulu') ? 'Hulu' : 'Subscription Service';
      confidence = 0.99;
    } else if (descLower.includes('wholefoods') || descLower.includes('whole foods') || descLower.includes('groceries') || descLower.includes('foods') || descLower.includes('trader joes') || descLower.includes('trader')) {
      category = 'Groceries';
      cleanMerchantName = descLower.includes('whole') ? 'Whole Foods' : descLower.includes('trader') ? 'Trader Joe\'s' : 'Groceries';
      confidence = 0.95;
    } else if (descLower.includes('rent') || descLower.includes('housing') || descLower.includes('apartment') || descLower.includes('landlord')) {
      category = 'Housing & Rent';
      cleanMerchantName = 'Monthly Rent';
      confidence = 0.90;
    } else if (descLower.includes('electric') || descLower.includes('utility') || descLower.includes('conedison') || descLower.includes('water') || descLower.includes('internet') || descLower.includes('fios') || descLower.includes('zap') || descLower.includes('gas')) {
      category = 'Utilities';
      cleanMerchantName = descLower.includes('conedison') ? 'ConEd Utility' : descLower.includes('fios') ? 'Verizon Fios' : 'Utilities';
      confidence = 0.92;
    } else if (descLower.includes('salary') || descLower.includes('payroll') || descLower.includes('deposit') || descLower.includes('wire') || descLower.includes('google') || descLower.includes('valk')) {
      category = 'Salary';
      cleanMerchantName = descLower.includes('google') ? 'Google Payroll' : descLower.includes('valk') ? 'Valk Horizon Ventures' : 'Salary Deposit';
      confidence = 0.90;
    } else if (descLower.includes('freelance') || descLower.includes('contract') || descLower.includes('side') || descLower.includes('design') || descLower.includes('consulting')) {
      category = 'Freelance & Side Hustles';
      cleanMerchantName = 'Freelance UI/UX Contract';
      confidence = 0.88;
    } else if (descLower.includes('amazon') || descLower.includes('amzn') || descLower.includes('walmart') || descLower.includes('target') || descLower.includes('mktp') || descLower.includes('shopping')) {
      category = 'Other Expense'; // Default fallback, but let's clean the merchant
      cleanMerchantName = descLower.includes('amazon') || descLower.includes('amzn') ? 'Amazon' : descLower.includes('walmart') ? 'Walmart' : descLower.includes('target') ? 'Target' : 'Retail Shopping';
      confidence = 0.90;
    } else {
      // Fallback clean merchant
      const cleanParts = description.split(/[\*\-]/);
      cleanMerchantName = cleanParts[cleanParts.length > 1 ? 1 : 0]?.trim() || description;
    }

    return NextResponse.json({
      category,
      cleanMerchantName,
      confidence,
      method: 'simulated'
    });
  } catch (error) {
    console.error('Categorize API route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
