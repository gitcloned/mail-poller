module.exports = {
  options: {
    appname: 'mail-parser'
  },
  collections: [{
    name: 'mails',
    indexes: [{
      keys: {
        messageId: 1
      },
      options: {
        unique: true,
        background: true
      }
    }],
    documents: []
  }]
}