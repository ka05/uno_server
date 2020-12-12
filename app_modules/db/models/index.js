// export * from './challenges'
// export * from './chat-messages'
// export * from './games'
// export * from './users'

module.exports = {
  ...require('./challenges'),
  ...require('./chat-messages'),
  ...require('./games'),
  ...require('./users'),
}