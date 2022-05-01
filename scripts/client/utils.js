const messageTypes = {
  error: {
    label: 'Error',
    color: [255, 0, 0]
  },
  info: {
    label: 'Info',
    color: [0, 255, 255]
  },
  success: {
    label: 'Success',
    color: [0, 255, 0]
  }
}

function chatPrint (message, type) {
  let messageType = messageTypes['info']
  if (type && messageTypes[type]) messageType = messageTypes[type]

  emit('chat:addMessage', {
    args: [
      messageType.label,
      message
    ],
    color: messageType.color
  })
}