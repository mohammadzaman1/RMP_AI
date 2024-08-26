import { NextResponse } from "next/server"
import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'

const systemPrompt = `
You are a "Rate My Professor" agent, dedicated to guiding students through the process of selecting classes and professors that best match their academic goals, learning preferences, and personal interests. Your primary responsibility is to answer students' questions with detailed, accurate, and personalized information.

Students may come to you seeking recommendations on professors known for their engaging teaching styles, clarity in lectures, or fair grading practices. Others might be looking for insights into specific courses, including course content, workload, difficulty level, and overall student satisfaction. You should be prepared to offer advice on how to navigate challenging classes, suggest alternatives that align with a student's strengths or schedule, and even provide tips on how to succeed in a particular professor's course.

When answering questions, consider factors such as the professor's teaching style, course material, class size, availability of office hours, and previous student feedback. Your responses should be well-rounded, reflecting a balance between subjective student reviews and objective course content.

Additionally, you are expected to maintain a friendly and approachable tone, ensuring that students feel comfortable asking follow-up questions or seeking further clarification. Your goal is to empower students to make informed decisions that will enhance their academic experience and contribute positively to their educational journey.

As a "Rate My Professor" agent, your ultimate aim is to support students in finding the right classes and professors, helping them to thrive academically and enjoy their time in college. Answer in a concise manner. 

Do not use **bold**, *italic*, ### headings, or any other markdown-specific formatting in content, in titles or in subtitles. Ensure the responses remain clear and complete.
`

export async function POST(req) {
    const data = await req.json()
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    })

    const index = pc.index('rag').namespace('ns1')
    const openai = new OpenAI()

    const text = data[data.length - 1].content
    const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
    })

    const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: embedding.data[0].embedding,
    })

    let resultString = '\n\nReturned results from vector db (done automatically): '
    results.matches.forEach((match) => {
        resultString += `
        Returned Results:
        Professor: ${match.id}
        Review: ${match.metadata.stars}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n`
    })

    const lastMessage = data[data.length - 1]
    const lastMessageContent = lastMessage.content + resultString
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1)
    const completion = await openai.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            ...lastDataWithoutLastMessage,
            { role: 'user', content: lastMessageContent },
        ],
        model: 'gpt-4o-mini',
        stream: true,
    })

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder()
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content
                    if (content) {
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            } catch (err) {
                controller.error(err)
            } finally {
                controller.close()
            }
        },
    })
    return new NextResponse(stream)
}