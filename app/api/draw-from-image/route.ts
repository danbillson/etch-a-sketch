import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    const canvasWidth = parseInt(formData.get("canvasWidth") as string) || 600;
    const canvasHeight = parseInt(formData.get("canvasHeight") as string) || 400;
    
    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }
    
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const mimeType = file.type || "image/png";
    const dataUrl = `data:${mimeType};base64,${base64Image}`;
    
    // Use OpenAI Vision API to analyze the image
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and describe its main features, edges, and contours. Focus on the most important visual elements that would make a good line drawing. Keep your response brief - just describe what you see.",
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 200,
    });
    
    const analysis = response.choices[0]?.message?.content || "";
    
    // Return the analysis and base64 image data
    // The client will handle the actual path generation using Canvas API
    return NextResponse.json({
      analysis,
      imageData: dataUrl,
      success: true,
    });
    
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json(
      { error: "Failed to process image", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

