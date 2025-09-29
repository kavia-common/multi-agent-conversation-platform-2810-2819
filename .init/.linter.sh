#!/bin/bash
cd /home/kavia/workspace/code-generation/multi-agent-conversation-platform-2810-2819/multi_agent_chatbot_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

