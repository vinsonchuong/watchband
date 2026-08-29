export const schema = {
  albums: {
    schema: {
      version: 0,
      primaryKey: 'id',
      type: 'object',
      properties: {
        id: {type: 'string', maxLength: 36},
        updatedAt: {type: 'integer'},
        name: {type: 'string'},
        artist: {type: 'string'},
        tracks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {type: 'string', maxLength: 36},
              name: {type: 'string'},
            },
          },
        },
      },
      attachments: {},
    },
  },
}
