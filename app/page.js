'use client'
import { Box, Button, Stack, TextField, AppBar, Toolbar, Typography } from '@mui/material'
import { useState } from 'react'
import Markdown from 'react-markdown'


export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm the Rate My Professor support assistant. How can I help you today?`,
    },
  ])
  const [message, setMessage] = useState('')

  const sendMessage = async () => {
    setMessage('')
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ])

    const response = fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, { role: 'user', content: message }]),
    }).then(async (res) => {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let result = ''

      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result
        }
        const text = decoder.decode(value || new Uint8Array(), { stream: true })
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ]
        })
        return reader.read().then(processText)
      })
    })
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display="inline-block"
      // flexDirection="row"
      justifyContent="center"
      alignItems="center"
      bgcolor={'#e9edc9'}
      
    >
      
        <Box
        align={'center'}
        m={5}>
          <Typography variant="h5">Welcome, to</Typography>
          <Typography variant="h3">Professor Insight 👨‍🏫👩‍🏫</Typography>
          <Typography variant="h5">Learn more about a professor or find the perfect professor for you</Typography>
        </Box>
          <Stack
            direction={'column'}
            maxWidth="100vw"
            height="700px"
            border="1px solid black"
            p={2}
            spacing={3}
            bgcolor={'#fefae0'}
            m={2}
            alignContent={'right'}
            borderRadius={4}

          >
            {/* <Box
              display="block"
              align="center"
              alignItems="center"
              style={{ backgroundColor: 'rgba(16, 116, 171, 0.3)' }}
              color="white"
              borderRadius={6}
              p={2}
              position="sticky"
              top={0}
              zIndex={1}
            >
              <Typography variant="h5">BrightMind </Typography>
              <Typography variant="subtitle1">Your Mental Well-being Friend</Typography>
            </Box> */}
            <Stack
              direction={'column'}
              spacing={2}
              flexGrow={1}
              overflow="auto"
              maxHeight="100%"
            >
              {messages.map((message, index) => (
                <Box
                  key={index}
                  display="flex"
                  justifyContent={
                    message.role === 'assistant' ? 'flex-start' : 'flex-end'
                  }
                >
                  <Box
                    bgcolor={
                      message.role === 'assistant'
                        ? '#d4a373'
                        : '#ccd5ae'
                    }
                    color="white"
                    borderRadius={6}
                    p={2}
                    pl={2}
                    alignContent={'center'}
                  >
                    <Markdown>{message.content}</Markdown>
                  </Box>
                </Box>
              ))}
            </Stack>
            <Stack direction={'row'} spacing={2}>
              <TextField
                label="Message"
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button variant="contained" onClick={sendMessage}>
                Send
              </Button>
            </Stack>
          </Stack>
      
    </Box>
  )
}

