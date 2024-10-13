import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json(); // Parse the request body

    // Forward the request to your Flask API
    const flaskResponse = await fetch('http://localhost:8000', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body), // Forward the request body to Flask
    });

    if (!flaskResponse.ok) {
      const errorText = await flaskResponse.text();
      return NextResponse.json({ error: errorText }, { status: flaskResponse.status });
    }

    // After Flask updates the CSV, send a success message back to the frontend
    return NextResponse.json({ message: 'Update successful' }, { status: 200 });

  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
